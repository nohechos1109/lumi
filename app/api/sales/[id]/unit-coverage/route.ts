import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth-guard'
import { getQuoteLineCoverageForUnit } from '@/lib/queries/unidades'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params
  const unitId = req.nextUrl.searchParams.get('unit_id')
  if (!unitId) return NextResponse.json({ error: 'unit_id requerido' }, { status: 400 })

  const coverage = await getQuoteLineCoverageForUnit(id, unitId)
  return NextResponse.json(coverage)
}
