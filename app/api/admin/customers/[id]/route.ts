import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { updateCustomer, deleteCustomer } from '@/lib/queries/customers'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'admin') return forbidden()
  const { id } = await params
  const { name, email, phone } = await req.json()
  await updateCustomer(id, name, email, phone)
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'admin') return forbidden()
  const { id } = await params
  await deleteCustomer(id)
  return NextResponse.json({ ok: true })
}
