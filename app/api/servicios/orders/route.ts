import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canAccessServicios, canCreateServiceOrder } from '@/lib/permissions'
import { listServiceOrdersByProject, createServiceOrder } from '@/lib/queries/servicios'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canAccessServicios(session.role)) return forbidden()

  const projectId = req.nextUrl.searchParams.get('project_id')
  if (!projectId) return NextResponse.json({ error: 'project_id requerido' }, { status: 400 })

  const orders = await listServiceOrdersByProject(projectId)
  return NextResponse.json(orders)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canCreateServiceOrder(session.role)) return forbidden()

  const body = await req.json()
  if (!body.service_project_id) {
    return NextResponse.json({ error: 'service_project_id requerido' }, { status: 400 })
  }

  try {
    const order = await createServiceOrder({
      service_project_id: body.service_project_id,
      motivo_del_servicio: body.motivo_del_servicio ?? null,
      ubicacion: body.ubicacion ?? null,
      referencias: body.referencias ?? null,
      foja_de_ruta: body.foja_de_ruta ?? null,
      comentarios_de_soporte: body.comentarios_de_soporte ?? null,
      encargados: body.encargados ?? null,
      fecha_hora_agendada: body.fecha_hora_agendada ?? null,
      fecha_hora_limite: body.fecha_hora_limite ?? null,
      created_by: session.userId,
    })
    revalidatePath('/servicios')
    revalidatePath(`/servicios/projects/${body.service_project_id}`)
    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('POST /api/servicios/orders ERROR:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
