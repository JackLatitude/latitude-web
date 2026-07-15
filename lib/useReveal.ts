'use client'
import { useEffect, useRef, useState } from 'react'

/**
 * Adds `.in` to the element once it scrolls into view (once only).
 * Pair with the `.stagger` / `.gallery-grid` CSS to cascade children.
 */
export function useReveal<T extends HTMLElement = HTMLElement>(threshold = 0.15) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold, rootMargin: '0px 0px -8% 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, inView }
}
