import { NextResponse } from 'next/server'
import { createElement } from 'react'
import path from 'node:path'
import { renderToBuffer } from '@react-pdf/renderer'
import { getSession, unauthorized } from '@/lib/auth-guard'
import { getSaleNote } from '@/lib/queries/sale-notes'
import { getSale } from '@/lib/queries/sales'
import { listPaymentHistoryByNote } from '@/lib/queries/customer-payments'
import NotePaymentHistoryPDF from '@/components/pdf/NotePaymentHistoryPDF'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { noteId } = await params
  const note = await getSaleNote(noteId)
  if (!note) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const [sale, payments] = await Promise.all([
    getSale(note.sale_id),
    listPaymentHistoryByNote(noteId),
  ])
  if (!sale) return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })

  const logoPath = path.join(process.cwd(), 'public', 'logosmart.png')
  const element = createElement(NotePaymentHistoryPDF, { note, sale, payments, logoPath })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any)

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${note.number}_pagos.pdf"`,
    },
  })
}
