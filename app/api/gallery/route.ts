import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'

// Local-development helper only, backing /admin.
//
// The gallery itself is served from lib/gallery-manifest.json, baked at build
// time by scripts/gallery-manifest.mjs — there is no GET here any more; nothing
// called it. This POST writes into public/gallery/ on the local filesystem,
// which is meaningful only while `next dev` is running against the working
// tree. Serverless hosts don't carry a writable public/, and on Cloudflare
// Workers static assets are immutable after deploy, so in production this
// route reports 404 rather than failing halfway through an upload.
//
// The workflow is: drop photos in via /admin locally (or straight into
// public/gallery/), commit them, deploy.

const GALLERY_DIR = path.join(process.cwd(), 'public', 'gallery')
const ALLOWED = new Set(['.jpg', '.jpeg', '.png', '.webp'])
const MAX_BYTES = 15 * 1024 * 1024

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
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
