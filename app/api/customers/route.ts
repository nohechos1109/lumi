import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized } from '@/lib/auth-guard'
import { listCustomers, createCustomer } from '@/lib/queries/customers'

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()
  return NextResponse.json(await listCustomers())
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()
  const { name, email, phone } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
  const customer = await createCustomer(name.trim(), email?.trim() || undefined, phone?.trim() || undefined)
  revalidatePath('/customers')
  revalidatePath('/admin/customers')
  return NextResponse.json(customer, { status: 201 })
}
