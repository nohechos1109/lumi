import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canCreateSaleNotes } from '@/lib/permissions'
import { getSaleNote, deleteSaleNote, updateDraftSaleNote } from '@/lib/queries/sale-notes'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canCreateSaleNotes(session.role)) return forbidden()
  const { id, noteId } = await params

  const note = await getSaleNote(noteId)
  if (!note || note.sale_id !== id) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  if (note.state !== 'draft') return NextResponse.json({ error: 'Solo se pueden editar notas en borrador' }, { status: 400 })

  const body = await req.json()
  await updateDraftSaleNote(noteId, body)
  revalidatePath(`/ventas/${id}`)
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'manager' && session.role !== 'admin') return forbidden()
  const { id, noteId } = await params

  const note = await getSaleNote(noteId)
  if (!note || note.sale_id !== id) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }
  if (note.state !== 'draft') {
    return NextResponse.json({ error: 'Solo se pueden borrar notas en borrador' }, { status: 400 })
  }

  await deleteSaleNote(noteId)
  revalidatePath(`/ventas/${id}`)
  return NextResponse.json({ ok: true })
}
