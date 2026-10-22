import { useCallback, useEffect, useRef } from 'react'
import { usePlayhead } from '@/audio/useEngine'
import { ACCENT_VELOCITY, isBlack, noteName, overlapsOf } from '@/lib/music'
import type { ParsedMidi, Pattern } from '@/lib/types'

const GUTTER = 44
const CHORD_LANE = 40
const PAD_TOP = 10

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function withAlpha(color: string, alpha: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(color)
  if (!m) return color
  const v = parseInt(m[1], 16)
  return `rgba(${(v >> 16) & 255}, ${(v >> 8) & 255}, ${v & 255}, ${alpha})`
}

interface Geometry {
  w: number
  h: number
  lo: number
  hi: number
  rowH: number
  x: (tick: number) => number
  y: (midi: number) => number
}

function geometry(w: number, h: number, p: Pattern, loopTicks: number): Geometry {
  let lo = p.minPitch - 2
  let hi = p.maxPitch + 2
  while (hi - lo < 15) {
    lo--
    hi++
  }
  const rows = hi - lo + 1
  const rowH = (h - CHORD_LANE - PAD_TOP) / rows
  return {
    w,
    h,
    lo,
    hi,
    rowH,
    x: (t) => GUTTER + (t / loopTicks) * (w - GUTTER - 8),
    y: (m) => PAD_TOP + (hi - m) * rowH,
  }
}

