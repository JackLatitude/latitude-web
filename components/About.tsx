'use client'
import { useReveal } from '@/lib/useReveal'

const services = [
  'Drone Operations',
  'Vehicle Tracking Rigs',
  'Stabilised Camera Systems',
  'Camera Operation',
]

export default function About() {
  const { ref, inView } = useReveal()

  return (
    <section id="about" className="section" ref={ref as React.RefObject<HTMLElement>}>
      <div className={`section__inner about-grid stagger${inView ? ' in' : ''}`}>
        {/* Left rail: services */}
        <div className="about-rail">
          <ul className="about-services">
            {services.map(s => (
              <li key={s}>
                <span className="about-tick" />
                {s}
              </li>
            ))}
          </ul>
        </div>

        {/* Right: statement + supporting copy */}
        <div className="about-body">
          <span className="sigil" aria-hidden="true" />
          <h2 className="statement">
            Specialist camera systems for <em>television &amp; film</em>.
          </h2>
          <p className="lede">
            Latitude Equipment supplies drone operations, vehicle tracking rigs and
            stabilised gimbal systems to productions across the UK and internationally —
            from factual series and entertainment formats to branded and commercial work.
          </p>
          <p className="lede about-note">
            Latitude is what a sensor can hold: every stop of light between shadow and
            highlight. It&rsquo;s also a line on a map. We work across both.
          </p>
        </div>
      </div>

      <style>{`
        .about-grid {
          display: grid;
          grid-template-columns: minmax(180px, 260px) 1fr;
          gap: clamp(2.5rem, 6vw, 6rem);
          align-items: start;
        }
        .about-services {
          list-style: none; padding: 0; margin: 0;
          display: flex; flex-direction: column; gap: 0.85rem;
        }
        .about-services li {
          display: flex; align-items: center; gap: 0.7rem;
          font-size: 0.8rem; font-weight: 400; letter-spacing: 0.03em;
          color: var(--text-secondary);
        }
        .about-tick {
          width: 5px; height: 5px; flex-shrink: 0;
          background: var(--rec);
        }
        .about-body { display: flex; flex-direction: column; gap: 2rem; }
        .about-body .statement { margin-bottom: 0.5rem; max-width: 18ch; }
        .about-note { color: #8f8f8f; }
        @media (max-width: 760px) {
          .about-grid { grid-template-columns: 1fr; gap: 2.5rem; }
        }
      `}</style>
    </section>
  )
}
