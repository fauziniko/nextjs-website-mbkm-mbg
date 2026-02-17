import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/api-auth'
import { uploadFile } from '@/lib/minio'

export async function POST(req: NextRequest) {
  try {
    const session = await getApiSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentType = req.headers.get('content-type') || ''

    // Handle JSON base64 uploads (for ML images)
    if (contentType.includes('application/json')) {
      const body = await req.json()
      const { images } = body as { images: Array<{ base64: string; name: string }> }
      if (!images || !Array.isArray(images)) {
        return NextResponse.json({ error: 'Missing images array' }, { status: 400 })
      }

      const urls: Record<string, string> = {}
      for (const img of images) {
        const buffer = Buffer.from(img.base64, 'base64')
        const url = await uploadFile(buffer, `${img.name}.png`, 'image/png')
        urls[img.name] = url
      }
      return NextResponse.json({ urls })
    }

    // Handle form-data file uploads (original)
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const url = await uploadFile(buffer, file.name, file.type)

    return NextResponse.json({ url })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