export function PianoRoll({ pattern, midi, height = 300 }: { pattern: Pattern; midi?: ParsedMidi; height?: number }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const baseRef = useRef<HTMLCanvasElement>(null)
  const overRef = useRef<HTMLCanvasElement>(null)
  const geoRef = useRef<Geometry | null>(null)

  const draw = useCallback(() => {
    const wrap = wrapRef.current
    const canvas = baseRef.current
    const over = overRef.current
    if (!wrap || !canvas || !over) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = wrap.clientWidth
    const h = height
    for (const c of [canvas, over]) {
      c.width = Math.round(w * dpr)
      c.height = Math.round(h * dpr)
      c.style.width = `${w}px`
      c.style.height = `${h}px`
    }
    const ctx = canvas.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    const loopTicks = midi?.endOfTrackTicks || pattern.loopTicks
    const ppq = midi?.ppq || 480
    const g = geometry(w, h, pattern, loopTicks)
    geoRef.current = g

    const fg = cssVar('--foreground')
    const muted = cssVar('--muted')
    const mutedFg = cssVar('--muted-foreground')
    const border = cssVar('--border')
    const groupColor = cssVar(`--g-${pattern.groupSlug}`)
    const accent = cssVar('--brand-a')
    const legatoColor = cssVar('--brand-b')
    const danger = cssVar('--destructive')
    const primary = cssVar('--primary')

    for (let m = g.lo; m <= g.hi; m++) {
      const y = g.y(m)
      if (isBlack(m)) {
        ctx.fillStyle = withAlpha(muted, 0.55)
        ctx.fillRect(GUTTER, y, w - GUTTER, g.rowH)
      }
      const pc = m % 12
      if (pc === 0 || m === pattern.minPitch || m === pattern.maxPitch) {
        ctx.fillStyle = m === pattern.minPitch || m === pattern.maxPitch ? fg : mutedFg
        ctx.font = '500 10px "JetBrains Mono Variable", monospace'
        ctx.textBaseline = 'middle'
        ctx.fillText(noteName(m), 6, y + g.rowH / 2)
      }
    }

    const sixteenth = ppq / 4
    for (let t = 0; t <= loopTicks; t += sixteenth) {
      const x = Math.round(g.x(t)) + 0.5
      const isBar = t % (ppq * 4) === 0
      const isBeat = t % ppq === 0
      if (!isBeat && w < 520) continue
      ctx.strokeStyle = isBar ? withAlpha(fg, 0.28) : isBeat ? withAlpha(border, 0.95) : withAlpha(border, 0.4)
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x, PAD_TOP)
      ctx.lineTo(x, h - CHORD_LANE)
      ctx.stroke()
    }

    const barTicks = ppq * 4
    for (let b = 0; b < pattern.bars; b++) {
      const x0 = g.x(b * barTicks)
      const x1 = g.x((b + 1) * barTicks)
      ctx.fillStyle = withAlpha(muted, b % 2 ? 0.5 : 0.8)
      ctx.fillRect(x0, h - CHORD_LANE + 4, x1 - x0 - 2, CHORD_LANE - 8)
      ctx.fillStyle = fg
      ctx.font = '600 12px "Space Grotesk Variable", sans-serif'
      ctx.textBaseline = 'middle'
      const chord = pattern.chords[b] ?? ''
      ctx.fillText(chord, x0 + 8, h - CHORD_LANE / 2)
      const cw = ctx.measureText(chord).width
      ctx.fillStyle = primary
      ctx.font = '500 10.5px "JetBrains Mono Variable", monospace'
      if (x1 - x0 > cw + 44) ctx.fillText(pattern.romans[b] ?? '', x0 + 14 + cw, h - CHORD_LANE / 2)
    }

    if (!midi) return
    const notes = midi.notes
    const ovs = overlapsOf(notes)
    notes.forEach((n) => {
      const x = g.x(n.ticks)
      const nw = Math.max(3, g.x(n.ticks + n.durationTicks) - x - 1)
      const y = g.y(n.midi) + 1
      const nh = Math.max(3, g.rowH - 2)
      const isAccent = n.velocity >= ACCENT_VELOCITY
      const outside = pattern.outOfScalePitchClasses.includes(n.midi % 12)
      ctx.globalAlpha = 0.5 + 0.5 * (n.velocity / 127)
      ctx.fillStyle = isAccent ? accent : groupColor
      if (isAccent) {
        ctx.shadowColor = accent
        ctx.shadowBlur = 10
      }
      ctx.beginPath()
      ctx.roundRect(x, y, nw, nh, Math.min(4, nh / 2))
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.globalAlpha = 1
      if (outside) {
        ctx.strokeStyle = danger
        ctx.lineWidth = 2
        ctx.stroke()
      }
    })
    ovs.forEach((o) => {
      const a = notes[o.from]
      const b = notes[o.to]
      const x0 = g.x(b.ticks)
      const x1 = g.x(a.ticks + a.durationTicks)
      const ya = g.y(a.midi) + g.rowH / 2
      const yb = g.y(b.midi) + g.rowH / 2
      ctx.strokeStyle = legatoColor
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x0 - 2, ya)
      ctx.lineTo(Math.max(x1, x0 + 4) + 2, yb)
      ctx.stroke()
      ctx.fillStyle = legatoColor
      ctx.fillRect(x0, Math.min(ya, yb) - 1, Math.max(2, x1 - x0), 2)
    })
  }, [pattern, midi, height])

  useEffect(() => {
    draw()
    const ro = new ResizeObserver(() => draw())
    if (wrapRef.current) ro.observe(wrapRef.current)
    const onTheme = () => requestAnimationFrame(draw)
    window.addEventListener('ns-theme', onTheme)
    document.fonts?.ready.then(() => draw())
    return () => {
      ro.disconnect()
      window.removeEventListener('ns-theme', onTheme)
    }
  }, [draw])

  usePlayhead((pos) => {
    const over = overRef.current
    const g = geoRef.current
    if (!over || !g) return
    const ctx = over.getContext('2d')!
    const dpr = over.width / Math.max(1, g.w)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, g.w, g.h)
    if (!pos || pos.id !== pattern.id || !midi) return
    const x = g.x(pos.tick)
    const fg = cssVar('--foreground')
    midi.notes.forEach((n) => {
      if (pos.tick >= n.ticks && pos.tick < n.ticks + n.durationTicks) {
        ctx.strokeStyle = fg
        ctx.lineWidth = 2
        ctx.shadowColor = cssVar('--brand-b')
        ctx.shadowBlur = 14
        const nx = g.x(n.ticks)
        ctx.beginPath()
        ctx.roundRect(nx, g.y(n.midi) + 1, Math.max(3, g.x(n.ticks + n.durationTicks) - nx - 1), Math.max(3, g.rowH - 2), 4)
        ctx.stroke()
        ctx.shadowBlur = 0
      }
    })
    ctx.fillStyle = fg
    ctx.fillRect(x, PAD_TOP, 1.5, g.h - CHORD_LANE - PAD_TOP)
  })

  const label = `Piano roll of ${pattern.name}: ${pattern.noteCount} notes over ${pattern.bars} bars, ${pattern.range}, chords ${pattern.chords.join(', ')}`
  return (
    <div ref={wrapRef} className="relative w-full" style={{ height }}>
      <canvas ref={baseRef} role="img" aria-label={label} className="absolute inset-0" />
      <canvas ref={overRef} aria-hidden className="pointer-events-none absolute inset-0" />
    </div>
  )
}

export function MiniRoll({ pattern, midi, className }: { pattern: Pattern; midi?: ParsedMidi; className?: string }) {
  const loop = midi?.endOfTrackTicks || pattern.loopTicks
  const lo = pattern.minPitch - 1
  const hi = pattern.maxPitch + 1
  const rows = hi - lo + 1
  const barTicks = (midi?.ppq || 480) * 4
  return (
    <svg viewBox={`0 0 ${loop} ${rows}`} preserveAspectRatio="none" className={className} aria-hidden>
      {Array.from({ length: pattern.bars - 1 }, (_, b) => (
        <line key={b} x1={(b + 1) * barTicks} x2={(b + 1) * barTicks} y1={0} y2={rows} stroke="var(--border)" strokeWidth={loop / 400} vectorEffect="non-scaling-stroke" />
      ))}
      {midi?.notes.map((n, i) => (
        <rect
          key={i}
          x={n.ticks}
          y={hi - n.midi + 0.12}
          width={Math.max(loop / 160, n.durationTicks - loop / 400)}
          height={0.76}
          rx={0.3}
          fill={`var(--g-${pattern.groupSlug})`}
          opacity={0.45 + 0.55 * (n.velocity / 127)}
        />
      ))}
    </svg>
  )
}
