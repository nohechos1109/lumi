import { writeFile, mkdir, unlink } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

export const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

const MIME_TO_EXT: Record<string, string> = {
  'image/webp': '.webp',
  'image/jpeg': '.jpg',
  'image/png': '.png',
}

interface UploadResult {
  url: string
  public_id: string
}

export async function uploadImage(buffer: Buffer, folder: string, mimeType = 'image/webp'): Promise<UploadResult> {
  const dir = path.join(UPLOAD_DIR, folder)
  await mkdir(dir, { recursive: true })
  const ext = MIME_TO_EXT[mimeType] ?? '.webp'
  const filename = `${crypto.randomUUID()}${ext}`
  await writeFile(path.join(dir, filename), buffer)
  const public_id = `${folder}/${filename}`
  return { url: `/api/uploads/${public_id}`, public_id }
}

export async function deleteImage(publicId: string): Promise<void> {
  try {
    await unlink(path.join(UPLOAD_DIR, publicId))
  } catch {
    // already gone
  }
}
