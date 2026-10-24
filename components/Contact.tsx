'use client'
import { useState, useRef, useEffect } from 'react'
import { useReveal } from '@/lib/useReveal'

type Status = 'idle' | 'sending' | 'sent' | 'error'
type FormState = { name: string; company: string; email: string; message: string }
type Errors = Partial<Record<keyof FormState, string>>

// Mirrors the server's checks in app/api/contact/route.ts, so a visitor is told
// what to fix beside the field instead of getting a generic failure back.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(f: FormState): Errors {
  const e: Errors = {}
  if (!f.name.trim()) e.name = 'Please tell us your name.'
  if (!f.email.trim()) e.email = 'We need an email address to reply to.'
  else if (!EMAIL_RE.test(f.email.trim())) e.email = 'That email address doesn\u2019t look right.'
  if (!f.message.trim()) e.message = 'Tell us a little about the job: dates, location, kit.'
  return e
}

// Load reCAPTCHA v3 script
declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void
      execute: (siteKey: string, options: { action: string }) => Promise<string>
    }
  }
}

function Field({
  id, label, type = 'text', value, onChange, required, textarea, autoComplete = 'off', error,
}: {
  id: string
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  textarea?: boolean
  autoComplete?: string
  error?: string
}) {
  const a11y = {
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${id}-error` : undefined,
  }
  return (
    <div className={`field${value ? ' filled' : ''}${error ? ' invalid' : ''}`}>
      {textarea ? (
        <textarea
          id={id}
          name={id}
          rows={5}
          value={value}
          required={required}
          placeholder=" "
          onChange={e => onChange(e.target.value)}
          {...a11y}
        />
      ) : (
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          required={required}
          placeholder=" "
          autoComplete={autoComplete}
          onChange={e => onChange(e.target.value)}
          {...a11y}
        />
      )}
      <label htmlFor={id}>
        {label}
        {required && <span className="req" aria-hidden="true"> *</span>}
      </label>
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  )
}

export default function Contact() {
  const { ref, inView } = useReveal()
  const [status, setStatus] = useState<Status>('idle')
  const [form, setForm] = useState<FormState>({ name: '', company: '', email: '', message: '' })
  const [errors, setErrors] = useState<Errors>({})
  // Errors stay quiet while the visitor first types; after a failed submit they
  // update live, so a fixed field clears its message straight away.
  const [attempted, setAttempted] = useState(false)
  const sentRef = useRef<HTMLDivElement>(null)

  const set = (k: keyof FormState) => (v: string) => {
    const next = { ...form, [k]: v }
    setForm(next)
    if (attempted) setErrors(validate(next))
  }

  // The form unmounts on success; move focus to the confirmation so screen
  // reader and keyboard users aren't left on a node that no longer exists.
  useEffect(() => {
    if (status === 'sent') sentRef.current?.focus()
  }, [status])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setAttempted(true)
    const found = validate(form)
    setErrors(found)
    const first = (Object.keys(found) as (keyof FormState)[])[0]
    if (first) {
      e.currentTarget.querySelector<HTMLElement>(`#${first}`)?.focus()
      return
    }
    setStatus('sending')
    try {
      let token = ''
      if (window.grecaptcha) {
        token = await window.grecaptcha.execute(
          process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '',
          { action: 'submit' }
        )
      }
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, recaptchaToken: token }),
      })
      setStatus(res.ok ? 'sent' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section id="contact" className="section" ref={ref as React.RefObject<HTMLElement>} style={{ borderBottom: 'none' }}>
      <div className={`section__inner contact-grid stagger${inView ? ' in' : ''}`}>
        <div className="contact-intro">
          <span className="sigil" aria-hidden="true" />
          <h2 className="statement" style={{ marginBottom: '1.75rem', maxWidth: '14ch' }}>
            Start a <em>conversation</em>.
          </h2>
          <p className="lede" style={{ marginBottom: '1.5rem' }}>
            For hire enquiries, availability and production requirements.
          </p>
          <a className="contact-email" href="mailto:info@latitudeequipment.co.uk">
            info@latitudeequipment.co.uk
          </a>
        </div>

        <div className="contact-form-wrap">
          {status === 'sent' ? (
            <div className="contact-sent" role="status" tabIndex={-1} ref={sentRef}>
              <span className="sigil" aria-hidden="true" />
              <h3 className="contact-sent__title">
                Thanks{form.name.trim() ? `, ${form.name.trim().split(/\s+/)[0]}` : ''}. Enquiry received.
              </h3>
              <p>
                It&rsquo;s gone straight to the team, and we&rsquo;ll reply to{' '}
                <strong>{form.email.trim()}</strong> as soon as we can.
              </p>
              <p>
                Anything urgent or time-sensitive? Email{' '}
                <a href="mailto:info@latitudeequipment.co.uk">info@latitudeequipment.co.uk</a>{' '}
                and mention your shoot dates.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate aria-busy={status === 'sending'}>
              <div className="field-row">
                <Field id="name" label="Name" value={form.name} onChange={set('name')} autoComplete="name" required error={errors.name} />
                <Field id="company" label="Company" value={form.company} onChange={set('company')} autoComplete="organization" />
              </div>
              <Field id="email" label="Email" type="email" value={form.email} onChange={set('email')} autoComplete="email" required error={errors.email} />
              <Field id="message" label="Message" value={form.message} onChange={set('message')} required textarea error={errors.message} />

              {status === 'error' && (
                <p className="contact-error" role="alert">
                  Your enquiry didn&rsquo;t send. Please try again, or email us directly at{' '}
                  <a href="mailto:info@latitudeequipment.co.uk">info@latitudeequipment.co.uk</a>.
                </p>
              )}

              <div className="contact-actions">
                <button type="submit" className="contact-submit" disabled={status === 'sending'}>
                  {status === 'sending' && <span className="contact-spinner" aria-hidden="true" />}
                  {status === 'sending' ? 'Sending…' : 'Send Enquiry'}
                </button>
                <p className="contact-privacy">
                  We only use your details to reply. See our <a href="/privacy">privacy notice</a>.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>

      <style>{`
        .contact-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: clamp(2.5rem, 6vw, 6rem);
          align-items: start;
        }
        .contact-email {
          font-size: 0.85rem; font-weight: 500; color: rgba(255,255,255,0.85);
          text-decoration: none; transition: color 0.2s ease;
          border-bottom: 1px solid var(--grey-rule); padding-bottom: 2px;
        }
        .contact-email:hover { color: var(--rec); border-color: var(--rec); }

        .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .field { position: relative; margin-bottom: 1rem; }
        .field input, .field textarea {
          width: 100%; background: var(--surface);
          border: 1px solid var(--grey-rule); border-radius: 2px;
          color: #fff; font-family: inherit; font-size: 0.85rem; font-weight: 400;
          padding: 1.35rem 1rem 0.6rem; outline: none;
          transition: border-color 0.2s ease, background 0.2s ease;
        }
        .field textarea { resize: none; min-height: 130px; }
        .field input:focus, .field textarea:focus {
          border-color: rgba(255,255,255,0.35); background: var(--surface-raised);
        }
        .field label {
          position: absolute; left: 1rem; top: 0.95rem;
          font-size: 0.85rem; color: var(--text-tertiary);
          pointer-events: none; transform-origin: left top;
          transition: transform 0.18s var(--ease-expo), color 0.18s ease;
        }
        .field .req { color: var(--rec); }
        .field.filled label,
        .field input:focus + label,
        .field textarea:focus + label {
          transform: translateY(-0.75rem) scale(0.72);
          color: var(--text-secondary);
          letter-spacing: 0.1em; text-transform: uppercase;
        }
        .field input:focus + label, .field textarea:focus + label { color: var(--rec); }

        .field.invalid input, .field.invalid textarea { border-color: var(--rec); }
        .field.invalid label { color: var(--rec); }
        .field-error {
          font-size: 0.72rem; color: var(--rec); margin: 0.4rem 0 0; line-height: 1.5;
        }
        .contact-error {
          font-size: 0.78rem; line-height: 1.6; color: #fff; margin: 0.25rem 0 1rem;
          padding: 0.85rem 1rem; border: 1px solid var(--rec); background: var(--rec-dim);
        }
        .contact-error a, .contact-sent a, .contact-privacy a {
          color: inherit; text-decoration: underline; text-underline-offset: 2px;
        }
        .contact-actions {
          display: flex; flex-wrap: wrap; align-items: center; gap: 1rem 1.5rem; margin-top: 0.5rem;
        }
        .contact-privacy { font-size: 0.72rem; color: var(--text-tertiary); margin: 0; }
        .contact-privacy a:hover { color: #fff; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .contact-spinner {
          width: 10px; height: 10px; border-radius: 50%;
          border: 1.5px solid currentColor; border-right-color: transparent;
          animation: spin 0.7s linear infinite;
        }
        .contact-submit {
          display: inline-flex; align-items: center; gap: 0.6rem;
          background: var(--rec); color: #fff; border: 1px solid var(--rec);
          border-radius: 2px; font-family: inherit;
          font-size: 0.62rem; font-weight: 700; letter-spacing: 0.22em;
          text-transform: uppercase; padding: 0.95rem 2.25rem;
          cursor: pointer; transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
        }
        .contact-submit:hover:not(:disabled) { background: #fff; color: #0a0a0a; border-color: #fff; }
        .contact-submit:disabled { opacity: 0.5; cursor: not-allowed; }
        .contact-sent {
          padding: 2rem; border: 1px solid var(--grey-rule); border-left: 2px solid var(--rec);
          color: var(--text-secondary); font-size: 0.9rem; line-height: 1.7; outline: none;
        }
        .contact-sent p { margin: 0 0 0.75rem; }
        .contact-sent p:last-child { margin: 0; }
        .contact-sent strong { color: #fff; font-weight: 500; }
        .contact-sent__title {
          font-size: 1.1rem; font-weight: 500; color: #fff; margin: 0 0 0.75rem; line-height: 1.3;
        }
        @media (max-width: 760px) {
          .contact-grid { grid-template-columns: 1fr; gap: 2.5rem; }
          .field-row { grid-template-columns: 1fr; }
        }
        @media (prefers-reduced-motion: reduce) {
          .contact-spinner { animation: none; }
        }
      `}</style>
    </section>
  )
}
