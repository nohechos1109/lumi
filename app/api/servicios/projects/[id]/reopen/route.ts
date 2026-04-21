import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canReopenServiceProject } from '@/lib/permissions'
import { reopenServiceProject } from '@/lib/queries/servicios'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canReopenServiceProject(session.role)) return forbidden()

  const { id } = await params
  await reopenServiceProject(id, session.userId)
  return NextResponse.json({ ok: true })
}
