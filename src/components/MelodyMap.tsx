import { useMemo, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLab } from '@/lib/lab'
import { GROUP_VAR, patternCode } from '@/lib/music'
import type { GroupSlug, Metrics, Pattern } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Section, SectionHeading } from './common'

type YKey = 'meanInterval' | 'syncopation' | 'chordToneShare' | 'restShare'

const Y_AXES: Record<YKey, { label: string; short: string; min: number; max: number; ticks: number[]; fmt: (v: number) => string; explain: string; quadrants: [string, string, string, string] }> = {
  meanInterval: {
    label: 'Mean interval (semitones)',
    short: 'mean interval',
    min: 2,
    max: 5.5,
    ticks: [2, 3, 4, 5],
    fmt: (v) => v.toFixed(2),
    explain: 'the average jump between consecutive notes, in semitones. Low is stepwise and vocal; high is leaping and angular.',
    quadrants: ['Sparse, leaping', 'Dense, leaping', 'Sparse, stepwise', 'Dense, stepwise'],
  },
  syncopation: {
    label: 'Syncopation index',
    short: 'syncopation',
    min: 0,
    max: 0.8,
    ticks: [0, 0.2, 0.4, 0.6, 0.8],
    fmt: (v) => v.toFixed(2),
    explain: 'the share of onsets that miss the quarter-note grid, with 16ths weighted 1.0 and offbeat 8ths 0.5.',
    quadrants: ['Sparse, off the grid', 'Dense, off the grid', 'Sparse, on the grid', 'Dense, on the grid'],
  },
  chordToneShare: {
    label: 'Chord-tone share (by duration)',
    short: 'chord tones',
    min: 0.55,
    max: 1,
    ticks: [0.6, 0.7, 0.8, 0.9, 1],
    fmt: (v) => `${Math.round(v * 100)}%`,
    explain: 'the share of sounding time spent on tones of the bar’s reference chord. High is consonant; low leans on tension notes.',
    quadrants: ['Sparse, consonant', 'Dense, consonant', 'Sparse, tense', 'Dense, tense'],
  },
  restShare: {
    label: 'Rest share',
    short: 'rest',
    min: 0,
    max: 0.7,
    ticks: [0, 0.2, 0.4, 0.6],
    fmt: (v) => `${Math.round(v * 100)}%`,
    explain: 'the share of the loop where no note sounds. Cold Signals live up here on purpose.',
    quadrants: ['Sparse, airy', 'Dense, airy', 'Sparse, held', 'Dense, held'],
  },
}

const W = 760
const H = 470
const M = { l: 58, r: 20, t: 22, b: 52 }
const X_MIN = 2.5
const X_MAX = 8.5

