import { NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth-guard'
import { getSettings } from '@/lib/queries/settings'

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()
  const settings = await getSettings()
  return NextResponse.json({ fx_mxn_per_usd: Number(settings?.fx_mxn_per_usd ?? 17.85) })
}
