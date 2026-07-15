'use client'
import Globe, { type GeoPoint } from './Globe'
import { useReveal } from '@/lib/useReveal'

// Base of operations
const UK: GeoPoint = { label: 'United Kingdom', lat: 51.5, lng: -0.1 }

// Destinations — edit freely; label + coordinates (city-level)
const destinations: GeoPoint[] = [
  { label: 'Sydney, Australia', lat: -33.87, lng: 151.21 },
  { label: 'Tashkent, Uzbekistan', lat: 41.31, lng: 69.24 },
  { label: 'Ushuaia, Argentina', lat: -54.8, lng: -68.3 },
  { label: 'Masaya, Nicaragua', lat: 11.97, lng: -86.09 },
  { label: 'Cape Town, South Africa', lat: -33.92, lng: 18.42 },
  { label: 'Lofoten, Norway', lat: 68.15, lng: 13.61 },
  { label: 'Vancouver, Canada', lat: 49.28, lng: -123.12 },
  { label: 'Tokyo, Japan', lat: 35.68, lng: 139.69 },
]

/** 51.5 → 51.50° N — the company's own unit, used as the company's own unit. */
function coord(value: number, axis: 'lat' | 'lng') {
  const hemi = axis === 'lat' ? (value >= 0 ? 'N' : 'S') : value >= 0 ? 'E' : 'W'
  return `${Math.abs(value).toFixed(2)}° ${hemi}`
}

export default function WorldMap() {
  const { ref, inView } = useReveal(0.15)

  return (
    <section className="section" ref={ref as React.RefObject<HTMLElement>}>
      <div className="section__inner">
        <div className="reach">
          <div className="reach__copy">
            <span className="sigil" aria-hidden="true" />
            <h2
              className={`statement reveal-head${inView ? ' in' : ''}`}
              style={{ marginBottom: '1.5rem', maxWidth: '16ch' }}
            >
              Based in the UK. <em>Working worldwide.</em>
            </h2>
            <p className="lede" style={{ marginBottom: '2.5rem' }}>
              Our kit and operators travel with the production — carnets, permits and
              logistics handled.
            </p>

            <ul className={`reach__index${inView ? ' in' : ''}`}>
              <li className="reach__row reach__row--base">
                <span className="reach__pin" aria-hidden="true" />
                <span className="reach__label">{UK.label}</span>
                <span className="reach__coord">
                  {coord(UK.lat, 'lat')} · {coord(UK.lng, 'lng')}
                </span>
              </li>
              {destinations.map((d) => (
                <li className="reach__row" key={d.label}>
                  <span className="reach__pin" aria-hidden="true" />
                  <span className="reach__label">{d.label}</span>
                  <span className="reach__coord">
                    {coord(d.lat, 'lat')} · {coord(d.lng, 'lng')}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className={`reach__globe${inView ? ' in' : ''}`}>
            <Globe base={UK} destinations={destinations} />
          </div>
        </div>
      </div>

      <style>{`
        .reach {
          display: grid;
          grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
          gap: clamp(2rem, 5vw, 5rem);
          align-items: center;
        }
        .reach__copy { min-width: 0; }

        /* The index reads as an instrument list, not a nav menu. */
        .reach__index {
          list-style: none;
          margin: 0;
          padding: 0;
          border-top: 1px solid var(--grey-rule);
        }
        .reach__row {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 0.75rem;
          padding: 0.7rem 0;
          border-bottom: 1px solid var(--grey-rule);
        }
        .reach__pin {
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--rec);
        }
        .reach__row--base .reach__pin {
          background: #fff;
          box-shadow: 0 0 0 3px var(--rec-dim);
        }
        .reach__label {
          font-size: 0.85rem;
          font-weight: 400;
          color: var(--foreground);
        }
        .reach__row--base .reach__label { font-weight: 500; }
        .reach__coord {
          font-family: var(--font-mono, ui-monospace, 'SF Mono', Menlo, monospace);
          font-size: 0.68rem;
          letter-spacing: 0.02em;
          color: var(--text-tertiary);
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
        }

        .reach__globe {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 1;
          max-height: 620px;
        }

        /* Reveal — JS-gated so no-JS and crawlers still get the full section. */
        .js .reach__index,
        .js .reach__globe {
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 0.9s var(--ease-expo), transform 0.9s var(--ease-expo);
        }
        .js .reach__globe { transition-delay: 0.1s; }
        .reach__index.in,
        .reach__globe.in { opacity: 1; transform: none; }

        @media (max-width: 900px) {
          .reach {
            grid-template-columns: 1fr;
            gap: 2.5rem;
          }
          /* Globe leads on narrow screens; the index reads better beneath it. */
          .reach__globe { order: -1; max-height: 420px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .js .reach__index,
          .js .reach__globe {
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </section>
  )
}
