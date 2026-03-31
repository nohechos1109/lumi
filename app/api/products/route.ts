import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth-guard'
import { listProducts, searchProducts } from '@/lib/queries/products'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()

  const q = req.nextUrl.searchParams.get('q')
  const products = q ? await searchProducts(q) : await listProducts()
  return NextResponse.json(products)
}
