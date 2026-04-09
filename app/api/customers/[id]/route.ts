import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canDeleteCustomers } from '@/lib/permissions'
import { updateCustomer, deleteCustomer } from '@/lib/queries/customers'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params
  const { name, email, phone } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
  await updateCustomer(id, name.trim(), email?.trim() || undefined, phone?.trim() || undefined)
  revalidatePath('/customers')
  revalidatePath('/admin/customers')
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  // Only admin and manager can delete directly
  if (!canDeleteCustomers(session.role)) return forbidden()

  const { id } = await params
  await deleteCustomer(id)
  revalidatePath('/customers')
  revalidatePath('/admin/customers')
  return NextResponse.json({ ok: true })
}
