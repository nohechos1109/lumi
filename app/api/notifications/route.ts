import { NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth-guard'
import { listNotifications } from '@/lib/queries/notifications'

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()
  const notifications = await listNotifications(session.userId)
  return NextResponse.json(notifications)
}
