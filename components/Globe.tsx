'use client'
import { useEffect, useRef, useState } from 'react'
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Group,
  Color,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
  RingGeometry,
  InstancedMesh,
  Matrix4,
  Vector3,
  BufferGeometry,
  Float32BufferAttribute,
  LineBasicMaterial,
  LineSegments,
  TubeGeometry,
  CatmullRomCurve3,
  type Material,
} from 'three'
import landDots from '@/lib/land-dots.json'

export interface GeoPoint {
  label: string
  lat: number
  lng: number
}

interface GlobeProps {
  /** Home base — drawn white, ringed in red. */
  base: GeoPoint
  /** Destinations — drawn red, each linked to base by a great-circle arc. */
  destinations: GeoPoint[]
  /** Slow idle rotation. Ignored under prefers-reduced-motion. */
  autoRotate?: boolean
  className?: string
}

const R = 1
const LAND_COLOR = '#3a3a3a'
const GRATICULE_COLOR = '#1e1e1e'
const FOV = 34 // long lens — less distortion than a wide default

// The composition contract: arcs bow to at most ARC_CEILING, the degree ring
// sits beyond that. Routes stay framed by the ring instead of escaping it.
const ARC_CEILING = 0.045
const RING_INNER = 1.062
const RING_OUTER = 1.07

/** Unit vector for a lat/lng, +Z facing the camera at lng 0. */
function toVec(lat: number, lng: number, radius = R): Vector3 {
  const p = (lat * Math.PI) / 180
  const t = (lng * Math.PI) / 180
  return new Vector3(
    Math.cos(p) * Math.sin(t) * radius,
    Math.sin(p) * radius,
    Math.cos(p) * Math.cos(t) * radius
  )
}

/**
 * Great-circle arc between two points, bowed just clear of the surface.
 * Lift scales with angular distance, but stays inside ARC_CEILING so no route
 * ever escapes the degree ring — long hauls wrap over the horizon instead,
 * which is what a route actually does on a globe.
 */
function arcPoints(from: Vector3, to: Vector3, segments = 64): Vector3[] {
  const angle = from.angleTo(to)
  const lift = ARC_CEILING * Math.sin(Math.min(angle, Math.PI) / 2)
  const pts: Vector3[] = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    // Spherical interpolation, then push outward along the midpoint bulge.
    const v = new Vector3().copy(from).lerp(to, t).normalize()
    v.multiplyScalar(R * (1 + lift * Math.sin(Math.PI * t)))
    pts.push(v)
  }
  return pts
}

/** Sparse 30° graticule — the instrument grid, not decoration. */
function graticuleGeometry(): BufferGeometry {
  const verts: number[] = []
  const push = (a: Vector3, b: Vector3) => verts.push(a.x, a.y, a.z, b.x, b.y, b.z)
  const r = R * 1.001
  const STEP = 30

  for (let lat = -60; lat <= 60; lat += STEP) {
    for (let lng = -180; lng < 180; lng += 4) {
      push(toVec(lat, lng, r), toVec(lat, lng + 4, r))
    }
  }
  for (let lng = -180; lng < 180; lng += STEP) {
    for (let lat = -90; lat < 90; lat += 4) {
      push(toVec(lat, lng, r), toVec(lat + 4, lng, r))
    }
  }

  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(verts, 3))
  return g
}

