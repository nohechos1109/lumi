import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canCreateSaleNotes } from '@/lib/permissions'
import { getSaleNote, updateSaleNoteFields } from '@/lib/queries/sale-notes'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canCreateSaleNotes(session.role)) return forbidden()
  const { id, noteId } = await params

  const note = await getSaleNote(noteId)
  if (!note) return NextResponse.json({ error: 'Nota no encontrada' }, { status: 404 })

  const body = await req.json()
  const fields: { observaciones?: string | null } = {}
  if ('observaciones' in body) fields.observaciones = body.observaciones === '' ? null : body.observaciones

  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ error: 'Sin campos para actualizar' }, { status: 400 })
  }

  await updateSaleNoteFields(noteId, fields)
  revalidatePath('/cobranza')
  revalidatePath(`/ventas/${id}`)
  return NextResponse.json({ ok: true })
}
