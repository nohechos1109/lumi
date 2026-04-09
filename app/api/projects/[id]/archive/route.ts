import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canViewOwnProjectsOnly } from '@/lib/permissions'
import { getProject, archiveProject, unarchiveProject } from '@/lib/queries/projects'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params
  const { archive } = await req.json() as { archive: boolean }

  const project = await getProject(id)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (canViewOwnProjectsOnly(session.role) && project.user_id !== session.userId) return forbidden()

  if (archive) {
    await archiveProject(id)
  } else {
    await unarchiveProject(id)
  }

  revalidatePath('/projects')
  return NextResponse.json({ ok: true })
}
