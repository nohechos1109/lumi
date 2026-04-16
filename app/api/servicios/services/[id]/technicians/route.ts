import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canEditService } from '@/lib/permissions'
import { assignTechnician, removeTechnician } from '@/lib/queries/servicios'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canEditService(session.role) || session.role === 'tecnico') return forbidden()

  const { id } = await params
  const body = await req.json()
  if (!body.user_id) return NextResponse.json({ error: 'user_id requerido' }, { status: 400 })

  await assignTechnician(id, body.user_id)
  revalidatePath(`/servicios/services/${id}`)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canEditService(session.role) || session.role === 'tecnico') return forbidden()

  const { id } = await params
  const userId = req.nextUrl.searchParams.get('user_id')
  if (!userId) return NextResponse.json({ error: 'user_id requerido' }, { status: 400 })

  await removeTechnician(id, userId)
  revalidatePath(`/servicios/services/${id}`)
  return NextResponse.json({ ok: true })
}