export function MelodyMap() {
  const { patterns, data, select, selected } = useLab()
  const [yKey, setYKey] = useState<YKey>('meanInterval')
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [isolate, setIsolate] = useState<GroupSlug | null>(null)
  const axis = Y_AXES[yKey]
  const focus: Pattern = patterns.find((p) => p.id === hoverId) ?? selected

  const sx = (v: number) => M.l + ((v - X_MIN) / (X_MAX - X_MIN)) * (W - M.l - M.r)
  const sy = (v: number) => H - M.b - ((Math.min(axis.max, Math.max(axis.min, v)) - axis.min) / (axis.max - axis.min)) * (H - M.t - M.b)
  const yv = (m: Metrics) => m[yKey]

  const sorted = useMemo(() => [...patterns].sort((a, b) => b.bars - a.bars), [patterns])
  const midX = sx((X_MIN + X_MAX) / 2)
  const midY = sy((axis.min + axis.max) / 2)

  return (
    <Section id="map">
      <SectionHeading index="02" label="Melody map" title="Fifty lines, plotted by how busy and how they move.">
        Horizontal is notes per bar. Vertical is {axis.explain} Both numbers are computed from the notes in the files, not hand-tagged.
      </SectionHeading>
      <div className="mt-10 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="panel p-3 sm:p-5">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">Vertical axis</span>
            <Select value={yKey} onValueChange={(v) => setYKey(v as YKey)}>
              <SelectTrigger size="sm" className="w-60" aria-label="Vertical axis">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(Y_AXES) as YKey[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {Y_AXES[k].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Scatter plot of 50 patterns: notes per bar against ${axis.label}`}>
            {[0, 1, 2, 3].map((q) => (
              <text
                key={q}
                x={q % 2 === 0 ? M.l + 12 : W - M.r - 12}
                y={q < 2 ? M.t + 16 : H - M.b - 10}
                textAnchor={q % 2 === 0 ? 'start' : 'end'}
                className="fill-muted-foreground font-mono"
                fontSize={10}
                letterSpacing="0.14em"
                opacity={0.75}
              >
                {axis.quadrants[q].toUpperCase()}
              </text>
            ))}
            <line x1={midX} x2={midX} y1={M.t} y2={H - M.b} stroke="var(--border)" strokeDasharray="3 5" />
            <line x1={M.l} x2={W - M.r} y1={midY} y2={midY} stroke="var(--border)" strokeDasharray="3 5" />
            {axis.ticks.map((t) => (
              <g key={t}>
                <line x1={M.l} x2={W - M.r} y1={sy(t)} y2={sy(t)} stroke="var(--border)" opacity={0.45} />
                <text x={M.l - 10} y={sy(t) + 3} textAnchor="end" fontSize={10} className="fill-muted-foreground font-mono">
                  {axis.fmt(t)}
                </text>
              </g>
            ))}
            {[3, 4, 5, 6, 7, 8].map((t) => (
              <text key={t} x={sx(t)} y={H - M.b + 18} textAnchor="middle" fontSize={10} className="fill-muted-foreground font-mono">
                {t}
              </text>
            ))}
            <text x={(M.l + W - M.r) / 2} y={H - 10} textAnchor="middle" fontSize={10.5} letterSpacing="0.14em" className="fill-muted-foreground font-mono">
              NOTES PER BAR
            </text>
            <text transform={`translate(16 ${(M.t + H - M.b) / 2}) rotate(-90)`} textAnchor="middle" fontSize={10.5} letterSpacing="0.14em" className="fill-muted-foreground font-mono">
              {axis.short.toUpperCase()}
            </text>
            {sorted.map((p) => {
              const cx = sx(p.metrics.notesPerBar)
              const cy = sy(yv(p.metrics))
              const r = p.bars === 8 ? 9 : p.bars === 4 ? 6.5 : 4.5
              const dim = isolate && isolate !== p.groupSlug
              const isFocus = p.id === focus.id
              const color = GROUP_VAR[p.groupSlug]
              return (
                <g
                  key={p.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${patternCode(p.id)} ${p.name}: ${p.metrics.notesPerBar} notes per bar, ${axis.short} ${axis.fmt(yv(p.metrics))}`}
                  className="cursor-pointer outline-none"
                  opacity={dim ? 0.12 : 1}
                  onMouseEnter={() => setHoverId(p.id)}
                  onMouseLeave={() => setHoverId(null)}
                  onFocus={() => setHoverId(p.id)}
                  onBlur={() => setHoverId(null)}
                  onClick={() => select(p.id, { scroll: true })}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), select(p.id, { scroll: true }))}
                  style={{ transition: 'opacity 150ms' }}
                >
                  {isFocus && <circle cx={cx} cy={cy} r={r + 6} fill="none" stroke={color} strokeDasharray="2 3" />}
                  <circle cx={cx} cy={cy} r={r} fill={p.legato ? 'var(--card)' : color} stroke={color} strokeWidth={p.legato ? 2.2 : 0} />
                </g>
              )
            })}
          </svg>
        </div>
        <div className="grid content-start gap-4">
          <div className="panel p-4" aria-live="polite">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
              {patternCode(focus.id)} · {focus.bpm} BPM · {focus.bars} bar
            </p>
            <p className="mt-1 text-lg font-semibold">{focus.name}</p>
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[0.72rem]">
              <dt className="text-muted-foreground">notes / bar</dt>
              <dd>{focus.metrics.notesPerBar}</dd>
              <dt className="text-muted-foreground">mean interval</dt>
              <dd>{focus.metrics.meanInterval.toFixed(2)} st</dd>
              <dt className="text-muted-foreground">largest leap</dt>
              <dd>{focus.metrics.maxLeap} st</dd>
              <dt className="text-muted-foreground">syncopation</dt>
              <dd>{focus.metrics.syncopation.toFixed(2)}</dd>
              <dt className="text-muted-foreground">chord tones</dt>
              <dd>{Math.round(focus.metrics.chordToneShare * 100)}%</dd>
              <dt className="text-muted-foreground">rest</dt>
              <dd>{Math.round(focus.metrics.restShare * 100)}%</dd>
            </dl>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{focus.motif}</p>
          </div>
          <div className="panel p-4">
            <p className="eyebrow">Groups · hover to isolate</p>
            <ul className="mt-3 grid gap-1">
              {data.payload.meta.groups.map((g) => (
                <li key={g.slug}>
                  <button
                    type="button"
                    className={cn('flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted', isolate === g.slug && 'bg-muted')}
                    onMouseEnter={() => setIsolate(g.slug)}
                    onMouseLeave={() => setIsolate(null)}
                    onFocus={() => setIsolate(g.slug)}
                    onBlur={() => setIsolate(null)}
                  >
                    <span className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full" style={{ background: GROUP_VAR[g.slug] }} />
                      {g.name}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">{g.count}</span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Dot size is loop length (2, 4, 8 bars). Hollow dots are legato patterns with intentional overlaps. Click a dot to load it in the lab.
            </p>
          </div>
        </div>
      </div>
    </Section>
  )
}
