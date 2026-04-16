import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canAccessServicios } from '@/lib/permissions'
import { listUsersByRoles } from '@/lib/queries/servicios'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canAccessServicios(session.role)) return forbidden()

  const rolesParam = req.nextUrl.searchParams.get('roles') ?? ''
  const roles = rolesParam.split(',').map(r => r.trim()).filter(Boolean)
  const allowed = ['soporte', 'tecnico', 'admin', 'manager', 'almacen']
  const safe = roles.filter(r => allowed.includes(r))
  const users = await listUsersByRoles(safe)
  return NextResponse.json(users)
}
