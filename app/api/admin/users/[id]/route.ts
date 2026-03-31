import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { updateUser, deleteUser } from '@/lib/queries/users'
import bcrypt from 'bcryptjs'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'admin') return forbidden()
  const { id } = await params
  const body = await req.json()
  if (body.password) { body.password_hash = await bcrypt.hash(body.password, 10); delete body.password }
  await updateUser(id, body)
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'admin') return forbidden()
  const { id } = await params
  await deleteUser(id)
  return NextResponse.json({ ok: true })
}
