import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { updatePlantillaItem, removePlantillaItem } from '@/lib/queries/plantillas'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; seq: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'admin') return forbidden()
  const { id, seq } = await params
  const { qty } = await req.json()
  if (qty === undefined || qty === null) return NextResponse.json({ error: 'qty requerido' }, { status: 400 })
  await updatePlantillaItem(id, Number(seq), qty)
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; seq: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'admin') return forbidden()
  const { id, seq } = await params
  await removePlantillaItem(id, Number(seq))
  return NextResponse.json({ ok: true })
}
