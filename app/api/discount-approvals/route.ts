import { NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { listPendingApprovals } from '@/lib/queries/discount-approvals'

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'admin') return forbidden()
  const approvals = await listPendingApprovals()
  return NextResponse.json(approvals)
}
