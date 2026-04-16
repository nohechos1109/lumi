import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canEditService, canViewOwnServicesOnly } from '@/lib/permissions'
import {
  listServiceMaterials,
  createServiceMaterial,
  deleteServiceMaterial,
  getService,
} from '@/lib/queries/servicios'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params

  if (canViewOwnServicesOnly(session.role)) {
    const srv = await getService(id)
    const allowed = srv?.assign_all_technicians || srv?.technicians?.some(t => t.user_id === session.userId)
    if (!allowed) return forbidden()
  }

  const materials = await listServiceMaterials(id)
  return NextResponse.json(materials)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canEditService(session.role)) return forbidden()

  const { id } = await params
  const body = await req.json()

  if (!body.product_id) {
    return NextResponse.json({ error: 'product_id requerido' }, { status: 400 })
  }

  try {
    const material = await createServiceMaterial({
      service_id: id,
      product_id: body.product_id,
      quantity: Number(body.quantity) || 1,
      unit_price: Number(body.unit_price) || 0,
      notes: body.notes ?? null,
      created_by: session.userId,
    })
    revalidatePath(`/servicios/services/${id}`)
    return NextResponse.json(material, { status: 201 })
  } catch (error) {
    console.error('POST materials ERROR:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canEditService(session.role)) return forbidden()

  const { id } = await params
  const materialId = req.nextUrl.searchParams.get('material_id')
  if (!materialId) {
    return NextResponse.json({ error: 'material_id requerido' }, { status: 400 })
  }

  try {
    await deleteServiceMaterial(materialId)
    revalidatePath(`/servicios/services/${id}`)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE materials ERROR:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
