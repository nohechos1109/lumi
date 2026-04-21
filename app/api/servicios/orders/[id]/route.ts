import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import {
  canAccessServicios,
  canCreateServiceOrder,
  canDeleteServiceEntities,
} from '@/lib/permissions'
import {
  getServiceOrder,
  updateServiceOrder,
  deleteServiceOrder,
  archiveServiceOrder,
  RequiredFieldsError,
} from '@/lib/queries/servicios'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canAccessServicios(session.role)) return forbidden()

  const { id } = await params
  const order = await getServiceOrder(id)
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(order)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canCreateServiceOrder(session.role)) return forbidden()

  const { id } = await params
  const body = await req.json()

  try {
    if (body.archive === true) {
      await archiveServiceOrder(id)
    } else {
      await updateServiceOrder(id, body, session.userId)
    }
    revalidatePath('/servicios')
    revalidatePath(`/servicios/orders/${id}`)
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof RequiredFieldsError) {
      return NextResponse.json({ error: 'Campos requeridos', fields: error.fields }, { status: 400 })
    }
    console.error('PATCH /api/servicios/orders/[id] ERROR:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canDeleteServiceEntities(session.role)) return forbidden()

  const { id } = await params
  try {
    await deleteServiceOrder(id)
    revalidatePath('/servicios')
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/servicios/orders/[id] ERROR:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
