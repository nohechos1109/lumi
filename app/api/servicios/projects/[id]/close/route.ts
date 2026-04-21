import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canCloseServiceProject as canCloseRole } from '@/lib/permissions'
import { closeServiceProject, ProjectNotCloseableError } from '@/lib/queries/servicios'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canCloseRole(session.role)) return forbidden()

  const { id } = await params
  try {
    await closeServiceProject(id, session.userId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof ProjectNotCloseableError) {
      return NextResponse.json({ error: 'Hay órdenes pendientes' }, { status: 409 })
    }
    throw err
  }
}
