import { useEffect, useReducer, useRef } from 'react'
import { LeadEngine } from './engine'

export const engine = new LeadEngine({
  patch: 'neon-saw',
  glide: true,
  velocity: true,
  pad: false,
  drums: false,
  space: false,
  volume: 0.8,
})

export function useEngine(): LeadEngine {
  const [, force] = useReducer((x: number) => x + 1, 0)
  useEffect(() => engine.subscribe(force), [])
  return engine
}

/** Calls draw on every animation frame while the engine is playing. */
export function usePlayhead(draw: (pos: ReturnType<LeadEngine['position']>) => void) {
  const drawRef = useRef(draw)
  drawRef.current = draw
  const e = useEngine()
  useEffect(() => {
    if (!e.playing) {
      drawRef.current(null)
      return
    }
    let raf = 0
    const loop = () => {
      drawRef.current(e.position())
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [e, e.playing])
}
