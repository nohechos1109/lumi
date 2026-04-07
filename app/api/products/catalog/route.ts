import { NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth-guard'
import { listProductsCatalog } from '@/lib/queries/products'
import { getSettings } from '@/lib/queries/settings'

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()

  try {
    const settings = await getSettings()
    const raw = Number(settings?.fx_mxn_per_usd ?? 17)
    const fxRate = isNaN(raw) || raw <= 0 ? 17 : raw
    const products = await listProductsCatalog(fxRate)
    return NextResponse.json(products)
  } catch {
    return NextResponse.json({ error: 'Error al cargar el catálogo' }, { status: 500 })
  }
}
