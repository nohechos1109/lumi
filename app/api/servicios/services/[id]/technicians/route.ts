import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canEditService } from '@/lib/permissions'
import { assignTechnician, removeTechnician, getService } from '@/lib/queries/servicios'

async function guardOrphan(id: string) {
  const srv = await getService(id)
  if (!srv) return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })
  if (srv.service_order_id) return NextResponse.json(
    { error: 'Los técnicos se gestionan desde la orden de servicio' },
    { status: 400 }
  )
  return null
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canEditService(session.role) || session.role === 'tecnico') return forbidden()

  const { id } = await params
  const orphanErr = await guardOrphan(id)
  if (orphanErr) return orphanErr

  const body = await req.json()
  if (!body.user_id) return NextResponse.json({ error: 'user_id requerido' }, { status: 400 })

  await assignTechnician(id, body.user_id)
  revalidatePath(`/servicios/services/${id}`)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canEditService(session.role) || session.role === 'tecnico') return forbidden()

  const { id } = await params
  const orphanErr = await guardOrphan(id)
  if (orphanErr) return orphanErr

  const userId = req.nextUrl.searchParams.get('user_id')
  if (!userId) return NextResponse.json({ error: 'user_id requerido' }, { status: 400 })

  await removeTechnician(id, userId)
  revalidatePath(`/servicios/services/${id}`)
  return NextResponse.json({ ok: true })
}
