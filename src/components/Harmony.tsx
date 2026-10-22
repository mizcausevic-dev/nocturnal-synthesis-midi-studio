import { useMemo, useState } from 'react'
import { useLab } from '@/lib/lab'
import { GROUP_VAR, patternCode } from '@/lib/music'
import type { Pattern } from '@/lib/types'
import { Section, SectionHeading } from './common'

const NUMERAL_INFO: Record<string, { inA: string; role: string }> = {
  i: { inA: 'Am', role: 'tonic minor' },
  bVI: { inA: 'F', role: 'lowered sixth, major' },
  V: { inA: 'E', role: 'major dominant (harmonic minor)' },
  iv: { inA: 'Dm', role: 'minor subdominant' },
  bIII: { inA: 'C', role: 'relative major' },
  bVII: { inA: 'G', role: 'lowered seventh, major' },
  IV: { inA: 'D', role: 'Dorian major subdominant' },
  bII: { inA: 'Bb', role: 'Neapolitan / Phrygian second' },
  bvii: { inA: 'Gm', role: 'Phrygian minor seventh' },
  'ii°': { inA: 'Bdim', role: 'diminished supertonic' },
  v: { inA: 'Em', role: 'minor dominant' },
}

function ChordToneBars({ patterns, onPick }: { patterns: Pattern[]; onPick: (id: string) => void }) {
  const [hover, setHover] = useState<Pattern | null>(null)
  const W = 640
  const H = 220
  const pad = { l: 34, r: 8, t: 12, b: 26 }
  const bw = (W - pad.l - pad.r) / patterns.length
  const y = (v: number) => H - pad.b - v * (H - pad.t - pad.b)
  const lowest = patterns.reduce((a, b) => (a.metrics.chordToneShare < b.metrics.chordToneShare ? a : b))
  const shown = hover ?? lowest
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Chord-tone share for each of the 50 patterns">
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--border)" opacity={t === 0.5 ? 1 : 0.45} strokeDasharray={t === 0.5 ? '4 4' : undefined} />
            <text x={pad.l - 6} y={y(t) + 3} fontSize={9.5} textAnchor="end" className="fill-muted-foreground font-mono">
              {t * 100}%
            </text>
          </g>
        ))}
        <text x={W - pad.r} y={y(0.5) - 5} fontSize={9.5} textAnchor="end" className="fill-muted-foreground font-mono">
          50% PROXY THRESHOLD
        </text>
        {patterns.map((p, i) => (
          <rect
            key={p.id}
            x={pad.l + i * bw + 1}
            y={y(p.metrics.chordToneShare)}
            width={Math.max(1, bw - 2)}
            height={y(0) - y(p.metrics.chordToneShare)}
            rx={1.5}
            fill={GROUP_VAR[p.groupSlug]}
            opacity={shown.id === p.id ? 1 : 0.7}
            className="cursor-pointer"
            onMouseEnter={() => setHover(p)}
            onMouseLeave={() => setHover(null)}
            onClick={() => onPick(p.id)}
          >
            <title>
              {patternCode(p.id)} {p.name}: {Math.round(p.metrics.chordToneShare * 100)}%
            </title>
          </rect>
        ))}
        {[1, 10, 20, 30, 40, 50].map((n) => (
          <text key={n} x={pad.l + (n - 0.5) * bw} y={H - 8} fontSize={9.5} textAnchor="middle" className="fill-muted-foreground font-mono">
            {String(n).padStart(3, '0')}
          </text>
        ))}
      </svg>
      <p className="mt-2 font-mono text-xs text-muted-foreground" aria-live="polite">
        {patternCode(shown.id)} {shown.name}: {Math.round(shown.metrics.chordToneShare * 100)}% of sounding time on chord tones
        {shown.metrics.strongBeatChordTone !== null && `, ${Math.round(shown.metrics.strongBeatChordTone * 100)}% of beat-1 and beat-3 notes`}
        {!hover && ' (lowest in the pack)'}
      </p>
    </div>
  )
}

