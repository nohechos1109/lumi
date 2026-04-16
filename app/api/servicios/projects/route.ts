import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canAccessServicios, canCreateServiceProject, canViewOwnServicesOnly } from '@/lib/permissions'
import { listServiceProjects, listServiceProjectsByCreator, createServiceProject } from '@/lib/queries/servicios'

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canAccessServicios(session.role)) return forbidden()

  const projects = canViewOwnServicesOnly(session.role)
    ? await listServiceProjectsByCreator(session.userId)
    : await listServiceProjects()

  return NextResponse.json(projects)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canCreateServiceProject(session.role)) return forbidden()

  const body = await req.json()
  if (!body.name || typeof body.name !== 'string') {
    return NextResponse.json({ error: 'name requerido' }, { status: 400 })
  }

  try {
    const project = await createServiceProject({
      name: body.name,
      customer_id: body.customer_id ?? null,
      sale_id: body.sale_id ?? null,
      observaciones: body.observaciones ?? null,
      created_by: session.userId,
    })
    revalidatePath('/servicios')
    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('POST /api/servicios/projects ERROR:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
