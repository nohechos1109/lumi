import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { createDeleteRequest } from '@/lib/queries/delete-requests'
import { createNotification } from '@/lib/queries/notifications'
import pool from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'sales') return forbidden()

  const { id } = await params
  const { reason } = await req.json()

  const deleteReq = await createDeleteRequest({
    entity: 'customer',
    entity_id: id,
    requested_by: session.userId,
    reason: reason?.trim() || undefined,
  })

  const { rows: [customer] } = await pool.query(
    `SELECT name FROM customers WHERE id = $1`, [id]
  )
  const customerName = customer?.name ?? 'Cliente desconocido'

  // Notify admins and managers
  const { rows: managers } = await pool.query(
    `SELECT id FROM users WHERE role IN ('admin', 'manager')`
  )
  await Promise.all(managers.map((u: { id: string }) =>
    createNotification({
      user_id: u.id,
      type: 'delete_request',
      title: 'Solicitud de eliminación de cliente',
      message: `${session.username} solicitó eliminar a "${customerName}".`,
      entity: 'delete_request',
      entity_id: deleteReq.id,
    })
  ))

  return NextResponse.json(deleteReq, { status: 201 })
}
