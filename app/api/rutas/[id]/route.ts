import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { updateRuta, deleteRuta } from '@/lib/queries/rutas'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'admin' && session.role !== 'manager') return forbidden()

  const { id } = await params
  const { name, cliente_id } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })

  await updateRuta(id, name.trim(), cliente_id ?? null)
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'admin' && session.role !== 'manager') return forbidden()

  const { id } = await params
  try {
    await deleteRuta(id)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'No se puede eliminar (tiene grupos o unidades vinculados)' }, { status: 409 })
  }
}
