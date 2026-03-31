import { NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth-guard'
import { listTaxes } from '@/lib/queries/taxes'

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()
  return NextResponse.json(await listTaxes())
}
