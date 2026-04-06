import { v2 as cloudinary } from 'cloudinary'

function getCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
  return cloudinary
}

interface UploadResult {
  url: string
  public_id: string
}

export async function uploadImage(
  buffer: Buffer,
  folder: string,
): Promise<UploadResult> {
  const cld = getCloudinary()
  const base64 = `data:image/webp;base64,${buffer.toString('base64')}`
  const result = await cld.uploader.upload(base64, {
    folder,
    resource_type: 'image',
  })
  return { url: result.secure_url, public_id: result.public_id }
}

export async function deleteImage(publicId: string): Promise<void> {
  const cld = getCloudinary()
  await cld.uploader.destroy(publicId)
}
