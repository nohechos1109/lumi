import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { updateContact, deleteContact, deleteContactCascade, getContactDependencies } from '@/lib/queries/customers'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'admin') return forbidden()
  const { id } = await params
  const { name, email, phone, first_name, job_title, tax_id } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
  await updateContact(id, { name, email: email || null, phone: phone || null, first_name: first_name || null, job_title: job_title || null, tax_id: tax_id || null })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'admin') return forbidden()
  const { id } = await params
  const force = req.nextUrl.searchParams.get('force') === 'true'

  if (force) {
    await deleteContactCascade(id)
    return NextResponse.json({ ok: true, cascade: true })
  }

  const deps = await getContactDependencies(id)
  if (deps.total_hard > 0) {
    return NextResponse.json(
      { error: 'Tiene registros asociados', dependencies: deps },
      { status: 409 }
    )
  }
  await deleteContact(id)
  return NextResponse.json({ ok: true })
}
