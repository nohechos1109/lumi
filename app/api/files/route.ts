import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canAccessServicios } from '@/lib/permissions'
import { createFileRecord, listFilesByEntity } from '@/lib/queries/files'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')
const MAX_SIZE = 20 * 1024 * 1024 // 20MB
const ALLOWED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'video/mp4', 'video/quicktime',
])

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()

  const entityType = req.nextUrl.searchParams.get('entity_type')
  const entityId = req.nextUrl.searchParams.get('entity_id')
  if (!entityType || !entityId) {
    return NextResponse.json({ error: 'entity_type and entity_id required' }, { status: 400 })
  }

  const files = await listFilesByEntity(entityType, entityId)
  return NextResponse.json(files)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canAccessServicios(session.role)) return forbidden()

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const entityType = formData.get('entity_type') as string | null
  const entityId = formData.get('entity_id') as string | null

  if (!file || !entityType || !entityId) {
    return NextResponse.json({ error: 'file, entity_type, entity_id required' }, { status: 400 })
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: `Tipo no permitido: ${file.type}` }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Archivo excede 20MB' }, { status: 400 })
  }

  const ext = path.extname(file.name) || ''
  const uniqueName = `${crypto.randomUUID()}${ext}`
  const subdir = path.join(UPLOAD_DIR, entityType, entityId)
  await mkdir(subdir, { recursive: true })

  const filePath = path.join(subdir, uniqueName)
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(filePath, buffer)

  const relativePath = path.relative(UPLOAD_DIR, filePath).replace(/\\/g, '/')

  const record = await createFileRecord({
    entity_type: entityType,
    entity_id: entityId,
    filename: uniqueName,
    original_name: file.name,
    mime_type: file.type,
    file_size: file.size,
    file_path: relativePath,
    uploaded_by: session.userId,
  })

  return NextResponse.json(record, { status: 201 })
}
