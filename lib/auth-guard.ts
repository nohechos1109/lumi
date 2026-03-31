import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/session'
import { NextResponse } from 'next/server'

export async function getSession(): Promise<SessionData | null> {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  return session.userId ? session : null
}

export function unauthorized() {
  return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
}

export function forbidden() {
  return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
}
