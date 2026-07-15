'use client'
import { useState } from 'react'
import { useReveal } from '@/lib/useReveal'

type Status = 'idle' | 'sending' | 'sent' | 'error'

function Field({
  id, label, type = 'text', value, onChange, required, textarea,
}: {
  id: string
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  textarea?: boolean
}) {
  return (
    <div className={`field${value ? ' filled' : ''}`}>
      {textarea ? (
        <textarea
          id={id}
          rows={5}
          value={value}
          required={required}
          placeholder=" "
          onChange={e => onChange(e.target.value)}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          required={required}
          placeholder=" "
          autoComplete={type === 'email' ? 'email' : 'off'}
          onChange={e => onChange(e.target.value)}
        />
      )}
      <label htmlFor={id}>
        {label}
        {required && <span className="req" aria-hidden="true"> *</span>}
      </label>
    </div>
  )
}

export default function Contact() {
  const { ref, inView } = useReveal()
  const [status, setStatus] = useState<Status>('idle')
  const [form, setForm] = useState({ name: '', company: '', email: '', message: '' })

  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
            <div className="contact-sent" role="status">
              Message received. We&rsquo;ll be in touch.
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="field-row">
                <Field id="name" label="Name" value={form.name} onChange={set('name')} required />
                <Field id="company" label="Company" value={form.company} onChange={set('company')} />
              </div>
              <Field id="email" label="Email" type="email" value={form.email} onChange={set('email')} required />
              <Field id="message" label="Message" value={form.message} onChange={set('message')} required textarea />

              {status === 'error' && (
                <p className="contact-error" role="alert">
                  Something went wrong. Email us directly at info@latitudeequipment.co.uk
                </p>
              )}

              <button type="submit" className="contact-submit" disabled={status === 'sending'}>
                {status === 'sending' ? 'Sending…' : 'Send Enquiry'}
              </button>
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

        .contact-error {
          font-size: 0.75rem; color: var(--rec); margin: 0.25rem 0 1rem;
        }
        .contact-submit {
          margin-top: 0.5rem;
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
          color: var(--text-secondary); font-size: 0.9rem; line-height: 1.7;
        }
        @media (max-width: 760px) {
          .contact-grid { grid-template-columns: 1fr; gap: 2.5rem; }
          .field-row { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  )
}
