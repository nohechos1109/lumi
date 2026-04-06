import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { listCustomers, createCustomer } from '@/lib/queries/customers'

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'admin') return forbidden()
  return NextResponse.json(await listCustomers())
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'admin') return forbidden()
  const { name, email, phone } = await req.json()
  return NextResponse.json(await createCustomer(name, email, phone), { status: 201 })
}
