import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import {
  canAccessServicios,
  canCreateServiceRequest,
  canApproveServiceRequest,
} from '@/lib/permissions'
import {
  listServiceRequests,
  listServiceRequestsByAssignee,
  listServiceRequestsByRequester,
  createServiceRequest,
} from '@/lib/queries/servicios'
import { createNotification } from '@/lib/queries/notifications'

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canAccessServicios(session.role)) return forbidden()

  if (canCreateServiceRequest(session.role)) {
    const list = canApproveServiceRequest(session.role)
      ? await listServiceRequests()
      : await listServiceRequestsByRequester(session.userId)
    return NextResponse.json(list)
  }

  if (canApproveServiceRequest(session.role)) {
    const list = await listServiceRequestsByAssignee(session.userId)
    return NextResponse.json(list)
  }

  return NextResponse.json([])
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canCreateServiceRequest(session.role)) return forbidden()

  const body = await req.json()
  if (!body.motivo || typeof body.motivo !== 'string') {
    return NextResponse.json({ error: 'motivo requerido' }, { status: 400 })
  }

  try {
    const sr = await createServiceRequest({
      requested_by: session.userId,
      assigned_to: body.assigned_to ?? null,
      customer_id: body.customer_id ?? null,
      motivo: body.motivo,
    })
    if (body.assigned_to) {
      await createNotification({
        user_id: body.assigned_to,
        type: 'service_request_new',
        title: 'Nueva solicitud de servicio',
        message: body.motivo,
        entity: 'service_request',
        entity_id: sr.id,
      })
    }
    revalidatePath('/servicios')
    return NextResponse.json(sr, { status: 201 })
  } catch (error) {
    console.error('POST /api/servicios/requests ERROR:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
