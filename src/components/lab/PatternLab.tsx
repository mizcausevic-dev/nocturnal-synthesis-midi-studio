import { BadgeCheck, ChevronLeft, ChevronRight, Download, Loader2, Pause, Play, Search, TriangleAlert, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { asset } from '@/lib/asset'
import { sha256Hex } from '@/lib/data'
import { useLab } from '@/lib/lab'
import { formatBytes, GROUP_VAR, patternCode } from '@/lib/music'
import { cn } from '@/lib/utils'
import type { GroupSlug, ParsedMidi, Pattern, PatchId } from '@/lib/types'
import { GroupDot, Section, SectionHeading } from '../common'
import { NotesDialog } from './NotesDialog'
import { MiniRoll, PianoRoll } from './PianoRoll'
import { Scope } from './Scope'

function Legend() {
  const items = [
    { label: 'Note', style: { background: 'var(--g-neon)' } },
    { label: 'Accent ≥ 115', style: { background: 'var(--brand-a)', boxShadow: '0 0 8px var(--brand-a)' } },
    { label: 'Out of scale', style: { border: '2px solid var(--destructive)' } },
    { label: 'Legato overlap', style: { background: 'var(--brand-b)', height: 3 } },
  ]
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-4 rounded-sm" style={i.style} />
          {i.label}
        </li>
      ))}
    </ul>
  )
}

function Toggle({ id, label, hint, checked, onChange }: { id: string; label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <label htmlFor={id} className="cursor-pointer">
        <span className="text-sm font-medium">{label}</span>
        <span className="block text-xs leading-snug text-muted-foreground">{hint}</span>
      </label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} className="mt-0.5" />
    </div>
  )
}

function FileFacts({ pattern, midi }: { pattern: Pattern; midi?: ParsedMidi }) {
  const [hash, setHash] = useState<string | null | undefined>(undefined)
  useEffect(() => {
    setHash(undefined)
    if (!midi) return
    let live = true
    sha256Hex(midi.buffer).then((h) => live && setHash(h))
    return () => {
      live = false
    }
  }, [midi])
  if (!midi) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Reading {pattern.filename}…
      </div>
    )
  }
  const eotOk = midi.endOfTrackTicks === pattern.loopTicks
  const countOk = midi.notes.length === pattern.noteCount
  const hashOk = hash === pattern.sha256
  const rows: Array<[string, React.ReactNode]> = [
    ['Parsed by', '@tonejs/midi, in this browser'],
    ['Resolution', `${midi.ppq} PPQ`],
    ['Tempo meta', `${Math.round(midi.bpm * 100) / 100} BPM`],
    ['Time signature', midi.timeSignature],
    ['End of track', <span key="e" className={eotOk ? '' : 'text-destructive'}>tick {midi.endOfTrackTicks}{eotOk ? ' = loop end' : ' ≠ loop end'}</span>],
    ['Notes', <span key="n" className={countOk ? '' : 'text-destructive'}>{midi.notes.length}{countOk ? ' = CSV' : ` vs CSV ${pattern.noteCount}`}</span>],
    ['File size', formatBytes(midi.bytes)],
    [
      'SHA-256',
      hash === undefined ? 'hashing…' : hash === null ? 'needs HTTPS' : (
        <span key="h" className={cn('inline-flex items-center gap-1', hashOk ? 'text-success' : 'text-destructive')} title={hash}>
          {hash.slice(0, 12)}… {hashOk ? <BadgeCheck className="size-3.5" /> : <TriangleAlert className="size-3.5" />}
        </span>
      ),
    ],
  ]
  return (
    <dl className="grid gap-1.5 font-mono text-[0.72rem]">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-3">
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="truncate text-right">{v}</dd>
        </div>
      ))}
      {hash && (
        <p className="mt-1 text-[0.68rem] leading-snug text-muted-foreground">
          {hashOk ? 'Hash matches manifest.json in the ZIP.' : 'Hash does not match manifest.json.'}
        </p>
      )}
    </dl>
  )
}

