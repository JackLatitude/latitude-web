// Preflight for the environment variables whose absence fails *silently*.
// Runs from `prebuild`, so only ahead of a real build, never on `npm run dev`.
//
// The two kinds are not interchangeable, and conflating them is misleading:
//
//   BUILD-TIME — NEXT_PUBLIC_* is inlined into the client bundle by
//   `next build`. If it is absent here it is absent forever; setting it on the
//   Worker afterwards does nothing. Missing means something is genuinely wrong.
//
//   RUNTIME — read by the Worker when a request arrives, and supplied by
//   `wrangler secret put`. It is *correctly* absent from the build environment
//   on Cloudflare, so treating it as a build problem cries wolf on every
//   properly configured deploy. Reported as a reminder, never as a warning.
//
// Env files load through @next/env, the same loader `next build` uses, so
// .env, .env.local and .env.production are honoured exactly as the build will.
// @next/env is CommonJS and has no named exports under ESM.
import nextEnv from '@next/env'

nextEnv.loadEnvConfig(process.cwd(), false)

const BUILD_TIME = [
  [
    'NEXT_PUBLIC_RECAPTCHA_SITE_KEY',
    'inlined into the client bundle now — it CANNOT be set later',
    'without it the contact form accepts submissions with NO spam protection',
  ],
  [
    'NEXT_PUBLIC_CF_BEACON_TOKEN',
    'inlined into the page now — it CANNOT be set later',
    'without it Cloudflare Web Analytics records no visits (unless the dashboard injects it)',
  ],
]

const RUNTIME = [
  ['RESEND_API_KEY', 'without it on the Worker, enquiries are logged and NEVER emailed'],
  ['RECAPTCHA_SECRET_KEY', 'without it on the Worker, captcha verification is skipped'],
]

const line = '─'.repeat(74)
const missingBuild = BUILD_TIME.filter(([n]) => !process.env[n])
const absentRuntime = RUNTIME.filter(([n]) => !process.env[n])

if (missingBuild.length) {
  console.warn(`\n\x1b[33m${line}`)
  console.warn('  WARNING: a build-time variable is missing')
  console.warn(line)
  for (const [name, when, effect] of missingBuild) {
    console.warn(`  ${name}`)
    console.warn(`    → ${when}`)
    console.warn(`    → ${effect}`)
  }
  console.warn(`${line}\x1b[0m`)
  console.warn('  Set this in the BUILD environment (.env locally, or Workers')
  console.warn('  Builds → Build variables and secrets). A Worker secret will')
  console.warn('  NOT work for it. See CLOUDFLARE.md §2.\n')
}

if (absentRuntime.length) {
  console.log(`\n${line}`)
  console.log('  Note: runtime secrets are not in the build environment.')
  console.log(line)
  console.log('  This is EXPECTED on Cloudflare — they live on the Worker, not')
  console.log('  in the build. Nothing is wrong with this build. Just confirm')
  console.log('  they are set on the Worker itself:')
  console.log('')
  for (const [name, effect] of absentRuntime) {
    console.log(`    npx wrangler secret put ${name}`)
    console.log(`      → ${effect}`)
  }
  console.log(`${line}\n`)
}
