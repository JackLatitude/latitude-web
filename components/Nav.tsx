'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'

// `solid` is for pages without the full-bleed hero (privacy, 404): there is no
// giant wordmark to hand off from, so the bar and logo show from the start.
export default function Nav({ solid = false }: { solid?: boolean }) {
  const [scrolled, setScrolled] = useState(solid)
  const [pastHero, setPastHero] = useState(solid)

  useEffect(() => {
    if (solid) return
    const onScroll = () => {
      setScrolled(window.scrollY > 60)
      setPastHero(window.scrollY > window.innerHeight * 0.75)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [solid])

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: scrolled
          ? 'rgba(10,10,10,0.95)'
          : 'transparent',
        backdropFilter: scrolled ? 'blur(8px)' : 'none',
        borderBottom: scrolled ? '1px solid #2a2a2a' : '1px solid transparent',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 clamp(1rem, 4vw, 2rem)',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <a
          href="/"
          aria-label="Latitude Equipment home"
          style={{
            opacity: pastHero ? 1 : 0,
            pointerEvents: pastHero ? 'auto' : 'none',
            transition: 'opacity 0.4s ease',
          }}
        >
          <Image
            src="/logo/wordmark-white.png"
            alt="Latitude Equipment"
            width={160}
            height={36}
            style={{ height: '28px', width: 'auto' }}
            priority
          />
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(1.25rem, 4vw, 2.5rem)' }}>
          <a
            href="/#gallery"
            style={{
              fontSize: '0.65rem',
              fontWeight: 500,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.5)',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
          >
            Gallery
          </a>
          {/* The one action the site exists for. The bar is fixed, so this is
              also the sticky CTA on mobile — reachable from every scroll depth. */}
          <a href="/#contact" className="btn btn--sm">
            Enquire
          </a>
        </div>
      </div>
    </nav>
  )
}
