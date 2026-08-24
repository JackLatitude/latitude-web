# Deploying to Cloudflare Workers

## Why `npx wrangler deploy` on its own fails

`wrangler deploy` uploads a Worker that already exists. A Next.js app is not a
Worker — it has to be compiled into one first, by the OpenNext adapter. So the
deploy is always two steps, and `npm run deploy` runs both:

```
opennextjs-cloudflare build   # next build, then bundle .open-next/worker.js
opennextjs-cloudflare deploy  # wrangler deploy, against that bundle
```

Running bare `wrangler deploy` before the first `opennextjs-cloudflare build`
fails because `.open-next/worker.js` (the `main` in `wrangler.jsonc`) does not
exist yet. `.open-next/` is a build artefact and is gitignored, so it is never
present on a fresh clone.

One footgun worth knowing: wrangler resolves config by walking up from the
current directory. Run it from the repo root — from `~` it will try to scan
the whole home directory and die on `~/.Trash` with a confusing permissions
error.

## First-time setup

```bash
npx wrangler login
```

Then set the runtime secrets once per Worker. They are deliberately **not** in
`wrangler.jsonc`, which is committed in plaintext:

```bash
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put RECAPTCHA_SECRET_KEY
```

`NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is different: `NEXT_PUBLIC_*` values are
inlined into the client bundle by `next build`, so it must be present in the
**build** environment, not as a Worker secret. Locally that means `.env`; in
Workers Builds CI it goes under *Build variables and secrets*.

## Everyday commands

| Command           | What it does                                            |
| ----------------- | ------------------------------------------------------- |
| `npm run dev`     | Next dev server on :3000 — normal local development      |
| `npm run preview` | Build, then serve the real Worker locally on :8787       |
| `npm run deploy`  | Build, then deploy to Cloudflare                         |
| `npm run cf-typegen` | Regenerate binding types after editing wrangler.jsonc |

Use `npm run preview` before any deploy. It runs the actual workerd runtime,
so it catches things `next dev` cannot — anything relying on Node APIs that
Workers does not implement, in particular.

## Things that behave differently on Workers

**Image optimization.** Workers has no Next image optimizer; the default
`/_next/image` loader is unsupported. `next.config.ts` sets
`images.unoptimized: true`. The only `next/image` uses are the two wordmark
PNGs in the nav and footer, rendered at 28px and 22px tall, so nothing is lost.
Gallery photos never went through `next/image` — react-photo-album renders
plain `<img>` against `public/gallery/`. If real photography is ever put
through `next/image`, switch to the Cloudflare Images binding instead:
https://opennext.js.org/cloudflare/howtos/image

**The gallery uploader.** `/admin` and `POST /api/gallery` write into
`public/gallery/` on the local filesystem. That works under `npm run dev` and
nowhere else — serverless hosts have no writable `public/`, and Workers static
assets are immutable after deploy. The route returns 404 in production by
design. To publish photos: add them locally (via `/admin` or straight into
`public/gallery/`), commit, deploy. `scripts/gallery-manifest.mjs` rebuilds
`lib/gallery-manifest.json` on every build.

**Caching.** `open-next.config.ts` uses defaults, which is correct for this
site — every page is static or a plain dynamic route, so there is no ISR cache
or tag revalidation to wire up. If ISR is introduced later, add a cache
adapter: https://opennext.js.org/cloudflare/caching

## Verified on this branch

Built and run against the local workerd runtime (`wrangler dev`):

- `/`, `/admin`, `/sitemap.xml` → 200; unknown paths → 404
- static assets (`/gallery/*.jpg`, `/logo/*.png`) served from the asset binding
- `POST /api/contact` → 400 on missing fields, 200 on a valid submission
- `POST /api/gallery` → 404, as intended in production
- no `/_next/image` URLs in the rendered HTML
- upload size 6553.61 KiB, **gzip 1420.69 KiB** — within the 3 MB free-plan limit
