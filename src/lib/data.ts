import { Midi } from '@tonejs/midi'
import { asset } from './asset'
import type { Decoder, ParsedMidi, PatternsPayload, ValidationReport } from './types'

export { asset }

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(asset(path))
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`)
  return (await res.json()) as T
}

export interface SiteData {
  payload: PatternsPayload
  report: ValidationReport
  decoder: Decoder
}

export async function loadSiteData(): Promise<SiteData> {
  const [payload, report, decoder] = await Promise.all([
    getJson<PatternsPayload>('data/patterns.json'),
    getJson<ValidationReport>('data/validation_report.json'),
    getJson<Decoder>('data/decoder.json'),
  ])
  return { payload, report, decoder }
}

export function parseMidi(buffer: ArrayBuffer): ParsedMidi {
  const midi = new Midi(buffer)
  const track = midi.tracks[0]
  const ts = midi.header.timeSignatures[0]?.timeSignature ?? []
  const notes = [...(track?.notes ?? [])]
    .sort((a, b) => a.ticks - b.ticks || a.midi - b.midi)
    .map((n) => ({
      midi: n.midi,
      ticks: n.ticks,
      durationTicks: n.durationTicks,
      velocity: Math.round(n.velocity * 127),
    }))
  return {
    ppq: midi.header.ppq,
    bpm: midi.header.tempos[0]?.bpm ?? 120,
    timeSignature: ts.join('/'),
    endOfTrackTicks: track?.endOfTrackTicks ?? 0,
    trackName: track?.name ?? '',
    notes,
    bytes: buffer.byteLength,
    buffer,
  }
}

export async function loadMidi(filename: string): Promise<ParsedMidi> {
  const res = await fetch(asset(`midi/${filename}`))
  if (!res.ok) throw new Error(`${filename}: HTTP ${res.status}`)
  return parseMidi(await res.arrayBuffer())
}

export async function sha256Hex(buffer: ArrayBuffer): Promise<string | null> {
  if (!globalThis.crypto?.subtle) return null
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
