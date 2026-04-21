import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canAddProgressEntry, canViewProgressEntries } from '@/lib/permissions'
import { createProgressEntry, listProgressEntries, RequiredFieldsError } from '@/lib/queries/servicios'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canViewProgressEntries(session.role)) return forbidden()

  const { id } = await params
  const entries = await listProgressEntries(id)
  return NextResponse.json(entries)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canAddProgressEntry(session.role)) return forbidden()

  const { id } = await params
  const body = await req.json() as { texto?: string }
  try {
    const entry = await createProgressEntry({
      service_project_id: id,
      author_id: session.userId,
      texto: (body.texto ?? '').trim(),
    })
    return NextResponse.json(entry, { status: 201 })
  } catch (err) {
    if (err instanceof RequiredFieldsError) {
      return NextResponse.json({ error: 'Campos requeridos', fields: err.fields }, { status: 400 })
    }
    throw err
  }
}
