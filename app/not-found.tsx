import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

// Next already marks the 404 noindex; adding robots here duplicates the tag.
export const metadata: Metadata = {
  title: 'Page not found',
}

export default function NotFound() {
  return (
    <>
      <Nav solid />
      <main
        className="section"
        style={{
          minHeight: '100svh',
          display: 'flex',
          alignItems: 'center',
          paddingTop: 'calc(64px + var(--section-y))',
          borderBottom: 'none',
        }}
      >
        <div className="section__inner" style={{ width: '100%' }}>
          <p
            style={{
              fontSize: '0.65rem',
              fontWeight: 500,
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: 'var(--text-tertiary)',
              margin: '0 0 1.6rem',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <span style={{ color: 'var(--rec)' }}>404</span>&nbsp;&nbsp;/&nbsp;&nbsp;Off the map
          </p>
          <h1 className="statement" style={{ maxWidth: '16ch', marginBottom: '1.75rem' }}>
            This page has <em>no signal</em>.
          </h1>
          <p className="lede" style={{ marginBottom: '2.5rem' }}>
            The link may be old or mistyped. Everything we do is on the home page, and if
            you&rsquo;re looking for kit or availability, we&rsquo;re one message away.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            <a href="/" className="btn">Back to home</a>
            <a href="/#contact" className="btn btn--ghost">Make an enquiry</a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
