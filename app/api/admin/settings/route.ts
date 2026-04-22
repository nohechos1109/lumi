import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { getSettings, updateFx, updateShowMargin } from '@/lib/queries/settings'
import { broadcastToAll } from '@/lib/sse'

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
  const body = await req.json()
  if ('fx_mxn_per_usd' in body) {
    const fx = Number(body.fx_mxn_per_usd)
    await updateFx(fx)
    broadcastToAll('fx_changed', { fx })
  }
  if ('show_margin' in body) await updateShowMargin(Boolean(body.show_margin))
  return NextResponse.json({ ok: true })
}
