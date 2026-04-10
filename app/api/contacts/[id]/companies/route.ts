import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth-guard'
import { getCompanyContacts, linkContactToCompany } from '@/lib/queries/customers'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  const { id } = await params
  return NextResponse.json(await getCompanyContacts(id))
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  const { id } = await params
  const { company_id, role, is_primary } = await req.json()
  if (!company_id) return NextResponse.json({ error: 'company_id requerido' }, { status: 400 })
  await linkContactToCompany(id, company_id, role ?? null, is_primary ?? false)
  return NextResponse.json({ ok: true }, { status: 201 })
}
