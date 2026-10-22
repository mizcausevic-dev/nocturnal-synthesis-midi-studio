import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { engine, useEngine } from '@/audio/useEngine'
import type { EngineSettings, LoopSpec } from '@/audio/engine'
import { loadMidi, loadSiteData, type SiteData } from './data'
import type { GroupSlug, ParsedMidi, Pattern } from './types'

export interface Filters {
  query: string
  groups: GroupSlug[]
  bars: 0 | 2 | 4 | 8
  scale: string
  legatoOnly: boolean
}

const EMPTY_FILTERS: Filters = { query: '', groups: [], bars: 0, scale: 'all', legatoOnly: false }

interface LabValue {
  data: SiteData
  patterns: Pattern[]
  byId: Map<string, Pattern>
  midi: Record<string, ParsedMidi>
  midiError: string | null
  selected: Pattern
  select: (id: string, opts?: { scroll?: boolean }) => void
  step: (dir: 1 | -1) => void
  togglePlay: (id?: string) => void
  isPlaying: (id?: string) => boolean
  tempo: number
  setTempo: (bpm: number) => void
  settings: EngineSettings
  updateSettings: (next: Partial<EngineSettings>) => void
  filters: Filters
  setFilters: (f: Filters | ((f: Filters) => Filters)) => void
  resetFilters: () => void
  visible: Pattern[]
}

const LabContext = createContext<LabValue | null>(null)

export function useLab(): LabValue {
  const v = useContext(LabContext)
  if (!v) throw new Error('useLab outside provider')
  return v
}

export function matches(p: Pattern, f: Filters): boolean {
  if (f.groups.length && !f.groups.includes(p.groupSlug)) return false
  if (f.bars && p.bars !== f.bars) return false
  if (f.scale !== 'all' && p.scale !== f.scale) return false
  if (f.legatoOnly && !p.legato) return false
  const q = f.query.trim().toLowerCase()
  if (!q) return true
  const hay = [p.id, `l${p.id}`, p.name, p.group, p.tonalCenter, p.scale, `${p.bpm}`, `${p.bpm} bpm`, p.chords.join(' '), p.romans.join(' '), ...p.tags]
    .join(' ')
    .toLowerCase()
  return q.split(/\s+/).every((t) => hay.includes(t))
}

function hashId(): string | null {
  const m = /^#L(\d{3})$/i.exec(window.location.hash)
  return m ? m[1] : null
}

type Status = { state: 'loading' } | { state: 'error'; message: string } | { state: 'ready'; data: SiteData }

export function useSiteData(): Status {
  const [status, setStatus] = useState<Status>({ state: 'loading' })
  useEffect(() => {
    loadSiteData()
      .then((data) => setStatus({ state: 'ready', data }))
      .catch((err: Error) => setStatus({ state: 'error', message: err.message }))
  }, [])
  return status
}

export function LabProvider({ data, children }: { data: SiteData; children: ReactNode }) {
  const e = useEngine()
  const patterns = data.payload.patterns
  const byId = useMemo(() => new Map(patterns.map((p) => [p.id, p])), [patterns])
  const [midi, setMidi] = useState<Record<string, ParsedMidi>>({})
  const [midiError, setMidiError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState(() => {
    const h = hashId()
    return h && byId.has(h) ? h : patterns[0].id
  })
  const [tempo, setTempoState] = useState(() => byId.get(selectedId)!.bpm)
  const [settings, setSettings] = useState<EngineSettings>(engine.settings)
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const midiRef = useRef(midi)
  midiRef.current = midi

  useEffect(() => {
    let cancelled = false
    Promise.allSettled(patterns.map((p) => loadMidi(p.filename).then((m) => [p.id, m] as const))).then((results) => {
      if (cancelled) return
      const next: Record<string, ParsedMidi> = {}
      const failed: string[] = []
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') next[r.value[0]] = r.value[1]
        else failed.push(patterns[i].filename)
      })
      setMidi(next)
      if (failed.length) setMidiError(`${failed.length} MIDI file(s) could not be loaded: ${failed.slice(0, 3).join(', ')}`)
    })
    return () => {
      cancelled = true
    }
  }, [patterns])

  useEffect(() => {
    if (hashId()) {
      requestAnimationFrame(() => document.getElementById('lab')?.scrollIntoView({ behavior: 'auto' }))
    }
    const onHash = () => {
      const h = hashId()
      if (h && byId.has(h)) setSelectedId(h)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [byId])

  const specFor = useCallback(
    (id: string): LoopSpec | null => {
      const p = byId.get(id)
      const m = midiRef.current[id]
      if (!p || !m) return null
      return { id, notes: m.notes, loopTicks: m.endOfTrackTicks || p.loopTicks, ppq: m.ppq, bpm: m.bpm, chordTones: p.chordTones }
    },
    [byId],
  )

  const select = useCallback(
    (id: string, opts?: { scroll?: boolean }) => {
      const p = byId.get(id)
      if (!p) return
      setSelectedId(id)
      setTempoState(p.bpm)
      history.replaceState(null, '', `#L${id}`)
      if (opts?.scroll) document.getElementById('lab')?.scrollIntoView({ behavior: 'smooth' })
      if (engine.playing) {
        const spec = specFor(id)
        if (spec) void engine.play(spec, p.bpm)
      }
    },
    [byId, specFor],
  )

  const visible = useMemo(() => patterns.filter((p) => matches(p, filters)), [patterns, filters])

  const step = useCallback(
    (dir: 1 | -1) => {
      const list = visible.length ? visible : patterns
      const idx = list.findIndex((p) => p.id === selectedId)
      const next = list[(idx + dir + list.length) % list.length] ?? list[0]
      select(next.id)
    },
    [visible, patterns, selectedId, select],
  )

  const togglePlay = useCallback(
    (id?: string) => {
      const target = id ?? selectedId
      if (engine.playing && engine.currentId === target) {
        engine.stop()
        return
      }
      if (target !== selectedId) {
        setSelectedId(target)
        history.replaceState(null, '', `#L${target}`)
      }
      const p = byId.get(target)!
      const bpm = target === selectedId ? tempo : p.bpm
      if (target !== selectedId) setTempoState(p.bpm)
      const spec = specFor(target)
      if (spec) void engine.play(spec, bpm)
    },
    [selectedId, byId, tempo, specFor],
  )

  const setTempo = useCallback((bpm: number) => {
    setTempoState(bpm)
    engine.setTempo(bpm)
  }, [])

  const updateSettings = useCallback((next: Partial<EngineSettings>) => {
    engine.setSettings(next)
    setSettings((s) => ({ ...s, ...next }))
  }, [])

  const value: LabValue = {
    data,
    patterns,
    byId,
    midi,
    midiError,
    selected: byId.get(selectedId)!,
    select,
    step,
    togglePlay,
    isPlaying: (id?: string) => e.playing && (id === undefined || e.currentId === id),
    tempo,
    setTempo,
    settings,
    updateSettings,
    filters,
    setFilters,
    resetFilters: () => setFilters(EMPTY_FILTERS),
    visible,
  }
  return <LabContext.Provider value={value}>{children}</LabContext.Provider>
}
