import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canCreateSaleNotes } from '@/lib/permissions'
import { getSale, updateSaleTotals } from '@/lib/queries/sales'
import { listNotesBySale, createSaleNote } from '@/lib/queries/sale-notes'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return unauthorized()
  const { id } = await params

  const notes = await listNotesBySale(id)
  return NextResponse.json(notes)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canCreateSaleNotes(session.role)) return forbidden()
  const { id } = await params

  const sale = await getSale(id)
  if (!sale) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  if (sale.state === 'finished') {
    return NextResponse.json({ error: 'La venta está finalizada y no acepta nuevas notas' }, { status: 400 })
  }
  if (sale.state === 'cancelled') {
    return NextResponse.json({ error: 'La venta está cancelada' }, { status: 400 })
  }

  const body = await req.json()
  const note = await createSaleNote({
    saleId: id,
    concept: body.concept,
    amountUntaxed: Number(body.amount_untaxed ?? 0),
    amountTax: Number(body.amount_tax ?? 0),
    amountTotal: Number(body.amount_total ?? 0),
    unitId: body.unit_id ?? null,
    observaciones: body.observaciones ?? undefined,
    lines: (body.lines ?? []).map((l: Record<string, unknown>) => ({
      ...l,
      quote_line_id: l.quote_line_id ?? null,
    })),
  })

  await updateSaleTotals(id)

  revalidatePath(`/ventas/${id}`)
  revalidatePath('/cobranza')
  return NextResponse.json(note, { status: 201 })
}
