import { NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth-guard'
import { canViewOwnSalesOnly } from '@/lib/permissions'
import { getSale } from '@/lib/queries/sales'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return unauthorized()
  const { id } = await params

  const sale = await getSale(id)
  if (!sale) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  if (canViewOwnSalesOnly(session.role) && sale.user_id !== session.userId) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }

  return NextResponse.json(sale)
}
