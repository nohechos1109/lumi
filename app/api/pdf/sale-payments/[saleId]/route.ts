import { NextResponse } from 'next/server'
import { createElement } from 'react'
import path from 'node:path'
import { renderToBuffer } from '@react-pdf/renderer'
import { getSession, unauthorized } from '@/lib/auth-guard'
import { getSale } from '@/lib/queries/sales'
import { listPaymentsBySale, listApplicationsBySalePayments } from '@/lib/queries/customer-payments'
import { getSaleNote } from '@/lib/queries/sale-notes'
import SalePaymentsPDF from '@/components/pdf/SalePaymentsPDF'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ saleId: string }> }
) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { saleId } = await params
  const { searchParams } = new URL(req.url)
  const noteId = searchParams.get('noteId')

  const [sale, payments, applications, filterNoteRow] = await Promise.all([
    getSale(saleId),
    listPaymentsBySale(saleId),
    listApplicationsBySalePayments(saleId),
    noteId ? getSaleNote(noteId) : Promise.resolve(null),
  ])
  if (!sale) return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })

  const filterNote = filterNoteRow
    ? { id: filterNoteRow.id, number: filterNoteRow.number }
    : null

  const logoPath = path.join(process.cwd(), 'public', 'logosmart.png')
  const element = createElement(SalePaymentsPDF, {
    sale: {
      number: sale.number,
      customer_name: sale.customer_name,
      amount_total: sale.amount_total,
      amount_paid: sale.amount_paid,
      amount_balance: sale.amount_balance,
    },
    payments,
    applications,
    filterNote,
    logoPath,
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any)

  const filename = filterNote
    ? `${sale.number}_pagos_${filterNote.number}.pdf`
    : `${sale.number}_pagos.pdf`

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
    },
  })
}
