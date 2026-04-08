import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth-guard'
import { getAuditEvents } from '@/lib/queries/audit'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { searchParams } = req.nextUrl
  const entity = searchParams.get('entity')
  const entity_id = searchParams.get('entity_id')

  if (!entity || !entity_id) {
    return NextResponse.json({ error: 'entity and entity_id are required' }, { status: 400 })
  }

  const events = await getAuditEvents(entity, entity_id)
  return NextResponse.json(events)
}
