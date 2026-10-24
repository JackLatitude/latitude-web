// Generates the raster brand assets that browsers and social platforms need
// but can't derive from SVG: the favicon set and the Open Graph card.
//
//   public/favicon.ico          32px, for browsers that still ask for /favicon.ico
//   public/apple-touch-icon.png 180px, iOS home screen
//   public/icon-192.png         Android / web manifest
//   public/icon-512.png         Android / web manifest (splash)
//   public/og-image.png         1200×630 link preview card
//
// The OG card was an SVG, which Facebook, LinkedIn, X, WhatsApp, iMessage and
// Slack all refuse — every shared link previewed with no image. PNG only.
//
// Not wired into a build hook: the outputs are committed. Re-run by hand after
// changing the logo or the card copy:  node scripts/brand-assets.mjs
import { readFile, writeFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { ImageResponse } from 'next/dist/compiled/@vercel/og/index.node.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pub = (...p) => path.join(root, 'public', ...p)

const BLACK = '#0a0a0a'
const RED = '#ED2643'

// ── Icons ────────────────────────────────────────────────────────────────────
// The brand's degree mark: a red ring on black. Square with a background, not
// transparent — iOS fills transparency with black anyway, and Android adaptive
// icons crop the corners, so the ring sits inside a generous safe zone.
const iconSvg = (size) => {
  const r = size * 0.3
  const stroke = size * 0.11
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <rect width="100%" height="100%" fill="${BLACK}"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${RED}" stroke-width="${stroke}"/>
    </svg>`
  )
}

const png = (size) => sharp(iconSvg(size)).png().toBuffer()

await writeFile(pub('apple-touch-icon.png'), await png(180))
await writeFile(pub('icon-192.png'), await png(192))
await writeFile(pub('icon-512.png'), await png(512))

// An .ico may wrap a PNG directly (supported everywhere since Vista), so the
// container is just a 6-byte header plus one 16-byte directory entry.
const ico32 = await png(32)
const header = Buffer.alloc(22)
header.writeUInt16LE(0, 0) // reserved
header.writeUInt16LE(1, 2) // type: icon
header.writeUInt16LE(1, 4) // image count
header.writeUInt8(32, 6) // width
header.writeUInt8(32, 7) // height
header.writeUInt8(0, 8) // palette
header.writeUInt8(0, 9) // reserved
header.writeUInt16LE(1, 10) // colour planes
header.writeUInt16LE(32, 12) // bits per pixel
header.writeUInt32LE(ico32.length, 14) // image size
header.writeUInt32LE(22, 18) // image offset
await writeFile(pub('favicon.ico'), Buffer.concat([header, ico32]))

// ── Open Graph card ──────────────────────────────────────────────────────────
// Wordmark rebuilt the same way the hero draws it: white letterforms from the
// mask, red circle laid over the top.
const WORD_W = 880
const WORD_H = Math.round(WORD_W * (538 / 2000))
const letters = await sharp(pub('logo', 'wordmark-letters-mask.png')).resize(WORD_W, WORD_H).toBuffer()
const circle = await sharp(pub('logo', 'wordmark-circle.png')).resize(WORD_W, WORD_H).toBuffer()
const wordmark = await sharp({
  create: { width: WORD_W, height: WORD_H, channels: 4, background: '#ffffff' },
})
  .composite([
    { input: letters, blend: 'dest-in' },
    { input: circle, blend: 'over' },
  ])
  .png()
  .toBuffer()

const font = (w) => readFile(pub('fonts', `Metropolis-${w}.ttf`))
const h = (type, props, ...children) => ({
  type,
  props: { ...props, children: children.length === 1 ? children[0] : children },
})

const card = new ImageResponse(
  h(
    'div',
    {
      style: {
        width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', background: BLACK,
        fontFamily: 'Metropolis', position: 'relative',
      },
    },
    h('div', { style: { display: 'flex', position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: RED } }),
    h('img', { src: `data:image/png;base64,${wordmark.toString('base64')}`, width: WORD_W, height: WORD_H }),
    h(
      'div',
      {
        style: {
          display: 'flex', marginTop: 56, fontSize: 22, fontWeight: 500, letterSpacing: 7,
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.62)',
        },
      },
      'Specialist Camera Equipment  /  Television & Film'
    ),
    h(
      'div',
      { style: { display: 'flex', position: 'absolute', bottom: 40, fontSize: 20, color: 'rgba(255,255,255,0.4)', letterSpacing: 2 } },
      'latitudeequipment.co.uk'
    )
  ),
  {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Metropolis', data: await font('Regular'), weight: 400 },
      { name: 'Metropolis', data: await font('Medium'), weight: 500 },
    ],
  }
)
await writeFile(pub('og-image.png'), Buffer.from(await card.arrayBuffer()))

console.log('[brand-assets] favicon.ico, apple-touch-icon.png, icon-192/512.png, og-image.png')
