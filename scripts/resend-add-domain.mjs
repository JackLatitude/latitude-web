// One-off helper: register the sending subdomain in Resend and print the DNS
// records it wants. Reads RESEND_API_KEY from .env, so no key goes on the
// command line or into shell history.
//
// Run:  node scripts/resend-add-domain.mjs
import nextEnv from '@next/env'
nextEnv.loadEnvConfig(process.cwd(), false)

const NAME = 'notifications.latitudeequipment.co.uk'
const REGION = 'eu-west-1' // must match the MX already in DNS

const key = process.env.RESEND_API_KEY
if (!key) {
  console.error('RESEND_API_KEY not found in .env — aborting.')
  process.exit(1)
}
const headers = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }

const show = (d) => {
  console.log(`\ndomain: ${d.name}`)
  console.log(`status: ${d.status}   region: ${d.region}\n`)
  console.log('Add these records in Cloudflare, then press Verify at resend.com/domains:\n')
  for (const r of d.records || []) {
    console.log(`  TYPE : ${r.type}`)
    console.log(`  NAME : ${r.name}`)
    console.log(`  VALUE: ${r.value}`)
    if (r.priority !== undefined) console.log(`  PRIO : ${r.priority}`)
    console.log('')
  }
}

// Reuse the domain if it already exists rather than erroring.
const list = await (await fetch('https://api.resend.com/domains', { headers })).json()
const existing = (list.data || []).find((d) => d.name === NAME)

if (existing) {
  console.log(`${NAME} is already registered — fetching its records.`)
  show(await (await fetch(`https://api.resend.com/domains/${existing.id}`, { headers })).json())
} else {
  const res = await fetch('https://api.resend.com/domains', {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: NAME, region: REGION }),
  })
  const body = await res.json()
  if (!res.ok) {
    console.error(`Resend returned ${res.status}:`, JSON.stringify(body, null, 2))
    process.exit(1)
  }
  console.log(`Registered ${NAME}.`)
  show(body)
}
