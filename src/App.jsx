import React, { useEffect, useRef, useState, useCallback } from 'react'

const TEXT = 'Happy Birthday **'

/* ------------------------------------------------------------------ */
/*  Utility: seeded-ish random helpers                                 */
/* ------------------------------------------------------------------ */
const rand = (a, b) => a + Math.random() * (b - a)
const lerp = (a, b, t) => a + (b - a) * t
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)
const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2

/* ------------------------------------------------------------------ */
/*  Starfield + shooting stars — ambient background layer              */
/* ------------------------------------------------------------------ */
function Starfield({ mouseRef }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let raf
    let stars = []
    let shootingStars = []
    let w = 0
    let h = 0
    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    function resize() {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const count = Math.round((w * h) / 6500)
      stars = new Array(count).fill(0).map(() => ({
        x: rand(0, w),
        y: rand(0, h),
        r: rand(0.4, 1.6),
        baseAlpha: rand(0.25, 1),
        phase: rand(0, Math.PI * 2),
        speed: rand(0.5, 1.6),
        parallax: rand(0.01, 0.05),
      }))
    }

    function spawnShootingStar() {
      const startX = rand(w * 0.1, w * 0.9)
      const startY = rand(0, h * 0.35)
      const angle = rand(Math.PI * 0.15, Math.PI * 0.3)
      const speed = rand(9, 15)
      shootingStars.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: rand(40, 70),
        len: rand(90, 160),
      })
    }

    let shootTimer = 0
    let nextShoot = rand(2000, 5000)
    let last = performance.now()

    function frame(now) {
      const dt = Math.min(now - last, 48)
      last = now
      shootTimer += dt

      if (!reduced && shootTimer > nextShoot) {
        spawnShootingStar()
        shootTimer = 0
        nextShoot = rand(2500, 6000)
      }

      ctx.clearRect(0, 0, w, h)

      const mx = mouseRef.current.x
      const my = mouseRef.current.y
      const offX = (mx - 0.5) * 18
      const offY = (my - 0.5) * 18

      for (const s of stars) {
        const tw = reduced ? 1 : 0.55 + 0.45 * Math.sin(now * 0.001 * s.speed + s.phase)
        ctx.globalAlpha = s.baseAlpha * tw
        ctx.fillStyle = '#eaf2ff'
        ctx.beginPath()
        ctx.arc(s.x + offX * s.parallax * 10, s.y + offY * s.parallax * 10, s.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      shootingStars = shootingStars.filter((s) => s.life < s.maxLife)
      for (const s of shootingStars) {
        s.life += dt / 16.6
        s.x += s.vx
        s.y += s.vy
        const p = s.life / s.maxLife
        const alpha = Math.sin(p * Math.PI)
        const tailX = s.x - (s.vx / Math.hypot(s.vx, s.vy)) * s.len
        const tailY = s.y - (s.vy / Math.hypot(s.vx, s.vy)) * s.len
        const grad = ctx.createLinearGradient(s.x, s.y, tailX, tailY)
        grad.addColorStop(0, `rgba(255,255,255,${alpha})`)
        grad.addColorStop(0.4, `rgba(180,210,255,${alpha * 0.5})`)
        grad.addColorStop(1, 'rgba(180,210,255,0)')
        ctx.strokeStyle = grad
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(s.x, s.y)
        ctx.lineTo(tailX, tailY)
        ctx.stroke()

        ctx.fillStyle = `rgba(255,255,255,${alpha})`
        ctx.beginPath()
        ctx.arc(s.x, s.y, 1.6, 0, Math.PI * 2)
        ctx.fill()
      }

      raf = requestAnimationFrame(frame)
    }

    resize()
    window.addEventListener('resize', resize)
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [mouseRef])

  return <canvas ref={canvasRef} className="layer starfield-canvas" aria-hidden="true" />
}

