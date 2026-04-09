import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { listUsers, createUser } from '@/lib/queries/users'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'admin') return forbidden()
  return NextResponse.json(await listUsers())
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'admin') return forbidden()
  const { username, role, password } = await req.json()
  const hash = await bcrypt.hash(password, 10)
  const user = await createUser(username, role, hash)
  revalidatePath('/admin/users')
  return NextResponse.json(user, { status: 201 })
}
