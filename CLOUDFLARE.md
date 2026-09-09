# Deploying to Cloudflare Workers

Handover notes for whoever takes this live. The branch is ready to deploy; the
steps below are what remain, in order.

---

## 0. Requirements

- **Node >= 20.9** (Next 16's floor). `.nvmrc` pins **24**, which is what this
  branch was actually built and tested against — `nvm use` will pick it up.
  `package.json` declares the wider `>=20.9.0` range.
- `npm ci` (not `npm install`) — the lockfile is committed and reproducible.

## 1. Why `npx wrangler deploy` fails

`wrangler deploy` uploads a Worker that already exists. A Next.js app is not a
Worker — the OpenNext adapter has to compile it into one first. The deploy is
always two steps, and `npm run deploy` runs both:

```
opennextjs-cloudflare build   # next build, then bundle .open-next/worker.js
opennextjs-cloudflare deploy  # wrangler deploy, against that bundle
```

Bare `wrangler deploy` fails because `.open-next/worker.js` (the `main` in
`wrangler.jsonc`) does not exist until that first command has run. `.open-next/`
is a build artefact and is gitignored, so it is never present on a fresh clone.

Two other footguns worth knowing up front:

- **Run wrangler from the repo root.** It resolves config by walking *up* from
  the current directory; from a home directory it will try to scan the whole
  tree and die on `~/.Trash` with a misleading permissions error.
- **Do not run `npm audit fix --force`.** It proposes *downgrading* wrangler
  from 4.130.0 to 4.15.2, which breaks this setup. The audit is currently clean;
  leave it alone.

## 2. First-time setup

```bash
nvm use          # or ensure node >= 20.9
npm ci
npx wrangler login
```

### Secrets — two different mechanisms, and this matters

| Variable | Where it goes | Why |
| --- | --- | --- |
| `RESEND_API_KEY` | `wrangler secret put` | Read at runtime by the Worker |
| `RECAPTCHA_SECRET_KEY` | `wrangler secret put` | Read at runtime by the Worker |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | **Build environment** | `NEXT_PUBLIC_*` is inlined into the client bundle by `next build` |

```bash
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put RECAPTCHA_SECRET_KEY
```

The third one is **not** a Worker secret. Setting it with `wrangler secret put`
will appear to work and will do nothing. It must exist when `next build` runs —
a local `.env`, or *Workers Builds → Build variables and secrets* in CI. See
`.env.example`.

> **Both missing variables fail silently.** Without the site key the client
> sends an empty captcha token, and the API treats an empty token as "captcha
> not configured" and skips verification — the form works with no spam
> protection. Without the Resend key the API logs the enquiry to the console
> and still returns success — the form says "sent" and no email arrives.
> `npm run build` prints a loud warning if either is missing from a production
> build (`scripts/check-env.mjs`), but nothing errors. Check them.

## 2b. BLOCKER: verify the sending domain in Resend

**As of 9 Sep 2026 `latitudeequipment.co.uk` is at status `not_started` in
Resend, so the contact form cannot send at all.** The API rejects every send
with "The latitudeequipment.co.uk domain is not verified." This is not a
Cloudflare problem and migrating will not fix it — it is equally broken on the
current Vercel deployment.

Add these DNS records wherever the zone is managed (Cloudflare, once the
migration is done), then press **Verify** at https://resend.com/domains:

| Type | Name | Value |
| --- | --- | --- |
| TXT | `resend._domainkey` | the DKIM `p=MIGf…` public key shown in the Resend dashboard |
| MX | `send` | `feedback-smtp.eu-west-1.amazonses.com` (priority 10) |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` |

If these are proxied through Cloudflare, make sure they are **DNS-only** — MX
and TXT records must not be orange-clouded.

Until this is done the contact form will return a 500 to visitors. That is
deliberate: the route used to report success regardless, which silently binned
enquiries. See §5.

## 3. Go-live runbook

**Step 1 — preflight.** From a clean clone:

```bash
npm ci && npm run preview
```

`preview` builds and serves the real Worker on `localhost:8787` using the same
runtime Cloudflare runs. Confirm the homepage, gallery lightbox and contact form
work. Watch the build output for the missing-variable warning above.

**Step 2 — deploy to the workers.dev subdomain first.** Do not point the live
domain at anything yet:

```bash
npm run deploy
```

This publishes to `latitude-equipment-web.<your-subdomain>.workers.dev`. The
live site is still on Vercel and completely unaffected at this point.

**Step 3 — verify on workers.dev.** Load that URL and check:

- homepage renders, globe and gallery both appear
- gallery lightbox opens, shuffle works
- **submit the contact form and confirm the email actually arrives** at
  info@latitudeequipment.co.uk — this is the one thing that cannot be verified
  without real secrets, and the one that fails silently
- `/admin` is expected to load but reject uploads (see §5)

**Step 4 — attach the custom domain.** The zone must already be on Cloudflare.

⚠️ **`latitudeequipment.co.uk` currently resolves to Vercel.** A custom domain
cannot be attached to a hostname that already has a CNAME record, so the
existing Vercel DNS record must be deleted first. That is the actual moment of
cutover — there will be a brief window where the domain resolves to neither.
Do it at a quiet time.

Dashboard: **Workers & Pages → latitude-equipment-web → Settings → Domains &
Routes → Add → Custom Domain**. Cloudflare creates the DNS record and issues
the certificate automatically.

Or declaratively, by adding to `wrangler.jsonc` and redeploying:

```jsonc
"routes": [
  { "pattern": "latitudeequipment.co.uk", "custom_domain": true },
  { "pattern": "www.latitudeequipment.co.uk", "custom_domain": true }
]
```

This is deliberately **not** in the committed config — with it present, any
`npm run deploy` would seize the production domain, including a first
exploratory one.

**Step 5 — verify on the real domain**, then decommission the Vercel project.
Keep it until you are satisfied; it is the rollback.

### Rollback

Fastest path is DNS: delete the Cloudflare custom domain and restore the Vercel
CNAME. Note that removing a custom domain does **not** remove the Advanced
Certificate Cloudflare generated — delete that manually under **SSL/TLS → Edge
Certificates** if you are abandoning the migration.

To roll back code rather than hosting, `npx wrangler rollback` reverts the
Worker to its previous version.

## 4. Everyday commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Next dev server on :3000 — normal local development |
| `npm run preview` | Build, then serve the real Worker locally on :8787 |
| `npm run deploy` | Build, then deploy to Cloudflare |
| `npm run cf-typegen` | Regenerate binding types after editing `wrangler.jsonc` |

Use `npm run preview` before any deploy. It runs the actual workerd runtime, so
it catches things `next dev` cannot — anything relying on Node APIs Workers does
not implement, in particular.

### Continuous deployment (optional)

Instead of deploying from a laptop, connect the repo under **Workers & Pages →
Create → Connect to Git**. Set the build command to `npm run deploy` and add
`NEXT_PUBLIC_RECAPTCHA_SITE_KEY` under *Build variables and secrets* — the
runtime secrets stay as Worker secrets.

## 5. Things that behave differently on Workers

**Image optimization.** Workers has no Next image optimizer; the default
`/_next/image` loader is unsupported and would 500. `next.config.ts` sets
`images.unoptimized: true`. The only `next/image` uses are the two wordmark
PNGs in the nav and footer, at 28px and 22px tall, so nothing is lost. Gallery
photos never went through `next/image` — react-photo-album renders plain `<img>`
against `public/gallery/`. If real photography is ever put through
`next/image`, switch to the Cloudflare Images binding instead:
https://opennext.js.org/cloudflare/howtos/image

**The gallery uploader.** `/admin` and `POST /api/gallery` write into
`public/gallery/` on the local filesystem. That works under `npm run dev` and
nowhere else — serverless hosts have no writable `public/`, and Workers static
assets are immutable after deploy. The route returns 404 in production **by
design; this is not a bug to report.** To publish photos: add them locally (via
`/admin` or straight into `public/gallery/`), commit, deploy.
`scripts/gallery-manifest.mjs` rebuilds `lib/gallery-manifest.json` on every
build.

**Caching.** `open-next.config.ts` uses defaults, which is correct here — every
page is static or a plain dynamic route, so there is no ISR cache or tag
revalidation to wire up. If ISR is introduced later, add a cache adapter:
https://opennext.js.org/cloudflare/caching

## 6. What has been verified

From a **fresh clone of this branch**, not a working copy:

- `npm ci` — exit 0, **0 vulnerabilities** (also with `--omit=dev`)
- `opennextjs-cloudflare build` — exit 0, Worker bundled
- TypeScript — clean

Against the **real workerd runtime** (`wrangler dev`), with real credentials
loaded — 18 checks, all passing:

| Check | Result |
| --- | --- |
| `/`, `/admin`, `/sitemap.xml`, `/robots.txt` | 200 |
| unknown paths | 404 |
| `/gallery/*.jpg`, `/logo/*.png` | 200, served from the asset binding |
| `POST /api/contact` — no body / non-JSON / JSON array | 400 |
| `POST /api/contact` — empty object, blank name | 400 "Missing required fields" |
| `POST /api/contact` — malformed email | 400 "Invalid email address" |
| `POST /api/contact` — 20,000-char message | stored at exactly 5,000 (cap holds) |
| `POST /api/contact` — valid payload | 500, correctly reporting the Resend rejection |
| `POST /api/gallery` | 404, as intended in production |
| `/_next/image` URLs in rendered HTML | none |
| `noindex` on `/admin` | present |
| `noindex` on `/` | absent (homepage stays indexable) |

Credentials themselves were checked directly against the providers: the Resend
key is accepted by its API, and the reCAPTCHA secret is accepted by Google's
`siteverify` (a deliberately bogus token returns `invalid-input-response`
rather than `invalid-input-secret`, which is what a wrong or mismatched key
would give). The reCAPTCHA site key is confirmed inlined into the built client
bundle.

CI (`.github/workflows/ci.yml`) re-runs the install, both audits, the typecheck
and the full build on Linux for every push and PR, so none of the above has to
be taken on trust.

`wrangler deploy --dry-run`: 6553.61 KiB upload, **gzip 1420.69 KiB** — inside
the 3 MB free-plan limit.

Tested against the **live Resend API** with real credentials: the contact route
correctly returns 500 and logs the reason when Resend rejects a send. Delivery
itself could not be confirmed because the sending domain is unverified (§2b).

**Still unverified, and must be checked on workers.dev before DNS cutover:**
that an enquiry actually lands in the info@ inbox once the domain is verified,
and that reCAPTCHA scores real submissions correctly.
