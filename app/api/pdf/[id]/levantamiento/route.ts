import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canViewOwnQuotesOnly } from '@/lib/permissions'
import { getQuote } from '@/lib/queries/quotes'
import { listLines } from '@/lib/queries/quote_lines'
import { renderToBuffer } from '@react-pdf/renderer'
import LevantamientoPDF from '@/components/pdf/LevantamientoPDF'
import { createElement } from 'react'
import path from 'path'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params
  const quote = await getQuote(id)
  if (!quote) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  if (canViewOwnQuotesOnly(session.role) && quote.user_id !== session.userId) return forbidden()

  const lines = await listLines(id)
  const detalles = req.nextUrl.searchParams.get('detalles') || ''

  const images = {
    logo: path.join(process.cwd(), 'public', 'logosmart.png'),
  }

  const element = createElement(LevantamientoPDF, { quote, lines: lines as any[], images, detalles }) as any
  const buffer = await renderToBuffer(element)

  return new NextResponse(buffer as any, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${quote.number}_levantamiento.pdf"`,
    },
  })
}