function Player() {
  const { selected: p, midi, togglePlay, isPlaying, step, tempo, setTempo, settings, updateSettings, data } = useLab()
  const m = midi[p.id]
  const playing = isPlaying(p.id)
  const patches = data.payload.meta.patches
  const filename = p.filename
  return (
    <div className="panel mt-12 grid overflow-hidden lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="font-mono text-[0.7rem]">
            {patternCode(p.id)}
          </Badge>
          <span className="inline-flex items-center gap-1.5 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
            <GroupDot slug={p.groupSlug} /> {p.group}
          </span>
          {p.legato && (
            <Badge variant="outline" className="font-mono text-[0.65rem] text-brand-b">
              legato
            </Badge>
          )}
        </div>
        <h3 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl" aria-live="polite">
          {p.name}
        </h3>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          {p.tonalCenter} {p.scale.toLowerCase()} · {p.bpm} BPM · {p.bars} bars · {p.range} (MIDI {p.minPitch}–{p.maxPitch}) · {p.noteCount} notes
        </p>
        <div className="mt-4 flex items-center gap-2">
          <Button variant="outline" size="icon" className="rounded-full" onClick={() => step(-1)} aria-label="Previous pattern">
            <ChevronLeft className="size-4" />
          </Button>
          <Button className="h-10 min-w-28 rounded-xl font-semibold" onClick={() => togglePlay()} disabled={!m} aria-label={playing ? 'Stop' : `Play ${p.name}`}>
            {!m ? <Loader2 className="size-4 animate-spin" /> : playing ? <Pause className="size-4" /> : <Play className="size-4" />}
            {playing ? 'Stop' : 'Play'}
          </Button>
          <Button variant="outline" size="icon" className="rounded-full" onClick={() => step(1)} aria-label="Next pattern">
            <ChevronRight className="size-4" />
          </Button>
          <span className="ml-auto hidden font-mono text-xs text-muted-foreground sm:block">
            {tempo !== p.bpm ? `${tempo} BPM (file ${p.bpm})` : `${p.bpm} BPM`}
          </span>
        </div>
        <div className="panel-inset mt-4 overflow-hidden p-2">
          <PianoRoll pattern={p} midi={m} height={300} />
        </div>
        <div className="mt-3">
          <Legend />
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <h4 className="eyebrow">Motif</h4>
            <p className="mt-2 text-sm leading-relaxed">{p.motif}</p>
          </div>
          <div>
            <h4 className="eyebrow">
              Suggested sound <span className="normal-case tracking-normal text-muted-foreground">(not in the MIDI)</span>
            </h4>
            <p className="mt-2 text-sm leading-relaxed">{p.sound}</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{p.performance}</p>
          </div>
        </div>
        <div className="mt-6">
          <h4 className="eyebrow">Harmony, one chord per bar</h4>
          <div className="mt-2 flex flex-wrap gap-2">
            {p.chords.map((c, i) => (
              <span key={i} className="rounded-lg border border-border bg-muted/60 px-2.5 py-1.5 font-mono text-xs">
                <span className="text-muted-foreground">{i + 1}</span> <span className="font-semibold text-foreground">{c}</span>{' '}
                <span className="text-primary">{p.romans[i]}</span>
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Borrowed or out-of-scale chords: {p.borrowedChords}. Out-of-scale melody notes: {p.outOfScaleNotes}.
          </p>
        </div>
      </div>

      <aside className="border-t border-border bg-background/40 p-4 sm:p-6 lg:border-l lg:border-t-0" aria-label="Playback controls">
        <div className="panel-inset px-3 py-2">
          <Scope />
        </div>
        <div className="mt-5">
          <div className="flex items-baseline justify-between">
            <label className="eyebrow" htmlFor="tempo">
              Tempo
            </label>
            <span className="font-mono text-sm tabular-nums">{tempo} BPM</span>
          </div>
          <Slider id="tempo" className="mt-3" min={70} max={150} step={1} value={[tempo]} onValueChange={([v]) => setTempo(v)} aria-label="Tempo" />
          <p className="mt-2 text-xs text-muted-foreground">File tempo is {p.bpm}. Changes apply at the next loop boundary.</p>
        </div>
        <div className="mt-5">
          <label className="eyebrow" id="patch-label">
            Preview patch
          </label>
          <Select value={settings.patch} onValueChange={(v) => updateSettings({ patch: v as PatchId })}>
            <SelectTrigger className="mt-2 w-full" aria-labelledby="patch-label">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {patches.map((pt) => (
                <SelectItem key={pt.id} value={pt.id}>
                  {pt.name}
                  {pt.id === p.patch ? ' · suggested' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {settings.patch !== p.patch && (
            <button type="button" className="mt-1.5 text-xs text-primary hover:underline" onClick={() => updateSettings({ patch: p.patch })}>
              Use the suggested patch for this pattern
            </button>
          )}
        </div>
        <div className="mt-5 grid gap-4">
          <Toggle id="pad" label="Reference chords" hint="A quiet pad plays the CSV chord for each bar." checked={settings.pad} onChange={(v) => updateSettings({ pad: v })} />
          <Toggle id="drums" label="Reference drums" hint="Kick on every beat, snare on 2 and 4, offbeat hats." checked={settings.drums} onChange={(v) => updateSettings({ drums: v })} />
          <Toggle id="glide" label="Glide on overlaps" hint="Only where notes overlap in the file, like a mono legato synth." checked={settings.glide} onChange={(v) => updateSettings({ glide: v })} />
          <Toggle id="vel" label="Velocity sensitive" hint="Turn off to hear the line on a fixed-velocity patch." checked={settings.velocity} onChange={(v) => updateSettings({ velocity: v })} />
          <Toggle id="space" label="Delay send" hint="Off by default. The lines are written to work dry." checked={settings.space} onChange={(v) => updateSettings({ space: v })} />
        </div>
        <div className="mt-5">
          <label className="eyebrow" htmlFor="volume">
            Volume
          </label>
          <Slider id="volume" className="mt-3" min={0} max={1} step={0.01} value={[settings.volume]} onValueChange={([v]) => updateSettings({ volume: v })} aria-label="Volume" />
        </div>
        <div className="panel-inset mt-5 p-3">
          <h4 className="eyebrow mb-2">File facts</h4>
          <FileFacts pattern={p} midi={m} />
        </div>
        <div className="mt-4 flex gap-2">
          <Button asChild className="flex-1">
            <a href={asset(`midi/${filename}`)} download>
              <Download className="size-4" /> {p.id}.mid
            </a>
          </Button>
          <NotesDialog pattern={p} midi={m} />
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Keys: <span className="kbd">Space</span> play or stop · <span className="kbd">←</span> <span className="kbd">→</span> or{' '}
          <span className="kbd">J</span> <span className="kbd">K</span> switch pattern
        </p>
      </aside>
    </div>
  )
}

function FilterBar() {
  const { filters, setFilters, data, visible, patterns, resetFilters } = useLab()
  const groups = data.payload.meta.groups
  const toggleGroup = (g: GroupSlug) =>
    setFilters((f) => ({ ...f, groups: f.groups.includes(g) ? f.groups.filter((x) => x !== g) : [...f.groups, g] }))
  const chip = (active: boolean) =>
    cn(
      'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors',
      active ? 'border-primary bg-primary/15 text-foreground' : 'border-border bg-card/60 text-muted-foreground hover:text-foreground',
    )
  const dirty = filters.query || filters.groups.length || filters.bars || filters.scale !== 'all' || filters.legatoOnly
  return (
    <div className="mt-10">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.query}
            onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
            placeholder="Search name, key, chord, BPM…"
            className="h-9 rounded-full pl-9"
            aria-label="Search patterns"
          />
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by group">
          {groups.map((g) => (
            <button key={g.slug} type="button" aria-pressed={filters.groups.includes(g.slug)} className={chip(filters.groups.includes(g.slug))} onClick={() => toggleGroup(g.slug)}>
              <span className="size-2 rounded-full" style={{ background: GROUP_VAR[g.slug] }} /> {g.name}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <div className="flex gap-1" role="group" aria-label="Filter by loop length">
          {([0, 2, 4, 8] as const).map((b) => (
            <button key={b} type="button" aria-pressed={filters.bars === b} className={chip(filters.bars === b)} onClick={() => setFilters((f) => ({ ...f, bars: b }))}>
              {b ? `${b} bar` : 'Any length'}
            </button>
          ))}
        </div>
        <Select value={filters.scale} onValueChange={(v) => setFilters((f) => ({ ...f, scale: v }))}>
          <SelectTrigger size="sm" className="h-8 w-44 rounded-full text-xs" aria-label="Filter by scale">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All scales</SelectItem>
            {['Natural Minor', 'Harmonic Minor', 'Dorian', 'Phrygian'].map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="ml-1 flex items-center gap-2 text-xs text-muted-foreground">
          <Switch checked={filters.legatoOnly} onCheckedChange={(v) => setFilters((f) => ({ ...f, legatoOnly: v }))} aria-label="Legato only" /> Legato only
        </label>
        {dirty ? (
          <button type="button" onClick={resetFilters} className="ml-auto inline-flex items-center gap-1 text-xs text-primary hover:underline">
            <X className="size-3.5" /> Reset filters
          </button>
        ) : null}
      </div>
      <p className="mt-4 text-xs text-muted-foreground" aria-live="polite">
        Showing <span className="font-semibold text-foreground">{visible.length}</span> of {patterns.length} patterns
      </p>
    </div>
  )
}

function PatternCard({ p, active, midi, onSelect }: { p: Pattern; active: boolean; midi?: ParsedMidi; onSelect: () => void }) {
  return (
    <a
      href={`#L${p.id}`}
      onClick={(e) => {
        e.preventDefault()
        onSelect()
      }}
      aria-current={active ? 'true' : undefined}
      className={cn(
        'group flex flex-col rounded-2xl border bg-card/80 p-3.5 transition-all hover:-translate-y-0.5 hover:border-primary/60',
        active ? 'border-primary shadow-[0_0_0_1px_var(--primary),0_0_28px_var(--glow)]' : 'border-border',
      )}
    >
      <div className="flex items-center justify-between font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <GroupDot slug={p.groupSlug} /> {patternCode(p.id)} · {p.group.split(' ')[0]}
        </span>
        <span>{p.bpm} BPM</span>
      </div>
      <div className="mt-1.5 font-semibold tracking-tight">{p.name}</div>
      <div className="text-xs text-muted-foreground">
        {p.tonalCenter} {p.scale.toLowerCase()} · {p.bars} bar
      </div>
      <div className="mt-2.5 h-14 rounded-lg border border-border/70 bg-background/70 p-1.5">
        {midi ? <MiniRoll pattern={p} midi={midi} className="h-full w-full" /> : <div className="h-full w-full animate-pulse rounded bg-muted/60" />}
      </div>
      {p.tags.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {p.tags.map((t) => (
            <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[0.65rem] text-muted-foreground">
              {t}
            </span>
          ))}
        </div>
      )}
    </a>
  )
}

export function PatternLab() {
  const { data, visible, selected, midi, select, resetFilters, midiError } = useLab()
  const { meta } = data.payload
  return (
    <Section id="lab">
      <SectionHeading index="01" label="Pattern lab" title="Audition all fifty." highlight="Hear the file, not a mockup.">
        Every loop below is fetched as the real .mid file and parsed in your browser, then played through a small Web Audio mono synth.
        The piano roll is drawn from the parsed file, with the CSV chord for each bar underneath. {meta.legatoYes} patterns use short
        legato overlaps; the other {meta.legatoNo} never overlap.
      </SectionHeading>
      {midiError && (
        <p role="alert" className="mt-6 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm">
          {midiError}. You can still <a className="underline" href={asset(meta.zip)}>download the ZIP</a>.
        </p>
      )}
      <Player />
      <FilterBar />
      {visible.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="font-medium">No pattern matches these filters.</p>
          <Button variant="outline" className="mt-4" onClick={resetFilters}>
            Reset filters
          </Button>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((p) => (
            <PatternCard key={p.id} p={p} active={p.id === selected.id} midi={midi[p.id]} onSelect={() => select(p.id, { scroll: true })} />
          ))}
        </div>
      )}
    </Section>
  )
}
