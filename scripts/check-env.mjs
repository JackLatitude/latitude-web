// Preflight warning for the two environment variables whose absence fails
// *silently* in production. Runs from `prebuild`, so only ahead of a real
// build — never on `npm run dev`.
//
// Neither of these breaks the build or throws at runtime, which is the problem.
// Without the reCAPTCHA site key the client sends an empty token, and
// /api/contact treats an empty token as "no captcha configured" and skips
// verification — the form works with no spam protection at all. Without the
// Resend key the route logs the enquiry to the console and still returns ok,
// so the form reports "sent" and the email never arrives.
//
// Deliberately a warning, not an error: both are legitimately absent in local
// development. The go-live checklist in CLOUDFLARE.md is what must catch this.
//
// Env files are loaded through @next/env — the same loader `next build` uses —
// so this honours .env, .env.local and .env.production exactly as the build
// will. Reading process.env alone would warn spuriously whenever the values
// live in a .env file rather than the shell.
// @next/env is CommonJS, so it has no named exports under ESM.
import nextEnv from '@next/env'

nextEnv.loadEnvConfig(process.cwd(), false)

const missing = [
  ['NEXT_PUBLIC_RECAPTCHA_SITE_KEY', 'contact form accepts submissions with NO spam protection'],
  ['RESEND_API_KEY', 'enquiries are logged to the console and NEVER emailed'],
].filter(([name]) => !process.env[name])

if (missing.length) {
  const line = '─'.repeat(72)
  console.warn(`\n\x1b[33m${line}`)
  console.warn('  WARNING: this build is missing environment variables')
  console.warn(line)
  for (const [name, effect] of missing) console.warn(`  ${name}\n    → ${effect}`)
  console.warn(`${line}\x1b[0m`)
  console.warn('  Both fail silently — the contact form reports success either way.')
  console.warn('  NEXT_PUBLIC_* is inlined at BUILD time, so it must be set here,')
  console.warn('  not as a Worker secret. See CLOUDFLARE.md §2.\n')
}
