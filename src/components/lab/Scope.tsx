import { useEffect, useRef } from 'react'
import { engine, useEngine } from '@/audio/useEngine'

export function Scope() {
  const ref = useRef<HTMLCanvasElement>(null)
  const e = useEngine()

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    const ctx = canvas.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const color = () => getComputedStyle(document.documentElement).getPropertyValue('--brand-b').trim()
    const idle = () => {
      ctx.clearRect(0, 0, w, h)
      ctx.strokeStyle = color()
      ctx.globalAlpha = 0.35
      ctx.beginPath()
      ctx.moveTo(0, h / 2)
      ctx.lineTo(w, h / 2)
      ctx.stroke()
      ctx.globalAlpha = 1
    }
    if (!e.playing || !engine.analyser) {
      idle()
      return
    }
    const analyser = engine.analyser
    const buf = new Float32Array(analyser.fftSize)
    let raf = 0
    const loop = () => {
      analyser.getFloatTimeDomainData(buf)
      let start = 0
      for (let i = 1; i < buf.length / 2; i++) {
        if (buf[i - 1] < 0 && buf[i] >= 0) {
          start = i
          break
        }
      }
      ctx.clearRect(0, 0, w, h)
      ctx.strokeStyle = color()
      ctx.lineWidth = 1.6
      ctx.beginPath()
      const span = buf.length / 2
      for (let i = 0; i < span; i++) {
        const x = (i / span) * w
        const y = h / 2 - buf[start + i] * h * 0.9
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [e.playing])

  return <canvas ref={ref} aria-hidden className="h-16 w-full" />
}
