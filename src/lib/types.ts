export type GroupSlug = 'neon' | 'midnight' | 'cold' | 'haunted' | 'cinematic'
export type PatchId = 'neon-saw' | 'hollow-pulse' | 'glass-triangle' | 'wide-unison'

export interface Metrics {
  notesPerBar: number
  meanInterval: number
  stepShare: number
  leapShare: number
  maxLeap: number
  span: number
  syncopation: number
  restShare: number
  chordToneShare: number
  strongBeatChordTone: number | null
  strongBeatNotes: number
  outOfScaleEvents: number
  primaryShare: number
  overlapCount: number
  overlapTicks: number[]
  ascending: number
  descending: number
  repeats: number
}

export interface Pattern {
  id: string
  name: string
  group: string
  groupSlug: GroupSlug
  filename: string
  bpm: number
  mpqn: number
  tonalCenter: string
  scale: string
  bars: number
  loopTicks: number
  chords: string[]
  romans: string[]
  chordTones: number[][]
  borrowedChords: string
  outOfScaleNotes: string
  outOfScalePitchClasses: number[]
  motif: string
  sound: string
  performance: string
  legato: boolean
  patch: PatchId
  noteCount: number
  minPitch: number
  maxPitch: number
  range: string
  tags: string[]
  metrics: Metrics
  sha256: string
  bytes: number
}

export interface Group {
  name: string
  slug: GroupSlug
  description: string
  count: number
  legato: number
}

export interface Patch {
  id: PatchId
  name: string
  summary: string
  recipe: string[]
}

export interface PackMeta {
  pack: string
  version: string
  zip: string
  zipBytes: number
  ppq: number
  patterns: number
  notes: number
  totalBars: number
  barsCount: Record<string, number>
  bpmMin: number
  bpmMax: number
  minPitch: number
  maxPitch: number
  primaryShare: number
  legatoYes: number
  legatoNo: number
  overlapTotal: number
  overlapMin: number
  overlapMax: number
  groups: Group[]
  romanUsage: Record<string, number>
  patches: Patch[]
}

export interface PatternsPayload {
  meta: PackMeta
  patterns: Pattern[]
}

export interface ReportCheck {
  id: string
  title: string
  passed: boolean
  detail: string
  problems: string[]
  problem_count: number
}

export interface ValidationReport {
  pack: string
  version: string
  generated_utc: string
  generator: string
  tools: Record<string, string>
  summary: {
    files: number
    notes: number
    checks_total: number
    checks_passed: number
    failed: number
    parsers: string[]
  }
  checks: ReportCheck[]
  second_parser: {
    name: string
    version: string
    runtime: string
    files: number
    notes_compared: number
    problems: number
    compared_fields: string
  } | null
  limitations: string[]
  reproduce: string[]
}

export interface DecoderLine {
  line: number
  source: string
  startTick: number
  durationTicks: number
  midi: number
  velocity: number
}

export interface Decoder {
  patternId: string
  bar: number
  file: string
  comment: string
  helper: string
  lines: DecoderLine[]
}

export interface MidiNote {
  midi: number
  ticks: number
  durationTicks: number
  velocity: number
}

export interface ParsedMidi {
  ppq: number
  bpm: number
  timeSignature: string
  endOfTrackTicks: number
  trackName: string
  notes: MidiNote[]
  bytes: number
  buffer: ArrayBuffer
}
