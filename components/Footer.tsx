import Image from 'next/image'

// The Companies Act requires a limited company's site to show its registered
// name, number, place of registration and registered office. The registered
// office is the formal address on file at Companies House, not a trading or
// kit address — keep it labelled as such.
const linkStyle = {
  color: 'inherit',
  textDecoration: 'underline',
  textUnderlineOffset: '2px',
}

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid #2a2a2a',
        padding: '2.5rem clamp(1rem, 4vw, 2rem)',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '1.5rem 2rem',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Image
            src="/logo/wordmark-white.png"
            alt="Latitude Equipment"
            width={120}
            height={28}
            style={{ height: '22px', width: 'auto', opacity: 0.4 }}
          />
          <nav aria-label="Footer" style={{ display: 'flex', gap: '1.25rem', fontSize: '0.7rem', color: '#8a8a8a' }}>
            <a href="mailto:info@latitudeequipment.co.uk" style={linkStyle}>info@latitudeequipment.co.uk</a>
            <a href="/privacy" style={linkStyle}>Privacy</a>
          </nav>
        </div>
        <p
          style={{
            fontSize: '0.65rem',
            lineHeight: 1.7,
            color: '#6b6b6b',
            margin: 0,
            letterSpacing: '0.04em',
            maxWidth: '44ch',
          }}
        >
          © {new Date().getFullYear()} Latitude Equipment Ltd. Registered in England
          &amp; Wales, company no.&nbsp;14466173. Registered office: 195–197 Whiteladies
          Road, Bristol, BS8&nbsp;2SB.
        </p>
      </div>
    </footer>
  )
}