/* ------------------------------------------------------------------ */
/*  Particle text assembly — the cinematic reveal                      */
/* ------------------------------------------------------------------ */
function ParticleReveal({ onComplete }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let raf
    let w = window.innerWidth
    let h = window.innerHeight
    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = w + 'px'
    canvas.style.height = h + 'px'
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    if (reduced) {
      onComplete()
      return
    }

    // Sample the text into target points using an offscreen buffer
    const off = document.createElement('canvas')
    off.width = w
    off.height = h
    const offCtx = off.getContext('2d')

    let fontSize = Math.min(w * 0.11, h * 0.22)
    offCtx.textAlign = 'center'
    offCtx.textBaseline = 'middle'
    offCtx.font = `900 ${fontSize}px Outfit, sans-serif`
    let metrics = offCtx.measureText(TEXT)
    const maxWidth = w * 0.86
    while (metrics.width > maxWidth && fontSize > 8) {
      fontSize -= 2
      offCtx.font = `900 ${fontSize}px Outfit, sans-serif`
      metrics = offCtx.measureText(TEXT)
    }
    offCtx.fillStyle = '#fff'
    offCtx.fillText(TEXT, w / 2, h / 2)

    const imgData = offCtx.getImageData(0, 0, w, h).data
    const targetPoints = []
    const desiredCount = Math.min(4200, Math.max(1400, Math.round((w * h) / 900)))
    const step = Math.max(2, Math.round(Math.sqrt((w * h) / desiredCount)))
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const idx = (y * w + x) * 4 + 3
        if (imgData[idx] > 120) {
          targetPoints.push({ x, y })
        }
      }
    }

    const palette = ['#8ad9ff', '#a58bff', '#ffe3a3', '#ffffff', '#7cf2d0']

    const particles = targetPoints.map((pt) => {
      const edge = Math.floor(rand(0, 4))
      let sx, sy
      if (edge === 0) { sx = rand(0, w); sy = -30 }
      else if (edge === 1) { sx = w + 30; sy = rand(0, h) }
      else if (edge === 2) { sx = rand(0, w); sy = h + 30 }
      else { sx = -30; sy = rand(0, h) }

      return {
        x: sx,
        y: sy,
        tx: pt.x,
        ty: pt.y,
        seed: rand(0, Math.PI * 2),
        wobble: rand(6, 22),
        delay: rand(0, 0.35),
        dur: rand(0.55, 1),
        color: palette[Math.floor(rand(0, palette.length))],
        size: rand(1.1, 2.6),
      }
    })

    let start = null
    const totalDuration = 2600 // ms for assembly
    let done = false

    function frame(now) {
      if (start === null) start = now
      const elapsed = now - start
      const globalT = Math.min(elapsed / totalDuration, 1)

      ctx.clearRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'lighter'

      for (const p of particles) {
        let localT = (globalT - p.delay) / p.dur
        localT = Math.min(Math.max(localT, 0), 1)
        const eased = easeOutCubic(localT)
        const wob = (1 - eased) * p.wobble
        const cx = lerp(p.x, p.tx, eased) + Math.sin(now * 0.006 + p.seed) * wob
        const cy = lerp(p.y, p.ty, eased) + Math.cos(now * 0.006 + p.seed) * wob
        const alpha = 0.35 + 0.65 * eased

        ctx.beginPath()
        ctx.fillStyle = p.color
        ctx.globalAlpha = alpha
        ctx.arc(cx, cy, p.size, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'

      if (globalT >= 1 && !done) {
        done = true
        setTimeout(onComplete, 260)
      }
      if (!done || globalT < 1.15) {
        raf = requestAnimationFrame(frame)
      }
    }

    raf = requestAnimationFrame(frame)

    function handleResize() {
      // On resize we simply let the final CSS text take over; avoid re-sampling mid-animation
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', handleResize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <canvas ref={canvasRef} className="layer particle-canvas" aria-hidden="true" />
}

/* ------------------------------------------------------------------ */
/*  Main App                                                           */
/* ------------------------------------------------------------------ */
export default function App() {
  const [revealed, setRevealed] = useState(false)
  const [particlesDone, setParticlesDone] = useState(false)
  const mouseRef = useRef({ x: 0.5, y: 0.5 })
  const rootRef = useRef(null)

  const handleComplete = useCallback(() => {
    setRevealed(true)
    setTimeout(() => setParticlesDone(true), 900)
  }, [])

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setRevealed(true)
      setParticlesDone(true)
    }
  }, [])

  useEffect(() => {
    let raf = null
    let pending = null

    function onMove(e) {
      const x = e.touches ? e.touches[0].clientX : e.clientX
      const y = e.touches ? e.touches[0].clientY : e.clientY
      pending = { x: x / window.innerWidth, y: y / window.innerHeight }
      if (raf === null) {
        raf = requestAnimationFrame(() => {
          mouseRef.current = pending
          if (rootRef.current) {
            rootRef.current.style.setProperty('--mx', `${pending.x * 100}%`)
            rootRef.current.style.setProperty('--my', `${pending.y * 100}%`)
          }
          raf = null
        })
      }
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('touchmove', onMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchmove', onMove)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="scene" ref={rootRef}>
      <div className="layer aurora">
        <div className="aurora-blob a1" />
        <div className="aurora-blob a2" />
        <div className="aurora-blob a3" />
      </div>

      <Starfield mouseRef={mouseRef} />

      <div className="layer mouse-light" aria-hidden="true" />

      {!particlesDone && <ParticleReveal onComplete={handleComplete} />}

      <div className="text-stage">
        <h1
          className={
            'glass-text' + (revealed ? ' is-visible' : '') + (particlesDone ? ' is-settled' : '')
          }
        >
          <span className="glass-text__fill">{TEXT}</span>
          <span className="glass-text__shine" aria-hidden="true">{TEXT}</span>
        </h1>
      </div>

      <div className="vignette" aria-hidden="true" />
    </div>
  )
}
