import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canAccessDeleteRequests } from '@/lib/permissions'
import { getDeleteRequest } from '@/lib/queries/delete-requests'
import pool from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canAccessDeleteRequests(session.role)) return forbidden()

  const { id } = await params
  const { decision } = await req.json()
  if (decision !== 'approved' && decision !== 'rejected') {
    return NextResponse.json({ error: 'decision must be approved or rejected' }, { status: 400 })
  }

  const req2 = await getDeleteRequest(id)
  if (!req2) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (req2.status !== 'pending') return NextResponse.json({ error: 'Ya fue procesada' }, { status: 409 })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    await client.query(
      `UPDATE delete_requests SET status = $1, reviewed_by = $2, reviewed_at = now() WHERE id = $3`,
      [decision, session.userId, id]
    )

    if (decision === 'approved' && req2.entity === 'customer') {
      await client.query('DELETE FROM customers WHERE id = $1', [req2.entity_id])
    }

    // Notify requester
    await client.query(
      `INSERT INTO notifications (user_id, type, title, message, entity, entity_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        req2.requested_by,
        decision === 'approved' ? 'delete_approved' : 'delete_rejected',
        decision === 'approved' ? 'Solicitud de eliminación aprobada' : 'Solicitud de eliminación rechazada',
        `Tu solicitud de eliminar el cliente fue ${decision === 'approved' ? 'aprobada' : 'rechazada'}.`,
        'delete_request',
        id,
      ]
    )

    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }

  return NextResponse.json({ ok: true })
}
