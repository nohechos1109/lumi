import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { listProducts, createProduct } from '@/lib/queries/products'

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'admin') return forbidden()
  return NextResponse.json(await listProducts())
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'admin') return forbidden()
  const body = await req.json()
  const product = await createProduct(body)
  return NextResponse.json(product, { status: 201 })
}
