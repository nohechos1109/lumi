import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized } from '@/lib/auth-guard'
import { archiveSale, unarchiveSale, getSale } from '@/lib/queries/sales'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return unauthorized()
  const { id } = await params
  const { archive } = await req.json()

  const sale = await getSale(id)
  if (!sale) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  if (archive) {
    await archiveSale(id)
  } else {
    await unarchiveSale(id)
  }

  revalidatePath('/ventas')
  return NextResponse.json({ ok: true })
}
