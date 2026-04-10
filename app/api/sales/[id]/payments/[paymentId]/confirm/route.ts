import { NextResponse } from 'next/server'

// This endpoint is deprecated. Payments are now created as confirmed directly
// via POST /api/cobranza/[noteId]/abono or POST /api/pagos.
export async function POST() {
  return NextResponse.json(
    { error: 'Este endpoint está obsoleto. Los pagos se registran desde /api/cobranza/[noteId]/abono o /api/pagos.' },
    { status: 410 }
  )
}
