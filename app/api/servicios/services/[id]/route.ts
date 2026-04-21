import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import {
  canAccessServicios,
  canEditService,
  canDeleteServiceEntities,
  canViewOwnServicesOnly,
} from '@/lib/permissions'
import {
  getService,
  updateService,
  deleteService,
  deleteAllServiceMaterials,
  ReportNotEditableError,
  OrderInBorradorError,
} from '@/lib/queries/servicios'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canAccessServicios(session.role)) return forbidden()

  const { id } = await params
  const srv = await getService(id)
  if (!srv) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (canViewOwnServicesOnly(session.role)) {
    const allowed = srv.assign_all_technicians || srv.technicians?.some(t => t.user_id === session.userId)
    if (!allowed) return forbidden()
  }

  return NextResponse.json(srv)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canEditService(session.role)) return forbidden()

  const { id } = await params
  const body = await req.json()

  if (canViewOwnServicesOnly(session.role)) {
    const srv = await getService(id)
    const allowed = srv?.assign_all_technicians || srv?.technicians?.some(t => t.user_id === session.userId)
    if (!allowed) return forbidden()
  }

  try {
    await updateService(id, body, session.userId)
    if (body.estatus === 'cancelado') {
      await deleteAllServiceMaterials(id)
    }
    revalidatePath('/servicios')
    revalidatePath(`/servicios/services/${id}`)
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof ReportNotEditableError) {
      return NextResponse.json({ error: 'El reporte no es editable en este estado.' }, { status: 403 })
    }
    if (error instanceof OrderInBorradorError) {
      return NextResponse.json({ error: 'La orden está en borrador. Agéndala antes de iniciar servicios.' }, { status: 409 })
    }
    console.error('PATCH /api/servicios/services/[id] ERROR:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canDeleteServiceEntities(session.role)) return forbidden()

  const { id } = await params
  try {
    await deleteService(id)
    revalidatePath('/servicios')
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/servicios/services/[id] ERROR:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
