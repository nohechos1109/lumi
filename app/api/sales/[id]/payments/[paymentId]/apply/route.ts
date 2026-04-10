import { NextResponse } from 'next/server'

// This endpoint is deprecated. Payment application is now done via
// POST /api/cobranza/[noteId]/abono or POST /api/cobranza/credit/apply.
export async function POST() {
  return NextResponse.json(
    { error: 'Este endpoint está obsoleto. Para aplicar pagos usa /api/cobranza/[noteId]/abono.' },
    { status: 410 }
  )
}
