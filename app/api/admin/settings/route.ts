import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { getSettings, updateFx } from '@/lib/queries/settings'

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'admin') return forbidden()
  return NextResponse.json(await getSettings())
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'admin') return forbidden()
  const { fx_mxn_per_usd } = await req.json()
  await updateFx(Number(fx_mxn_per_usd))
  return NextResponse.json({ ok: true })
}
