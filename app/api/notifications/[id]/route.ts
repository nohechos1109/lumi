import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth-guard'
import { markNotificationRead } from '@/lib/queries/notifications'

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  const { id } = await params
  await markNotificationRead(id, session.userId)
  return NextResponse.json({ ok: true })
}
