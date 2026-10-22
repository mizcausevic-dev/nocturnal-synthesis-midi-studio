import type { GroupSlug, MidiNote, Pattern } from './types'

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export function noteName(midi: number): string {
  return `${NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`
}

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

export function isBlack(midi: number): boolean {
  return [1, 3, 6, 8, 10].includes(midi % 12)
}

export const GROUP_VAR: Record<GroupSlug, string> = {
  neon: 'var(--g-neon)',
  midnight: 'var(--g-midnight)',
  cold: 'var(--g-cold)',
  haunted: 'var(--g-haunted)',
  cinematic: 'var(--g-cinematic)',
}

export const ACCENT_VELOCITY = 115

export function beats(ticks: number, ppq = 480): string {
  const v = ticks / ppq
  return Number.isInteger(v) ? v.toFixed(1) : String(Math.round(v * 10000) / 10000)
}

export function overlapsOf(notes: MidiNote[]): Array<{ from: number; to: number; ticks: number }> {
  const out: Array<{ from: number; to: number; ticks: number }> = []
  for (let i = 0; i < notes.length - 1; i++) {
    const a = notes[i]
    const b = notes[i + 1]
    const end = a.ticks + a.durationTicks
    if (b.ticks < end) out.push({ from: i, to: i + 1, ticks: end - b.ticks })
  }
  return out
}

export function inScale(p: Pattern, midi: number): boolean {
  return !p.outOfScalePitchClasses.includes(midi % 12)
}

export function patternCode(id: string): string {
  return `L${id}`
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} bytes`
  return `${(n / 1024).toFixed(1)} KB`
}

export function pct(v: number, digits = 0): string {
  return `${(v * 100).toFixed(digits)}%`
}
