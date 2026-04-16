import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import {
  canAccessServicios,
  canCreateServiceManual,
  canViewOwnServicesOnly,
} from '@/lib/permissions'
import {
  listServices,
  listServicesByOrder,
  listWalkInServices,
  listServicesByTechnician,
  createService,
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
  if (walkIn && !body.customer_id) {
    return NextResponse.json({ error: 'customer_id requerido para walk-in' }, { status: 400 })
  }

  try {
    const srv = await createService({
      service_order_id: body.service_order_id ?? null,
      unidad_id: body.unidad_id ?? null,
      ruta_id: body.ruta_id ?? null,
      customer_id: body.customer_id ?? null,
      motivo_visita: body.motivo_visita ?? null,
      referencia: body.referencia ?? null,
      ubicacion: body.ubicacion ?? null,
      ubicacion_txt: body.ubicacion_txt ?? null,
      fecha_hora_agendada: body.fecha_hora_agendada ?? null,
      fecha_hora_limite: body.fecha_hora_limite ?? null,
      iniciado_por: session.userId,
    })
    revalidatePath('/servicios')
    if (body.service_order_id) revalidatePath(`/servicios/orders/${body.service_order_id}`)
    return NextResponse.json(srv, { status: 201 })
  } catch (error) {
    console.error('POST /api/servicios/services ERROR:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
