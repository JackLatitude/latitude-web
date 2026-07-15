// Builds lib/gallery-manifest.json from public/gallery/.
//
// The gallery used to readdir() this folder at request time. That works locally
// but not on Vercel: the route runs in a serverless function whose filesystem
// doesn't reliably carry public/, so the gallery came back empty in production.
// Resolving it at build time is both correct everywhere and one fetch faster.
//
// Runs automatically via the `predev` and `prebuild` npm hooks.
import { readdir, readFile, writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { imageSize } from 'image-size'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const GALLERY_DIR = path.join(root, 'public', 'gallery')
const OUT = path.join(root, 'lib', 'gallery-manifest.json')
const ALLOWED = new Set(['.jpg', '.jpeg', '.png', '.webp'])

let files = []
try {
  files = (await readdir(GALLERY_DIR))
    .filter((f) => ALLOWED.has(path.extname(f).toLowerCase()))
    .sort()
} catch {
  // No gallery folder yet — emit an empty manifest rather than failing the build.
}

const photos = (
  await Promise.all(
    files.map(async (f) => {
      try {
        const { width, height } = imageSize(await readFile(path.join(GALLERY_DIR, f)))
        if (!width || !height) return null
        return { src: `/gallery/${f}`, width, height }
      } catch {
        return null
      }
    })
  )
).filter(Boolean)

await mkdir(path.dirname(OUT), { recursive: true })
await writeFile(OUT, JSON.stringify(photos, null, 2))
console.log(`[gallery] ${photos.length} photos → lib/gallery-manifest.json`)
