import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth-guard'
import { getProject, updateProject, deleteProject } from '@/lib/queries/projects'
import { insertAuditEvent } from '@/lib/queries/audit'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params
  const project = await getProject(id)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(project)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params
  const body = await req.json()

  try {
    const oldProject = body.status !== undefined ? await getProject(id) : null
    await updateProject(id, body)
    if (oldProject && body.status && body.status !== oldProject.status) {
      await insertAuditEvent('project', id, 'status_change', {
        from: oldProject.status,
        to: body.status,
        user_id: session.userId,
        username: session.username,
      })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('PATCH /api/projects/[id] ERROR:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params

  try {
    await deleteProject(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/projects/[id] ERROR:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
