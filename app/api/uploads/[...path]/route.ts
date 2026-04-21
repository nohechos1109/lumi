import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { UPLOAD_DIR } from '@/lib/local-upload'
const ALLOWED_FOLDERS = ['cotizador/products']

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params
  const joined = segments.join('/')

  // Only serve from allowed folders — block path traversal
  if (!ALLOWED_FOLDERS.some((f) => joined.startsWith(f))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Block path traversal
  const resolved = path.resolve(UPLOAD_DIR, joined)
  if (!resolved.startsWith(path.resolve(UPLOAD_DIR))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const buffer = await readFile(resolved)
    const ext = path.extname(resolved).toLowerCase()
    const mime =
      ext === '.webp' ? 'image/webp' :
      ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
      ext === '.png' ? 'image/png' :
      'application/octet-stream'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mime,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
