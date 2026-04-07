import { NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth-guard'
import { listNotifications, clearAllNotifications } from '@/lib/queries/notifications'

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()
  const notifications = await listNotifications(session.userId)
  return NextResponse.json(notifications)
}

export async function DELETE() {
  const session = await getSession()
  if (!session) return unauthorized()
  await clearAllNotifications(session.userId)
  return NextResponse.json({ ok: true })
}
