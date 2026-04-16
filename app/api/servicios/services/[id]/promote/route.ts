import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canCreateServiceProject } from '@/lib/permissions'
import { promoteWalkInService } from '@/lib/queries/servicios'
import { insertAuditEvent } from '@/lib/queries/audit'
import { broadcastToAll } from '@/lib/sse'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canCreateServiceProject(session.role)) return forbidden()

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const { project_name, observaciones } = body as { project_name?: string; observaciones?: string }

  try {
    const result = await promoteWalkInService(id, session.userId, project_name, observaciones)

    await insertAuditEvent('service', id, 'promoted', {
      user_id: session.userId,
      username: session.username,
      project_id: result.projectId,
      order_id: result.orderId,
    })

    broadcastToAll('service_promoted', { id, ...result })
    revalidatePath('/servicios')
    revalidatePath(`/servicios/services/${id}`)

    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    const msg = String(error)
    if (msg.includes('NOT_FOUND')) return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })
    if (msg.includes('ALREADY_HAS_ORDER')) return NextResponse.json({ error: 'Servicio ya tiene orden asignada' }, { status: 409 })
    console.error('POST /api/servicios/services/[id]/promote ERROR:', error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
