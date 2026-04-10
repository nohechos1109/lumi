import { NextResponse } from 'next/server'

// This endpoint is deprecated. Payment cancellation is now done via
// DELETE /api/pagos/[id].
export async function POST() {
  return NextResponse.json(
    { error: 'Este endpoint está obsoleto. Para cancelar pagos usa DELETE /api/pagos/[id].' },
    { status: 410 }
  )
}
