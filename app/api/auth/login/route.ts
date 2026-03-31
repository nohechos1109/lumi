import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { findByUsername } from '@/lib/queries/users'
import { sessionOptions, SessionData } from '@/lib/session'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  if (!username || !password) {
    return NextResponse.json({ error: 'Credenciales requeridas' }, { status: 400 })
  }

  const user = await findByUsername(username)
  if (!user) {
    return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 })
  }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 })
  }

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  session.userId = user.id
  session.role = user.role
  session.username = user.username
  await session.save()

  return NextResponse.json({ role: user.role })
}
