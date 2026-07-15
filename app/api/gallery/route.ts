import { NextRequest, NextResponse } from 'next/server'
import { readdir, readFile, writeFile } from 'fs/promises'
import path from 'path'
import { imageSize } from 'image-size'

const GALLERY_DIR = path.join(process.cwd(), 'public', 'gallery')
const ALLOWED = new Set(['.jpg', '.jpeg', '.png', '.webp'])
const MAX_BYTES = 15 * 1024 * 1024

export async function GET() {
  const files = (await readdir(GALLERY_DIR))
    .filter(f => ALLOWED.has(path.extname(f).toLowerCase()))
    .sort()

  const photos = (
    await Promise.all(
      files.map(async f => {
        try {
          const { width, height } = imageSize(await readFile(path.join(GALLERY_DIR, f)))
          if (!width || !height) return null
          return { src: `/gallery/${f}`, width, height }
        } catch {
          return null
        }
      })
    )
  ).filter((p): p is { src: string; width: number; height: number } => p !== null)

  return NextResponse.json({ photos })
}

export async function POST(req: NextRequest) {
  // Uploads require the key when one is configured; otherwise dev-only
  const configuredKey = process.env.GALLERY_UPLOAD_KEY
  if (configuredKey) {
    if (req.headers.get('x-gallery-key') !== configuredKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  } else if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Uploads disabled' }, { status: 403 })
  }

  const formData = await req.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }
  const ext = path.extname(file.name).toLowerCase()
  if (!ALLOWED.has(ext)) {
    return NextResponse.json({ error: 'Only JPG, PNG, or WebP images' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 15MB)' }, { status: 400 })
  }

  const safeName = file.name
    .replace(ext, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'photo'
  const filename = `${safeName}-${Date.now()}${ext}`

  const bytes = Buffer.from(await file.arrayBuffer())
  await writeFile(path.join(GALLERY_DIR, filename), bytes)

  return NextResponse.json({ ok: true, src: `/gallery/${filename}` })
}
