import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canDeleteCustomers } from '@/lib/permissions'
import { updateContact, deleteContact } from '@/lib/queries/customers'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params
  const body = await req.json()
  const { name, email, phone, first_name, last_name, job_title, website, tax_id } = body
  if (!name?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
  await updateContact(id, {
    name: name.trim(),
    email: email?.trim() || null,
    phone: phone?.trim() || null,
    first_name: first_name?.trim() || null,
    last_name: last_name?.trim() || null,
    job_title: job_title?.trim() || null,
    website: website?.trim() || null,
    tax_id: tax_id?.trim() || null,
  })
  revalidatePath('/customers')
  revalidatePath('/admin/customers')
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canDeleteCustomers(session.role)) return forbidden()

  const { id } = await params
  await deleteContact(id)
  revalidatePath('/customers')
  revalidatePath('/admin/customers')
  return NextResponse.json({ ok: true })
}
