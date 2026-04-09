import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized } from '@/lib/auth-guard'
import { canViewOwnProjectsOnly } from '@/lib/permissions'
import { listProjectsByUser, listAllProjects, createProject } from '@/lib/queries/projects'

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()

  const projects = canViewOwnProjectsOnly(session.role)
    ? await listProjectsByUser(session.userId)
    : await listAllProjects()

  return NextResponse.json(projects)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()

  const body = await req.json()

  try {
    const project = await createProject({
      name: body.name,
      customer_id: body.customer_id,
      date: body.date,
      status: body.status,
      description: body.description,
      user_id: session.userId,
    })

    revalidatePath('/projects')
    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('POST /api/projects ERROR:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
