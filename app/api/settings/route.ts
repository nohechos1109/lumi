import { NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth-guard'
import { getSettings } from '@/lib/queries/settings'

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()
  return NextResponse.json(await getSettings())
}
