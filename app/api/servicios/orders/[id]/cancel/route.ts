import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canCancelServiceOrder } from '@/lib/permissions'
import { cancelServiceOrder, HasTerminalChildrenError } from '@/lib/queries/servicios'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canCancelServiceOrder(session.role)) return forbidden()

  const { id } = await params
  const body = await req.json() as { motivo?: string }
  const motivo = (body.motivo ?? '').trim()
  if (!motivo) {
    return NextResponse.json({ error: 'Motivo requerido' }, { status: 400 })
  }

  try {
    await cancelServiceOrder(id, motivo, session.userId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof HasTerminalChildrenError) {
      return NextResponse.json(
        { error: 'No se puede cancelar: hay servicios ya atendidos o terminados.' },
        { status: 409 }
      )
    }
    throw err
  }
}