export default function Globe({
  base,
  destinations,
  autoRotate = true,
  className,
}: GlobeProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [supported, setSupported] = useState(true)

  // Serialised so a new array literal from the parent can't thrash the scene.
  const dataKey = JSON.stringify({ base, destinations, autoRotate })

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // ---- renderer -------------------------------------------------------
    let renderer: WebGLRenderer
    try {
      renderer = new WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      setSupported(false)
      return
    }

    const css = getComputedStyle(document.documentElement)
    const token = (name: string, fallback: string) =>
      css.getPropertyValue(name).trim() || fallback
    const ACCENT = token('--rec', '#ED2643')
    const OCEAN = token('--background', '#0a0a0a')

    const size = () => ({
      w: host.clientWidth || 800,
      h: host.clientHeight || 600,
    })
    let { w, h } = size()

    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = 'srgb'

    const canvas = renderer.domElement
    canvas.style.cssText =
      'position:absolute;inset:0;width:100%;height:100%;display:block;' +
      // pan-y keeps vertical page scroll working on touch; we take the x-axis.
      'touch-action:pan-y;cursor:grab;opacity:0;' +
      (reduceMotion ? '' : 'transition:opacity .6s cubic-bezier(0.16,1,0.3,1);')
    host.appendChild(canvas)

    const scene = new Scene()
    const camera = new PerspectiveCamera(FOV, w / h, 0.1, 100)

    /** Pull the camera back far enough that the globe always fits, portrait included. */
    const fitCamera = () => {
      const aspect = w / h
      const vFov = (FOV * Math.PI) / 180
      const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect)
      // Fit the ring, not the sphere — it's the outermost thing on screen.
      const dist = (R * RING_OUTER * 1.06) / Math.sin(Math.min(vFov, hFov) / 2)
      camera.position.set(0, 0, dist)
      camera.lookAt(0, 0, 0)
      camera.aspect = aspect
      camera.updateProjectionMatrix()
    }
    fitCamera()

    // Track everything disposable — WebGL leaks otherwise.
    const geometries: BufferGeometry[] = []
    const materials: Material[] = []

    // tilt holds the designed lean; spin carries the rotation.
    const tilt = new Group()
    const spin = new Group()
    tilt.rotation.x = 0.42 // north pole toward the viewer — seats the UK in frame
    tilt.rotation.z = -0.1
    spin.rotation.y = 0.2
    tilt.add(spin)
    scene.add(tilt)

    // ---- ocean ----------------------------------------------------------
    // Matches the page background, so it reads as empty space but still
    // depth-occludes the far hemisphere. That's what makes the dots float.
    const oceanGeo = new SphereGeometry(R, 64, 48)
    const oceanMat = new MeshBasicMaterial({ color: new Color(OCEAN) })
    spin.add(new Mesh(oceanGeo, oceanMat))
    geometries.push(oceanGeo)
    materials.push(oceanMat)

    // ---- graticule ------------------------------------------------------
    const gratGeo = graticuleGeometry()
    const gratMat = new LineBasicMaterial({
      color: new Color(GRATICULE_COLOR),
      transparent: true,
      opacity: 0.9,
    })
    spin.add(new LineSegments(gratGeo, gratMat))
    geometries.push(gratGeo)
    materials.push(gratMat)

    // ---- land -----------------------------------------------------------
    const count = landDots.length / 2
    const dotGeo = new SphereGeometry(0.0072, 5, 4)
    const dotMat = new MeshBasicMaterial({ color: new Color(LAND_COLOR) })
    const land = new InstancedMesh(dotGeo, dotMat, count)
    const m = new Matrix4()
    for (let i = 0; i < count; i++) {
      const v = toVec(landDots[i * 2], landDots[i * 2 + 1], R * 1.004)
      land.setMatrixAt(i, m.identity().setPosition(v))
    }
    land.instanceMatrix.needsUpdate = true
    spin.add(land)
    geometries.push(dotGeo)
    materials.push(dotMat)

    // ---- markers --------------------------------------------------------
    const accent = new Color(ACCENT)

    const destGeo = new SphereGeometry(0.012, 12, 10)
    const destMat = new MeshBasicMaterial({ color: accent })
    geometries.push(destGeo)
    materials.push(destMat)
    for (const d of destinations) {
      const mesh = new Mesh(destGeo, destMat)
      mesh.position.copy(toVec(d.lat, d.lng, R * 1.012))
      spin.add(mesh)
    }

    // Home reads white, ringed in red — same language as the 2D map it replaces.
    const baseVec = toVec(base.lat, base.lng, R * 1.014)
    const baseGeo = new SphereGeometry(0.016, 14, 12)
    const baseMat = new MeshBasicMaterial({ color: new Color('#ffffff') })
    const baseMesh = new Mesh(baseGeo, baseMat)
    baseMesh.position.copy(baseVec)
    spin.add(baseMesh)
    geometries.push(baseGeo)
    materials.push(baseMat)

    const haloGeo = new RingGeometry(0.028, 0.034, 32)
    const haloMat = new MeshBasicMaterial({
      color: accent,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    })
    const halo = new Mesh(haloGeo, haloMat)
    halo.position.copy(baseVec)
    halo.lookAt(baseVec.clone().multiplyScalar(2)) // face outward from the core
    spin.add(halo)
    geometries.push(haloGeo)
    materials.push(haloMat)

    // ---- arcs -----------------------------------------------------------
    // Tubes, not lines: WebGL clamps line width to 1px on most platforms.
    const arcs: Mesh[] = []
    const arcMat = new MeshBasicMaterial({
      color: accent,
      transparent: true,
      opacity: 0.75,
    })
    materials.push(arcMat)
    for (const d of destinations) {
      const curve = new CatmullRomCurve3(
        arcPoints(toVec(base.lat, base.lng), toVec(d.lat, d.lng))
      )
      const geo = new TubeGeometry(curve, 64, 0.0032, 6, false)
      const mesh = new Mesh(geo, arcMat)
      mesh.renderOrder = 1
      // Drawn progressively along the tube; index order runs with the curve.
      if (!reduceMotion) geo.setDrawRange(0, 0)
      spin.add(mesh)
      arcs.push(mesh)
      geometries.push(geo)
    }

    // ---- the degree ring ------------------------------------------------
    // Circumscribes the silhouette. Lives in scene space, not the spin group,
    // so it stays a true circle: the globe becomes the brand's ° mark.
    const ringGeo = new RingGeometry(R * RING_INNER, R * RING_OUTER, 192)
    const ringMat = new MeshBasicMaterial({
      color: accent,
      transparent: true,
      opacity: 0.9,
    })
    const ring = new Mesh(ringGeo, ringMat)
    scene.add(ring)
    geometries.push(ringGeo)
    materials.push(ringMat)

    // ---- interaction ----------------------------------------------------
    let dragging = false
    let px = 0
    let py = 0
    let vx = 0
    let vy = 0
    let idle = 0

    const onDown = (e: PointerEvent) => {
      dragging = true
      px = e.clientX
      py = e.clientY
      vx = 0
      vy = 0
      canvas.style.cursor = 'grabbing'
      canvas.setPointerCapture(e.pointerId)
      start()
    }
    const onMove = (e: PointerEvent) => {
      if (!dragging) return
      const dx = e.clientX - px
      const dy = e.clientY - py
      px = e.clientX
      py = e.clientY
      spin.rotation.y += dx * 0.005
      tilt.rotation.x = Math.max(-1.1, Math.min(1.1, tilt.rotation.x + dy * 0.005))
      vx = dx * 0.005
      vy = dy * 0.005
      idle = 0
    }
    const onUp = (e: PointerEvent) => {
      dragging = false
      canvas.style.cursor = 'grab'
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId)
    }
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)

    // ---- loop -----------------------------------------------------------
    let raf: number | null = null
    let visible = true
    let drawn = 0 // 0 → 1, drives the arc reveal
    const spinning = autoRotate && !reduceMotion

    const frame = () => {
      if (!dragging) {
        // Inertia, then hand back to the idle rotation.
        if (Math.abs(vx) > 1e-4 || Math.abs(vy) > 1e-4) {
          spin.rotation.y += vx
          tilt.rotation.x = Math.max(-1.1, Math.min(1.1, tilt.rotation.x + vy))
          vx *= 0.94
          vy *= 0.94
        } else if (spinning) {
          idle = Math.min(1, idle + 0.01)
          spin.rotation.y += 0.0012 * idle
        }
      }

      const drawing = !reduceMotion && drawn < 1
      if (drawing) {
        drawn = Math.min(1, drawn + 0.012)
        const eased = 1 - Math.pow(1 - drawn, 3)
        arcs.forEach((a, i) => {
          const total = a.geometry.index?.count ?? 0
          // Stagger: each arc starts a beat after the last.
          const t = Math.max(0, Math.min(1, eased * 1.6 - i * 0.075))
          a.geometry.setDrawRange(0, Math.floor(total * t))
        })
      }

      renderer.render(scene, camera)

      // Park the loop once nothing is moving — a static globe shouldn't
      // hold a rAF open. Any interaction calls start() again.
      const moving =
        dragging || spinning || drawing || Math.abs(vx) > 1e-4 || Math.abs(vy) > 1e-4
      raf = moving ? requestAnimationFrame(frame) : null
    }
    const start = () => {
      if (raf === null && visible) raf = requestAnimationFrame(frame)
    }
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf)
      raf = null
    }

    // ---- lifecycle ------------------------------------------------------
    const onResize = () => {
      const next = size()
      w = next.w
      h = next.h
      renderer.setSize(w, h)
      fitCamera()
      renderer.render(scene, camera)
    }

    const ro =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null
    ro?.observe(host)
    window.addEventListener('resize', onResize)

    // Don't burn frames on a globe nobody can see.
    const io =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            ([e]) => {
              visible = e.isIntersecting
              if (visible) start()
              else stop()
            },
            { threshold: 0 }
          )
        : null
    io?.observe(host)

    const onVisibility = () => {
      if (document.hidden) stop()
      else if (visible) start()
    }
    document.addEventListener('visibilitychange', onVisibility)

    // First paint, then fade the canvas up.
    renderer.render(scene, camera)
    canvas.style.opacity = '1'
    if (reduceMotion) {
      // Arcs are already at full draw range; one static frame is enough.
      renderer.render(scene, camera)
    } else {
      start()
    }

    return () => {
      stop()
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
      ro?.disconnect()
      io?.disconnect()
      geometries.forEach((g) => g.dispose())
      materials.forEach((mm) => mm.dispose())
      renderer.dispose()
      canvas.remove()
    }
  }, [dataKey, base, destinations, autoRotate])

  // No WebGL: the section still has its heading, copy and location list,
  // so we simply stand down rather than shipping an error box.
  if (!supported) return null

  return (
    <div
      ref={hostRef}
      className={className}
      role="img"
      aria-label={`Globe showing ${base.label} and ${destinations.length} international production locations: ${destinations
        .map((d) => d.label)
        .join(', ')}.`}
      style={{ position: 'relative', width: '100%', height: '100%' }}
    />
  )
}
