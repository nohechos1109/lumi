import { NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth-guard'
import { markAllNotificationsRead } from '@/lib/queries/notifications'

export async function PATCH() {
  const session = await getSession()
  if (!session) return unauthorized()
  await markAllNotificationsRead(session.userId)
  return NextResponse.json({ ok: true })
}
