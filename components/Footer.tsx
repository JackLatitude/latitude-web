import Image from 'next/image'

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid #2a2a2a',
        padding: '2rem',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <Image
          src="/logo/wordmark-white.png"
          alt="Latitude Equipment"
          width={120}
          height={28}
          style={{ height: '22px', width: 'auto', opacity: 0.4 }}
        />
        <p
          style={{
            fontSize: '0.65rem',
            color: '#444',
            margin: 0,
            letterSpacing: '0.06em',
          }}
        >
          © {new Date().getFullYear()} Latitude Equipment Ltd
        </p>
      </div>
    </footer>
  )
}
