import { NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth-guard'
import { canViewOwnSalesOnly } from '@/lib/permissions'
import { listAllSales, listSalesByUser } from '@/lib/queries/sales'

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()

  const sales = canViewOwnSalesOnly(session.role)
    ? await listSalesByUser(session.userId)
    : await listAllSales()

  return NextResponse.json(sales)
}
