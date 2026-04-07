import { NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { listPendingDeleteRequests } from '@/lib/queries/delete-requests'

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role === 'sales') return forbidden()
  return NextResponse.json(await listPendingDeleteRequests())
}
