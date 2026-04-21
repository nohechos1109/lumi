import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import {
  canAccessServicios,
  canCreateServiceManual,
  canCreateServiceWalkIn,
  canViewOwnServicesOnly,
} from '@/lib/permissions'
import {
  listServices,
  listServicesByOrder,
  listWalkInServices,
  listServicesByTechnician,
  createService,
  getServiceOrder,
  listOrderTechnicians,
  assignTechnician,
  isTechnicianOnOrder,
  OrderInBorradorError,
  RequiredFieldsError,
} from '@/lib/queries/servicios'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canAccessServicios(session.role)) return forbidden()

  const orderId = req.nextUrl.searchParams.get('order_id')
  const scope = req.nextUrl.searchParams.get('scope')

  if (canViewOwnServicesOnly(session.role)) {
    const list = await listServicesByTechnician(session.userId)
    return NextResponse.json(list)
  }

  if (orderId) {
    const list = await listServicesByOrder(orderId)
    return NextResponse.json(list)
  }

  if (scope === 'walk_in') {
    const list = await listWalkInServices()
    return NextResponse.json(list)
  }

  const list = await listServices()
  return NextResponse.json(list)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canCreateServiceManual(session.role)) return forbidden()

  const body = await req.json()
  const walkIn = !body.service_order_id
  if (walkIn && !canCreateServiceWalkIn(session.role)) {
    return forbidden()
  }
  if (walkIn && !body.customer_id) {
    return NextResponse.json({ error: 'customer_id requerido para walk-in' }, { status: 400 })
  }
  // Tecnico sólo puede crear servicio dentro de orden donde está asignado.
  if (canViewOwnServicesOnly(session.role) && body.service_order_id) {
    const allowed = await isTechnicianOnOrder(body.service_order_id, session.userId)
    if (!allowed) return forbidden()
  }

  try {
    // Inherit tipo_lugar from parent order
    let tipoLugar = body.tipo_lugar ?? null
    if (body.service_order_id && !tipoLugar) {
      const order = await getServiceOrder(body.service_order_id)
      if (order?.tipo_lugar) tipoLugar = order.tipo_lugar
    }

    const srv = await createService({
      service_order_id: body.service_order_id ?? null,
      unidad_id: body.unidad_id ?? null,
      ruta_id: body.ruta_id ?? null,
      customer_id: body.customer_id ?? null,
      motivo_visita: body.motivo_visita ?? null,
      referencia: body.referencia ?? null,
      ubicacion: body.ubicacion ?? null,
      ubicacion_txt: body.ubicacion_txt ?? null,
      tipo_lugar: tipoLugar,
      comentarios_soporte: body.comentarios_soporte ?? null,
      fecha_hora_agendada: body.fecha_hora_agendada ?? null,
      fecha_hora_limite: body.fecha_hora_limite ?? null,
      // orphan walk-in created by non-tecnico defaults to visible for all techs
      assign_all_technicians: walkIn && !canViewOwnServicesOnly(session.role) ? true : false,
      iniciado_por: session.userId,
    })

    // Propagate order technicians to new service
    if (body.service_order_id) {
      const orderTechs = await listOrderTechnicians(body.service_order_id)
      for (const t of orderTechs) {
        await assignTechnician(srv.id, t.user_id)
      }
    }

    revalidatePath('/servicios')
    if (body.service_order_id) revalidatePath(`/servicios/orders/${body.service_order_id}`)
    return NextResponse.json(srv, { status: 201 })
  } catch (error) {
    if (error instanceof OrderInBorradorError) {
      return NextResponse.json({ error: 'La orden está en borrador.' }, { status: 409 })
    }
    if (error instanceof RequiredFieldsError) {
      return NextResponse.json({ error: 'Campos requeridos', fields: error.fields }, { status: 400 })
    }
    console.error('POST /api/servicios/services ERROR:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
