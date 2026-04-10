import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canManagePaymentSchedule } from '@/lib/permissions'
import { listScheduleItems, upsertSchedule } from '@/lib/queries/payment-schedule'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return unauthorized()
  const { id } = await params

  const items = await listScheduleItems(id)
  return NextResponse.json(items)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canManagePaymentSchedule(session.role)) return forbidden()
  const { id } = await params

  const { items } = await req.json()
  if (!Array.isArray(items)) {
    return NextResponse.json({ error: 'items debe ser un arreglo' }, { status: 400 })
  }

  await upsertSchedule(id, items)
  revalidatePath(`/ventas/${id}`)
  return NextResponse.json({ ok: true })
}
