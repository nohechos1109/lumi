import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth-guard'
import { updateLine, deleteLine } from '@/lib/queries/quote_lines'
import { updateQuoteTotals } from '@/lib/queries/quotes'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; lineId: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id, lineId } = await params
  const body = await req.json()
  await updateLine(lineId, body)
  await updateQuoteTotals(id)
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; lineId: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id, lineId } = await params
  await deleteLine(lineId)
  await updateQuoteTotals(id)
  return NextResponse.json({ ok: true })
}
