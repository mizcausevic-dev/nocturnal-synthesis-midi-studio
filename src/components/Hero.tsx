import { Download, Pause, Play, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { asset } from '@/lib/asset'
import { useLab } from '@/lib/lab'
import { GROUP_VAR, patternCode } from '@/lib/music'
import { Stat } from './common'

export function Hero() {
  const { data, patterns, togglePlay, isPlaying, midi } = useLab()
  const { meta } = data.payload
  const { summary } = data.report
  const first = patterns[0]
  const playing = isPlaying(first.id)
  const parsers = data.report.summary.parsers.length

  return (
    <div id="top" className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 sm:pt-10 lg:px-8">
      <div className="panel relative overflow-hidden">
        <picture>
          <source media="(max-width: 767px)" srcSet={asset('images/hero-night-drive-960.webp')} type="image/webp" />
          <img
            src={asset('images/hero-night-drive.webp')}
            alt="A vintage mono synth by a rainy window, a neon melody line rising from its keys toward a night city"
            width={1280}
            height={720}
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover object-[70%_center] opacity-60 md:opacity-95"
          />
        </picture>
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, var(--card) 0%, color-mix(in oklab, var(--card) 88%, transparent) 38%, color-mix(in oklab, var(--card) 20%, transparent) 70%, transparent 100%), linear-gradient(0deg, var(--card) 0%, transparent 35%)',
          }}
        />
        <div className="relative px-5 pb-6 pt-10 sm:px-10 sm:pt-16 lg:px-14">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.2em] backdrop-blur">
              <span className="size-1.5 rounded-full bg-brand-a" style={{ animation: 'pulse-dot 1.6s ease-in-out infinite' }} />
              50 MIDI leads · free download
            </p>
            <h1 className="mt-6 text-[2.6rem] font-bold leading-[1.02] tracking-tight text-balance sm:text-6xl lg:text-7xl">
              Fifty leads for the <span className="text-gradient">night drive.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Nocturnal Synthesis is a pack of 50 hand-written, monophonic lead loops for synthwave, darkwave, coldwave, and
              dark cinematic scores. Audition every file here with its chords underneath, then drag the same MIDI into your DAW.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                className="h-11 rounded-xl px-5 font-semibold shadow-[0_0_32px_var(--glow)]"
                onClick={() => togglePlay(first.id)}
                disabled={!midi[first.id]}
              >
                {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
                {playing ? 'Stop' : 'Play'} {patternCode(first.id)} {first.name}
              </Button>
              <Button asChild size="lg" variant="outline" className="h-11 rounded-xl bg-background/50 px-5 font-semibold backdrop-blur">
                <a href={asset(meta.zip)} download>
                  <Download className="size-4" /> Download the pack
                </a>
              </Button>
            </div>
            <a href="#validation" className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ShieldCheck className="size-4 text-success" />
              {summary.checks_passed}/{summary.checks_total} validation checks passed, with two independent parsers
            </a>
          </div>

          <dl className="mt-12 grid grid-cols-2 divide-border overflow-hidden rounded-xl border border-border bg-background/70 backdrop-blur sm:grid-cols-5 sm:divide-x [&>div:nth-child(n+3)]:border-t sm:[&>div:nth-child(n+3)]:border-t-0">
            <Stat label="Patterns" value={meta.patterns} />
            <Stat label="Note events" value={meta.notes.toLocaleString('en-US')} />
            <Stat label="BPM range" value={`${meta.bpmMin}–${meta.bpmMax}`} />
            <Stat label="Groups" value={meta.groups.length} />
            <div className="col-span-2 sm:col-span-1">
              <Stat label="Independent parsers" value={parsers} />
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}

export function Marquee() {
  const { patterns, select } = useLab()
  const items = [...patterns, ...patterns]
  return (
    <div className="marquee relative mt-10 overflow-hidden border-y border-border/70 bg-background/60 py-3" aria-label="All fifty patterns">
      <div className="marquee-track flex w-max gap-8 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {items.map((p, i) => (
          <button
            key={`${p.id}-${i}`}
            type="button"
            tabIndex={i < patterns.length ? 0 : -1}
            aria-hidden={i >= patterns.length}
            onClick={() => select(p.id, { scroll: true })}
            className="flex items-center gap-2 whitespace-nowrap hover:text-foreground"
          >
            <span className="size-1.5 rounded-full" style={{ background: GROUP_VAR[p.groupSlug] }} />
            <span className="text-foreground/80">{patternCode(p.id)}</span> {p.name}
            <span className="opacity-60">{p.bpm}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
