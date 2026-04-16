import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canAccessServicios } from '@/lib/permissions'
import { getServiceRequest } from '@/lib/queries/servicios'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canAccessServicios(session.role)) return forbidden()

  const { id } = await params
  const sr = await getServiceRequest(id)
  if (!sr) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(sr)
}
