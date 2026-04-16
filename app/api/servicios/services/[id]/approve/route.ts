import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canApproveServiceRequest } from '@/lib/permissions'
import { approveService } from '@/lib/queries/servicios'
import { insertAuditEvent } from '@/lib/queries/audit'
import { broadcastToAll } from '@/lib/sse'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  // Only soporte/admin can approve services
  if (!canApproveServiceRequest(session.role)) return forbidden()

  const { id } = await params

  try {
    const result = await approveService(id, session.userId)

    await insertAuditEvent('service', id, 'approved', {
      user_id: session.userId,
      username: session.username,
      sale_note_id: result.saleNote.id,
      sale_note_number: result.saleNote.number,
    })

    broadcastToAll('service_approved', { id, sale_note_id: result.saleNote.id })
    revalidatePath('/servicios')
    revalidatePath(`/servicios/services/${id}`)
    revalidatePath(`/ventas/${result.sale.id}`)
    revalidatePath('/cobranza')

    return NextResponse.json({
      ok: true,
      saleNote: result.saleNote,
      sale: result.sale,
    })
  } catch (error) {
    const msg = String(error)
    if (msg.includes('NOT_FOUND')) return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })
    if (msg.includes('INVALID_STATE')) return NextResponse.json({ error: 'Servicio debe estar en estado "atendido"' }, { status: 409 })
    if (msg.includes('ALREADY_APPROVED')) return NextResponse.json({ error: 'Servicio ya fue aprobado' }, { status: 409 })
    if (msg.includes('NO_MATERIALS')) return NextResponse.json({ error: 'No hay materiales registrados' }, { status: 400 })
    console.error('POST /api/servicios/services/[id]/approve ERROR:', error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