export function Harmony() {
  const { patterns, data, select } = useLab()
  const { meta } = data.payload
  const usage = Object.entries(meta.romanUsage)
  const maxUse = Math.max(...usage.map(([, v]) => v))

  const stats = useMemo(() => {
    const progressions = new Map<string, string[]>()
    patterns.forEach((p) => {
      const key = p.romans.join(' – ')
      progressions.set(key, [...(progressions.get(key) ?? []), p.id])
    })
    const top = [...progressions.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 4)
    const scales = new Map<string, number>()
    patterns.forEach((p) => scales.set(p.scale, (scales.get(p.scale) ?? 0) + 1))
    const lowStrong = patterns
      .filter((p) => p.metrics.strongBeatChordTone !== null && p.metrics.strongBeatChordTone < 0.6)
      .sort((a, b) => a.metrics.strongBeatChordTone! - b.metrics.strongBeatChordTone!)
    const high = patterns.filter((p) => p.maxPitch > 84)
    const withBVI = patterns.filter((p) => p.romans.includes('bVI')).length
    const withV = patterns.filter((p) => p.romans.includes('V')).length
    return { top, scales: [...scales.entries()].sort((a, b) => b[1] - a[1]), lowStrong, high, withBVI, withV }
  }, [patterns])

  const pick = (id: string) => select(id, { scroll: true })
  const strongText = (p: Pattern) => {
    const hits = Math.round(p.metrics.strongBeatChordTone! * p.metrics.strongBeatNotes)
    return `${hits} of ${p.metrics.strongBeatNotes}`
  }

  return (
    <Section id="harmony">
      <SectionHeading index="04" label="Harmony" title="One chord per bar, checked against the melody.">
        Every pattern ships with a reference progression. The chords are never written into the MIDI; they tell you what to put under the lead.
        Roman numerals are measured from the parallel major of the tonal center, so the same symbol means the same thing in every key.
      </SectionHeading>

      <div className="mt-10 grid gap-4 lg:grid-cols-5">
        <div className="panel p-5 lg:col-span-2">
          <p className="eyebrow">Numerals in use · {meta.totalBars} bars</p>
          <ul className="mt-4 grid gap-2">
            {usage.map(([r, n]) => (
              <li key={r} className="grid grid-cols-[3.2rem_1fr_2.2rem] items-center gap-3">
                <span className="font-mono text-sm font-semibold text-primary">{r}</span>
                <span className="relative h-6 overflow-hidden rounded-md bg-muted">
                  <span className="absolute inset-y-0 left-0 rounded-md bg-primary/25" style={{ width: `${(n / maxUse) * 100}%` }} />
                  <span className="relative flex h-full items-center px-2 text-xs">
                    <span className="font-semibold">{NUMERAL_INFO[r]?.inA}</span>
                    <span className="ml-2 truncate text-muted-foreground">{NUMERAL_INFO[r]?.role}</span>
                  </span>
                </span>
                <span className="text-right font-mono text-xs tabular-nums text-muted-foreground">{n}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Examples are in A minor. Lowercase is minor, uppercase is major, ° is diminished, and b lowers the degree by a semitone. Every numeral was
            re-derived from its chord symbol by an independent script.
          </p>
        </div>

        <div className="panel p-5 lg:col-span-3">
          <p className="eyebrow">Chord-tone share, pattern by pattern</p>
          <p className="mt-2 text-sm text-muted-foreground">
            How much of each line’s sounding time sits on a tone of its bar’s chord. Every pattern clears half; click a bar to load it.
          </p>
          <div className="mt-4">
            <ChordToneBars patterns={patterns} onPick={pick} />
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="panel p-5">
          <p className="eyebrow">Most common progressions</p>
          <ul className="mt-4 grid gap-2.5">
            {stats.top.map(([prog, ids]) => (
              <li key={prog} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/60 pb-2.5 last:border-0">
                <span className="font-mono text-sm">{prog}</span>
                <span className="flex flex-wrap gap-1">
                  {ids.map((id) => (
                    <button key={id} type="button" onClick={() => pick(id)} className="rounded-full bg-muted px-2 py-0.5 font-mono text-[0.68rem] hover:bg-primary/20">
                      {patternCode(id)}
                    </button>
                  ))}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Scales: {stats.scales.map(([s, n]) => `${s.toLowerCase()} ${n}`).join(', ')}.
          </p>
        </div>

        <div className="panel p-5">
          <p className="eyebrow">Reviewer’s notes</p>
          <ul className="mt-4 grid gap-3 text-sm leading-relaxed">
            <li>
              <span className="font-semibold">The harmony is genre-typical, and narrow.</span>{' '}
              <span className="text-muted-foreground">
                {stats.withBVI} of 50 patterns use bVI and {stats.withV} borrow a major V. If you stack several loops in one track, change the chords
                under some of them.
              </span>
            </li>
            <li>
              <span className="font-semibold">A few lines lean on tension at the downbeat.</span>{' '}
              <span className="text-muted-foreground">
                {stats.lowStrong.map((p, i) => (
                  <span key={p.id}>
                    {i > 0 && (i === stats.lowStrong.length - 1 ? ' and ' : ', ')}
                    <button type="button" className="text-foreground underline decoration-dotted underline-offset-2" onClick={() => pick(p.id)}>
                      {patternCode(p.id)} {p.name}
                    </button>{' '}
                    ({strongText(p)} strong-beat notes on chord tones)
                  </span>
                ))}
                . On paper these read as suspensions; hear them with Reference chords on before you commit.
              </span>
            </li>
            <li>
              <span className="font-semibold">{stats.high.length} patterns climb above C6.</span>{' '}
              <span className="text-muted-foreground">
                Most are in Cinematic Flight. On a bright saw those peaks can get harsh; close the filter a little or drop an octave.
              </span>
            </li>
            <li>
              <span className="font-semibold">These are proxies.</span>{' '}
              <span className="text-muted-foreground">Chord-tone share cannot tell you whether a line is memorable. That judgment is yours, in context.</span>
            </li>
          </ul>
        </div>
      </div>
    </Section>
  )
}
