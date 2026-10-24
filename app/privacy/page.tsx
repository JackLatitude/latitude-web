import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Privacy notice',
  description:
    'How Latitude Equipment Ltd collects, uses and protects the personal data you send us through this website and the contact form.',
  alternates: { canonical: '/privacy' },
}

const UPDATED = '24 October 2026'

export default function PrivacyPage() {
  return (
    <>
      <Nav solid />
      <main className="section legal" style={{ paddingTop: 'calc(64px + var(--section-y))', borderBottom: 'none' }}>
        <article className="section__inner legal__inner">
          <span className="sigil" aria-hidden="true" />
          <h1 className="statement">
            Privacy <em>notice</em>.
          </h1>
          <p className="legal__meta">Last updated {UPDATED}</p>

          <h2>Who we are</h2>
          <p>
            This website is run by Latitude Equipment Ltd, registered in England &amp; Wales
            (company no. 14466173), registered office 195–197 Whiteladies Road, Bristol, BS8 2SB.
            We are the controller of the personal data described here. For anything about your
            data, email <a href="mailto:info@latitudeequipment.co.uk">info@latitudeequipment.co.uk</a>.
          </p>

          <h2>What we collect, and why</h2>
          <p>
            <strong>When you send an enquiry</strong> we receive your name, email address,
            company (if you give it) and your message. We use it only to reply and to discuss and
            quote for the work you&rsquo;re asking about. Our lawful basis is taking steps at your
            request before entering into a contract, and our legitimate interest in responding to
            business enquiries.
          </p>
          <p>
            <strong>When you browse the site</strong> our hosting provider processes technical
            data such as your IP address and browser type, to serve pages and protect the site
            from abuse. We also measure visits with Cloudflare Web Analytics, which does not use
            cookies or identify you; it gives us totals such as page views and referrers.
          </p>
          <p>We don&rsquo;t sell your data, use it for advertising, or add you to a mailing list.</p>

          <h2>Spam protection</h2>
          <p>
            The contact form is protected by Google reCAPTCHA, which checks that a person, not a
            bot, is using it. To do this Google collects hardware and software information, such
            as device and application data, and sends it to Google for analysis. Google&rsquo;s{' '}
            <a href="https://policies.google.com/privacy" rel="noopener noreferrer" target="_blank">Privacy Policy</a>{' '}
            and{' '}
            <a href="https://policies.google.com/terms" rel="noopener noreferrer" target="_blank">Terms of Service</a>{' '}
            apply to that processing.
          </p>

          <h2>Who handles it for us</h2>
          <ul>
            <li><strong>Cloudflare</strong>: website hosting, security and cookieless analytics.</li>
            <li><strong>Resend</strong>: delivers the contact form to our inbox.</li>
            <li><strong>Microsoft 365</strong>: our email, where enquiries are stored.</li>
            <li><strong>Google</strong>: reCAPTCHA spam protection, as above.</li>
          </ul>
          <p>
            Some of these providers process data outside the UK, including in the United States.
            Where they do, the transfer is covered by the UK International Data Transfer Addendum,
            the UK–US data bridge, or equivalent safeguards in their terms.
          </p>

          <h2>Cookies</h2>
          <p>
            We don&rsquo;t set any cookies of our own and we don&rsquo;t use advertising or tracking
            cookies, so there is no cookie banner. Google reCAPTCHA may set a cookie that is
            strictly necessary to tell people from bots.
          </p>

          <h2>How long we keep it</h2>
          <p>
            Enquiries that don&rsquo;t lead to work are deleted within 24 months. If we work
            together, we keep correspondence and records for as long as we need them to deliver
            the job and meet our legal and accounting obligations, normally six years.
          </p>

          <h2>Your rights</h2>
          <p>
            Under UK data protection law you can ask for a copy of the data we hold about you, and
            ask us to correct it, delete it, or stop or restrict using it. You can also object to
            processing based on legitimate interests. Email us and we&rsquo;ll respond within one
            month.
          </p>
          <p>
            If you&rsquo;re unhappy with how we&rsquo;ve handled your data, please tell us first.
            You also have the right to complain to the Information Commissioner&rsquo;s Office at{' '}
            <a href="https://ico.org.uk/make-a-complaint/" rel="noopener noreferrer" target="_blank">ico.org.uk</a>.
          </p>
        </article>
      </main>
      <Footer />

      <style>{`
        .legal__inner { max-width: 68ch; }
        .legal__meta {
          font-size: 0.7rem; letter-spacing: 0.18em; text-transform: uppercase;
          color: var(--text-tertiary); margin: 1.5rem 0 3rem;
        }
        .legal h2 {
          font-size: 0.95rem; font-weight: 500; color: #fff;
          margin: 2.75rem 0 0.9rem; letter-spacing: 0.01em;
        }
        .legal p, .legal li {
          color: var(--text-secondary); font-size: 0.92rem; line-height: 1.8; text-wrap: pretty;
        }
        .legal p { margin: 0 0 1rem; }
        .legal ul { margin: 0 0 1rem; padding-left: 1.1rem; }
        .legal li { margin-bottom: 0.35rem; }
        .legal li::marker { color: var(--rec); }
        .legal strong { color: #fff; font-weight: 500; }
        .legal a { color: #fff; text-decoration: underline; text-underline-offset: 2px; }
        .legal a:hover { color: var(--rec); }
      `}</style>
    </>
  )
}
