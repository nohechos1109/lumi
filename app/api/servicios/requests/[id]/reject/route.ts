import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canApproveServiceRequest } from '@/lib/permissions'
import { rejectServiceRequest, getServiceRequest } from '@/lib/queries/servicios'
import { insertAuditEvent } from '@/lib/queries/audit'
import { createNotification } from '@/lib/queries/notifications'
import { broadcastToAll } from '@/lib/sse'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canApproveServiceRequest(session.role)) return forbidden()

  const { id } = await params
  const existing = await getServiceRequest(id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.status !== 'pending') {
    return NextResponse.json({ error: 'Ya resuelta' }, { status: 409 })
  }
  if (session.role === 'soporte' && existing.assigned_to && existing.assigned_to !== session.userId) {
    return forbidden()
  }

  try {
    const sr = await rejectServiceRequest(id)
    await insertAuditEvent('service_request', id, 'rejected', {
      user_id: session.userId,
      username: session.username,
    })
    await createNotification({
      user_id: sr.requested_by,
      type: 'service_request_rejected',
      title: 'Solicitud rechazada',
      message: sr.motivo,
      entity: 'service_request',
      entity_id: sr.id,
    })
    broadcastToAll('service_requests_updated', { id })
    revalidatePath('/servicios')
    return NextResponse.json({ ok: true })
  } catch (error) {
    const msg = String(error)
    if (msg.includes('INVALID_STATE')) {
      return NextResponse.json({ error: 'Ya resuelta' }, { status: 409 })
    }
    console.error('POST /api/servicios/requests/[id]/reject ERROR:', error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
