import { NextRequest, NextResponse } from 'next/server'

async function verifyCaptcha(token: string): Promise<boolean> {
  if (!process.env.RECAPTCHA_SECRET_KEY) return true // Skip if not configured
  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
    })
    const data = await res.json()
    return data.success && data.score > 0.5 // reCAPTCHA v3 returns a score 0.0-1.0
  } catch (err) {
    console.error('[captcha] verification error:', err)
    return false
  }
}

// Caps on a public, unauthenticated endpoint that sends mail on our behalf.
// Without them a single request can push an arbitrarily large body through the
// Resend account. Generous enough that no genuine enquiry will hit them.
const LIMITS = { name: 200, company: 200, email: 320, message: 5000 }

const clean = (v: unknown, max: number) =>
  typeof v === 'string' ? v.trim().slice(0, max) : ''

export async function POST(req: NextRequest) {
  // req.json() throws on an absent or malformed body, which surfaced as an
  // unhandled 500 with an empty response — so every bot probing this endpoint
  // logged a server error. A bad request is the client's fault: say so.
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const raw = body as Record<string, unknown>
  const name = clean(raw.name, LIMITS.name)
  const company = clean(raw.company, LIMITS.company)
  const email = clean(raw.email, LIMITS.email)
  const message = clean(raw.message, LIMITS.message)
  const recaptchaToken = typeof raw.recaptchaToken === 'string' ? raw.recaptchaToken : ''

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  // Deliberately loose — just enough to catch a typo or a junk submission.
  // Anything stricter rejects valid addresses.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  // Verify reCAPTCHA
  if (recaptchaToken) {
    const captchaValid = await verifyCaptcha(recaptchaToken)
    if (!captchaValid) {
      return NextResponse.json({ error: 'Captcha verification failed' }, { status: 400 })
    }
  }

  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      // send() RESOLVES with { data: null, error } for API-level failures — an
      // unverified sending domain, a bad key, a rejected address. It only
      // throws on network errors. Ignoring the return value meant every one of
      // those was reported to the visitor as a successful send while the
      // enquiry was silently dropped, which is how a lost lead looks.
      const { data, error } = await resend.emails.send({
        from: 'website@latitudeequipment.co.uk',
        to: 'info@latitudeequipment.co.uk',
        replyTo: email,
        subject: `Enquiry from ${name}${company ? ` — ${company}` : ''}`,
        text: [
          `Name: ${name}`,
          `Company: ${company || '—'}`,
          `Email: ${email}`,
          '',
          message,
        ].join('\n'),
      })

      if (error) {
        // Log the enquiry alongside the failure so it is recoverable from the
        // Worker tail even though delivery failed.
        console.error('[contact] resend rejected the send:', error)
        console.error('[contact] undelivered enquiry:', { name, company, email, message })
        return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
      }

      console.log('[contact] sent:', data?.id)
    } catch (err) {
      console.error('[contact] send error:', err)
      console.error('[contact] undelivered enquiry:', { name, company, email, message })
      return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
    }
  } else {
    // Dev: log to console until RESEND_API_KEY is configured
    console.log('[contact] enquiry received:', { name, company, email, message })
  }

  return NextResponse.json({ ok: true })
}
