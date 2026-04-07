import { NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth-guard'
import { listProductsCatalog } from '@/lib/queries/products'
import { getSettings } from '@/lib/queries/settings'

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()

  const settings = await getSettings()
  const fxRate = Number(settings?.fx_mxn_per_usd ?? 17)
  const products = await listProductsCatalog(fxRate)
  return NextResponse.json(products)
}
