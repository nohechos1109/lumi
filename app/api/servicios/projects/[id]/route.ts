import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import {
  canAccessServicios,
  canCreateServiceProject,
  canDeleteServiceEntities,
} from '@/lib/permissions'
import {
  getServiceProject,
  updateServiceProject,
  deleteServiceProject,
  archiveServiceProject,
} from '@/lib/queries/servicios'
import { insertAuditEvent } from '@/lib/queries/audit'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canAccessServicios(session.role)) return forbidden()

  const { id } = await params
  const project = await getServiceProject(id)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(project)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canCreateServiceProject(session.role)) return forbidden()

  const { id } = await params
  const body = await req.json()

  try {
    if (body.archive === true) {
      await archiveServiceProject(id)
    } else {
      const old = body.status !== undefined ? await getServiceProject(id) : null
      await updateServiceProject(id, {
        name: body.name,
        customer_id: body.customer_id,
        status: body.status,
        observaciones: body.observaciones,
      })
      if (old && body.status && body.status !== old.status) {
        await insertAuditEvent('service_project', id, 'status_change', {
          from: old.status,
          to: body.status,
          user_id: session.userId,
          username: session.username,
        })
      }
    }
    revalidatePath('/servicios')
    revalidatePath(`/servicios/projects/${id}`)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('PATCH /api/servicios/projects/[id] ERROR:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canDeleteServiceEntities(session.role)) return forbidden()

  const { id } = await params
  try {
    await deleteServiceProject(id)
    revalidatePath('/servicios')
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/servicios/projects/[id] ERROR:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
