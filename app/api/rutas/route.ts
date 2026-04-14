import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { getRutas, createRuta } from '@/lib/queries/rutas'

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()
  const rutas = await getRutas()
  return NextResponse.json(rutas)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'admin' && session.role !== 'manager') return forbidden()

  const { name, cliente_id } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })

  const ruta = await createRuta(name.trim(), cliente_id ?? null)
  return NextResponse.json(ruta, { status: 201 })
}
