'use client'

export default function Hero() {
  const logoAspect = 2000 / 538 // matches wordmark-letters-mask.png / wordmark-circle.png

  return (
    <section
      style={{
        position: 'relative',
        height: '100svh',
        minHeight: '600px',
        width: '100%',
        overflow: 'hidden',
        background: '#000000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Signature scan line — sweeps once on load */}
      <div
        className="scanline"
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: '1px',
          background: '#ED2643',
          zIndex: 10,
          boxShadow: '0 0 8px rgba(237,38,67,0.6)',
        }}
      />

      {/* Solid white wordmark */}
      <h1
        aria-label="Latitude Equipment"
        style={{
          position: 'relative',
          width: 'min(92vw, 1350px)',
          aspectRatio: `${logoAspect}`,
          margin: 0,
        }}
      >
        {/* Letterforms filled solid opaque white */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: '#ffffff',
            maskImage: 'url(/logo/wordmark-letters-mask.png)',
            maskSize: '100% 100%',
            maskRepeat: 'no-repeat',
            WebkitMaskImage: 'url(/logo/wordmark-letters-mask.png)',
            WebkitMaskSize: '100% 100%',
            WebkitMaskRepeat: 'no-repeat',
          }}
        />

        {/* Red circle stays solid red on top */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo/wordmark-circle.png"
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
          draggable={false}
        />
      </h1>

      <p
        style={{
          fontSize: '0.6rem',
          fontWeight: 500,
          letterSpacing: '0.32em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.62)',
          margin: '3rem 0 0',
          textAlign: 'center',
          padding: '0 2rem',
        }}
      >
        Specialist Camera Equipment&nbsp;&nbsp;/&nbsp;&nbsp;Television &amp; Film
      </p>

      {/* Scroll indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: '2.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 5,
        }}
        aria-hidden="true"
      >
        <div
          style={{
            width: '1px',
            height: '40px',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.35), transparent)',
          }}
        />
      </div>
    </section>
  )
}
