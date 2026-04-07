import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { addPlantillaItem } from '@/lib/queries/plantillas'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'admin') return forbidden()
  const { id } = await params
  const { product_id, qty } = await req.json()
  if (!product_id) return NextResponse.json({ error: 'product_id requerido' }, { status: 400 })
  await addPlantillaItem(id, product_id, qty ?? 1)
  return NextResponse.json({ ok: true }, { status: 201 })
}
