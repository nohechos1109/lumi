import { NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth-guard'
import { listPaymentsBySale } from '@/lib/queries/customer-payments'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return unauthorized()
  const { id } = await params

  const payments = await listPaymentsBySale(id)
  return NextResponse.json(payments)
}
