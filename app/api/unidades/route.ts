import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { getUnidades, createUnidad } from '@/lib/queries/unidades'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()

  const sp = req.nextUrl.searchParams
  const filters = {
    ruta_id: sp.get('ruta_id') ?? undefined,
    customer_id: sp.get('customer_id') ?? undefined,
  }
  const unidades = await getUnidades(filters)
  return NextResponse.json(unidades)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'admin' && session.role !== 'manager') return forbidden()

  const body = await req.json()
  if (!body.name?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })

  const unidad = await createUnidad({
    name: body.name.trim(),
    ruta_id: body.ruta_id ?? null,
    empresa_id: body.empresa_id ?? null,
    dueno_id: body.dueno_id ?? null,
    dashcam: body.dashcam ?? null,
    pantalla: Boolean(body.pantalla),
    impresora: Boolean(body.impresora),
    reversa: Boolean(body.reversa),
    reconocimiento_facial: Boolean(body.reconocimiento_facial),
    fecha_instalacion: body.fecha_instalacion ?? null,
    descripcion_instalacion: body.descripcion_instalacion ?? null,
    observaciones: body.observaciones ?? null,
  })
  return NextResponse.json(unidad, { status: 201 })
}
