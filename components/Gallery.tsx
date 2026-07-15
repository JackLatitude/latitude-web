'use client'
import { useEffect, useState } from 'react'
import { RowsPhotoAlbum, type Photo } from 'react-photo-album'
import 'react-photo-album/rows.css'
import Lightbox from 'yet-another-react-lightbox'
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen'
import Counter from 'yet-another-react-lightbox/plugins/counter'
import 'yet-another-react-lightbox/styles.css'
import 'yet-another-react-lightbox/plugins/thumbnails.css'
import 'yet-another-react-lightbox/plugins/counter.css'
import { useReveal } from '@/lib/useReveal'
import manifest from '@/lib/gallery-manifest.json'

// Resolved at build time (see scripts/gallery-manifest.mjs). Baked in rather
// than fetched: the old /api/gallery readdir doesn't survive Vercel's
// serverless filesystem, and this renders on first paint with no round-trip.
const photos = manifest as Photo[]

// The archive is large; showing all of it reads as a wall. Instead surface a
// small, calm grid and rotate which frames appear — fresh on each visit, and
// re-drawable via Shuffle — so the whole set is reachable without the clutter.
const SHOWN = 9

function pickRandom(pool: Photo[], n: number): Photo[] {
  const a = [...pool]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a.slice(0, Math.min(n, a.length))
}

export default function Gallery() {
  const { ref, inView } = useReveal(0.06)
  const [index, setIndex] = useState(-1)
  // Deterministic first render so SSR and hydration agree; the client swaps in
  // a random draw on mount (invisible — the section is below the fold and fades
  // in on scroll). Each page load therefore gets a different selection.
  const [shown, setShown] = useState<Photo[]>(() => photos.slice(0, SHOWN))
  useEffect(() => setShown(pickRandom(photos, SHOWN)), [])

  const shuffle = () => {
    setIndex(-1)
    setShown(pickRandom(photos, SHOWN))
  }

  return (
    <section id="gallery" className="section" ref={ref as React.RefObject<HTMLElement>}>
      <div className="section__inner">
        <div className="gallery-head">
          <div>
            <span className="sigil" aria-hidden="true" />
            <h2 className={`statement reveal-head${inView ? ' in' : ''}`}>
              In the <em>field</em>.
            </h2>
          </div>
          {photos.length > SHOWN && (
            <button type="button" className="gallery-shuffle" onClick={shuffle}>
              <span className="gallery-shuffle__count">
                {SHOWN} of {photos.length}
              </span>
              <span className="gallery-shuffle__action" aria-hidden="true" />
              <span className="gallery-shuffle__label">Shuffle</span>
            </button>
          )}
        </div>

        <div className={`gallery-rpa${inView ? ' in' : ''}`}>
          <RowsPhotoAlbum
            photos={shown}
            targetRowHeight={280}
            spacing={6}
            defaultContainerWidth={1200}
            onClick={({ index }) => setIndex(index)}
            render={{
              extras: () => <span className="gallery-tile__overlay" aria-hidden="true" />,
            }}
            componentsProps={{
              image: { alt: 'Latitude Equipment on location', loading: 'lazy' },
            }}
          />
        </div>
      </div>

      <Lightbox
        open={index >= 0}
        close={() => setIndex(-1)}
        index={index}
        slides={shown.map(p => ({ src: p.src, width: p.width, height: p.height }))}
        plugins={[Thumbnails, Zoom, Fullscreen, Counter]}
        counter={{ container: { style: { top: 'unset', bottom: 0 } } }}
        thumbnails={{ width: 96, height: 60, border: 0, gap: 6, padding: 0 }}
        zoom={{ maxZoomPixelRatio: 3 }}
        carousel={{ finite: false, padding: '5%' }}
        styles={{
          container: { backgroundColor: 'rgba(0,0,0,0.96)' },
          thumbnailsContainer: { backgroundColor: 'rgba(0,0,0,0.96)' },
        }}
        animation={{ fade: 320, swipe: 400 }}
      />

      <style>{`
        .gallery-head {
          display: flex; align-items: flex-end; justify-content: space-between;
          flex-wrap: wrap; gap: 1rem; margin-bottom: 2.5rem;
        }
        .gallery-shuffle {
          display: inline-flex; align-items: center; gap: 0.6rem;
          background: none; border: none; padding: 0.35rem 0; margin: 0;
          cursor: pointer; font: inherit; color: var(--text-tertiary);
          font-size: 0.6rem; font-weight: 500; letter-spacing: 0.2em;
          text-transform: uppercase; font-variant-numeric: tabular-nums;
          transition: color 0.2s ease;
        }
        .gallery-shuffle__action {
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--text-tertiary);
          transition: background 0.2s ease, transform 0.4s var(--ease-expo);
        }
        .gallery-shuffle__label { color: var(--text-secondary); transition: color 0.2s ease; }
        .gallery-shuffle:hover { color: var(--text-secondary); }
        .gallery-shuffle:hover .gallery-shuffle__label { color: #fff; }
        .gallery-shuffle:hover .gallery-shuffle__action {
          background: #ED2643; transform: rotate(90deg);
        }
        .gallery-shuffle:focus-visible {
          outline: 2px solid #ED2643; outline-offset: 3px; border-radius: 2px;
        }
        /* Reveal: fade the album up once in view.
           Hidden state is JS-gated so no-JS/crawlers/OG renders show it. */
        .js .gallery-rpa {
          opacity: 0; transform: translateY(14px);
          transition: opacity 0.7s var(--ease-expo), transform 0.7s var(--ease-expo);
        }
        .gallery-rpa.in { opacity: 1; transform: none; }
        /* Each tile: clip the zoom, layer the red hover frame */
        .gallery-rpa button {
          overflow: hidden; cursor: pointer; background: none;
          border: none; padding: 0; position: relative;
        }
        .gallery-rpa img {
          display: block; transition: transform 0.5s var(--ease-expo);
        }
        .gallery-tile__overlay {
          position: absolute; inset: 0; z-index: 1;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0);
          transition: box-shadow 0.3s ease; pointer-events: none;
        }
        .gallery-rpa button:hover img { transform: scale(1.04); }
        .gallery-rpa button:hover .gallery-tile__overlay {
          box-shadow: inset 0 0 0 1px rgba(237,38,67,0.9);
        }
        .gallery-rpa button:focus-visible {
          outline: 2px solid var(--accent, #ED2643); outline-offset: 2px;
        }
        /* Lightbox chrome tuned to brand */
        .yarl__thumbnails_thumbnail { border-radius: 0; background: #111; }
        .yarl__thumbnails_thumbnail_active { border: 1px solid #ED2643; }
        .yarl__counter { color: var(--text-secondary, #a3a3a3); font-variant-numeric: tabular-nums; }
        @media (prefers-reduced-motion: reduce) {
          .gallery-rpa {
            opacity: 1 !important; transform: none !important; transition: none !important;
          }
          .gallery-rpa img { transition: none !important; }
          .gallery-shuffle__action { transition: background 0.2s ease !important; }
          .gallery-shuffle:hover .gallery-shuffle__action { transform: none !important; }
        }
      `}</style>
    </section>
  )
}
