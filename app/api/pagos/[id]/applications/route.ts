import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth-guard'
import { listApplicationsByPayment } from '@/lib/queries/customer-payments'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params
  const applications = await listApplicationsByPayment(id)
  return NextResponse.json(applications)
}
