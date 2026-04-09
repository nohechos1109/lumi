import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canCreateSaleNotes } from '@/lib/permissions'
import { getSaleNote, updateSaleNoteState } from '@/lib/queries/sale-notes'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canCreateSaleNotes(session.role)) return forbidden()
  const { id, noteId } = await params
  const { state } = await req.json()

  const note = await getSaleNote(noteId)
  if (!note) return NextResponse.json({ error: 'Nota no encontrada' }, { status: 404 })

  const validTransitions: Record<string, string[]> = {
    draft: ['confirmed', 'cancelled'],
    confirmed: ['cancelled'],
  }

  const allowed = validTransitions[note.state] ?? []
  if (!allowed.includes(state)) {
    return NextResponse.json({ error: 'Transición no válida' }, { status: 400 })
  }

  await updateSaleNoteState(noteId, state)
  revalidatePath(`/ventas/${id}`)
  return NextResponse.json({ ok: true })
}
