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

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, company, email, message, recaptchaToken } = body

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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
