import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth-guard'
import { unlinkContactFromCompany } from '@/lib/queries/customers'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; companyId: string }> }
) {
  const session = await getSession()
  if (!session) return unauthorized()
  const { id, companyId } = await params
  await unlinkContactFromCompany(id, companyId)
  return NextResponse.json({ ok: true })
}
