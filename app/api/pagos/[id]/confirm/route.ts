import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canApplyPayments } from '@/lib/permissions'
import { confirmCustomerPayment } from '@/lib/queries/customer-payments'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canApplyPayments(session.role)) return forbidden()

  const { id } = await params

  try {
    await confirmCustomerPayment(id)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 })
  }

  revalidatePath('/pagos')
  revalidatePath('/cobranza')
  return NextResponse.json({ ok: true })
}
