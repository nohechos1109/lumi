import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized } from '@/lib/auth-guard'
import { listContacts, createContact } from '@/lib/queries/customers'

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()
  return NextResponse.json(await listContacts())
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()
  const body = await req.json()
  const { type = 'company', name, email, phone, first_name, job_title, website, tax_id } = body
  if (!name?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
  if (!phone?.trim()) return NextResponse.json({ error: 'Teléfono requerido' }, { status: 400 })
  if (type !== 'company' && type !== 'person') return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
  const contact = await createContact({
    type,
    name: name.trim(),
    email: email?.trim() || null,
    phone: phone.trim(),
    first_name: first_name?.trim() || null,
    job_title: job_title?.trim() || null,
    website: website?.trim() || null,
    tax_id: tax_id?.trim() || null,
  })
  revalidatePath('/customers')
  revalidatePath('/admin/customers')
  return NextResponse.json(contact, { status: 201 })
}
