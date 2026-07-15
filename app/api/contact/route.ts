import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, company, email, message } = body

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
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
    } catch (err) {
      console.error('[contact] send error:', err)
      return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
    }
  } else {
    // Dev: log to console until RESEND_API_KEY is configured
    console.log('[contact] enquiry received:', { name, company, email, message })
  }

  return NextResponse.json({ ok: true })
}
