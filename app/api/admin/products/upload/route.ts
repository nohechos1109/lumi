import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { uploadImage } from '@/lib/local-upload'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'admin') return forbidden()

  const formData = await req.formData()
  const file = formData.get('file')

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Tipo de archivo no válido. Solo JPG, PNG o WebP.' },
      { status: 400 },
    )
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'El archivo excede el límite de 5 MB.' }, { status: 400 })
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await uploadImage(buffer, 'cotizador/products', file.type)
    return NextResponse.json({ url: result.url })
  } catch (err) {
    console.error('[UPLOAD ERROR]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
