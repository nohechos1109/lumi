import { NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canAccessDeleteRequests } from '@/lib/permissions'
import { listPendingDeleteRequests } from '@/lib/queries/delete-requests'

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canAccessDeleteRequests(session.role)) return forbidden()
  return NextResponse.json(await listPendingDeleteRequests())
}
