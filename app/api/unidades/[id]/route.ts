import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { getUnidad, updateUnidad, deleteUnidad } from '@/lib/queries/unidades'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  const { id } = await params
  const unidad = await getUnidad(id)
  if (!unidad) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(unidad)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'admin' && session.role !== 'manager') return forbidden()

  const { id } = await params
  const body = await req.json()
  await updateUnidad(id, body)
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'admin' && session.role !== 'manager') return forbidden()

  const { id } = await params
  try {
    await deleteUnidad(id)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'No se puede eliminar (tiene notas vinculadas)' }, { status: 409 })
  }
}
