import { NextRequest, NextResponse } from 'next/server'
import { readFile, unlink } from 'fs/promises'
import path from 'path'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canEditService } from '@/lib/permissions'
import { getFile, deleteFileRecord } from '@/lib/queries/files'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params
  const file = await getFile(id)
  if (!file) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const fullPath = path.join(UPLOAD_DIR, file.file_path)
  try {
    const buffer = await readFile(fullPath)
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': file.mime_type,
        'Content-Disposition': `inline; filename="${file.original_name}"`,
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch {
    return NextResponse.json({ error: 'File not found on disk' }, { status: 404 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canEditService(session.role)) return forbidden()

  const { id } = await params
  const file = await deleteFileRecord(id)
  if (!file) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const fullPath = path.join(UPLOAD_DIR, file.file_path)
  try {
    await unlink(fullPath)
  } catch {
    // file already gone from disk, record deleted — fine
  }

  return NextResponse.json({ ok: true })
}
