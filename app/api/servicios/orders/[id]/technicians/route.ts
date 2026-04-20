import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canCreateServiceOrder } from '@/lib/permissions'
import { assignOrderTechnicians, removeOrderTechnician } from '@/lib/queries/servicios'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canCreateServiceOrder(session.role)) return forbidden()

  const { id } = await params
  const body = await req.json()
  const userId = body.user_id as string
  if (!userId) return NextResponse.json({ error: 'user_id requerido' }, { status: 400 })

  try {
    await assignOrderTechnicians(id, [userId])
    revalidatePath(`/servicios/orders/${id}`)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canCreateServiceOrder(session.role)) return forbidden()

  const { id } = await params
  const userId = req.nextUrl.searchParams.get('user_id')
  if (!userId) return NextResponse.json({ error: 'user_id requerido' }, { status: 400 })

  try {
    await removeOrderTechnician(id, userId)
    revalidatePath(`/servicios/orders/${id}`)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
