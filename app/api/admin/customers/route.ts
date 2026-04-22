import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { listContacts, createContact } from '@/lib/queries/customers'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'admin') return forbidden()
  const includeArchived = req.nextUrl.searchParams.get('includeArchived') === 'true'
  return NextResponse.json(await listContacts({ includeArchived }))
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'admin') return forbidden()
  const body = await req.json()
  const { type = 'company', name, email, phone, first_name, job_title, tax_id } = body
  if (!name?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
  return NextResponse.json(await createContact({ type, name, email, phone, first_name, job_title, tax_id }), { status: 201 })
}
