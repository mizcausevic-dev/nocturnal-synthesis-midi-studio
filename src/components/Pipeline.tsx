import { ArrowRight, BadgeCheck, Binary, FileCode2, Music2, Package, Rocket, ShieldCheck, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { useLab } from '@/lib/lab'
import { beats, noteName } from '@/lib/music'
import { cn } from '@/lib/utils'
import { REPO_URL, Section, SectionHeading } from './common'

export function Pipeline() {
  const { data, midi, byId } = useLab()
  const { decoder, report } = data
  const { meta } = data.payload
  const [hover, setHover] = useState<number | null>(null)
  const pattern = byId.get(decoder.patternId)!
  const parsed = midi[decoder.patternId]
  const barNotes = parsed?.notes.filter((n) => n.ticks < parsed.ppq * 4) ?? []
  const nonTonejs = report.checks.filter((c) => c.id !== 'tonejs').length

  const steps = [
    { icon: Music2, title: 'Compose', code: 'scripts/patterns_part*.py', body: '50 hand-written pattern records: notes as n() calls, key, scale, chords, numerals, and sound notes. A chord that does not match its numeral stops the build.' },
    { icon: FileCode2, title: 'Render', code: 'n()', body: `Beats become ticks at ${meta.ppq} PPQ. extra_ticks stretches a note past the next onset for a ${meta.overlapMin}–${meta.overlapMax} tick legato overlap.` },
    { icon: Binary, title: 'Encode', code: 'write_format0_midi()', body: 'Format 0 with track name, tempo, and 4/4 at tick 0. Note-offs sort before note-ons on shared ticks. End-of-track lands on the loop boundary.' },
    { icon: ShieldCheck, title: 'Validate', code: 'validate.py · validate-tonejs.mjs', body: `mido re-parses every file for ${nonTonejs} checks, including a clean rebuild. @tonejs/midi parses them again in Node and compares every note with the CSV.` },
    { icon: Package, title: 'Package', code: 'CSVs · manifest · ZIP', body: 'Both CSVs, the README, the license, and a SHA-256 manifest are zipped with fixed timestamps, so the ZIP rebuilds byte for byte.' },
    { icon: Rocket, title: 'Ship', code: 'Vite · gh-pages', body: 'This site is a static build that reads the same files at runtime. A deploy guard allows only web file types into the gh-pages branch.' },
  ]

  return (
    <Section id="pipeline">
      <SectionHeading index="06" label="Pipeline" title="From a line of Python to a validated MIDI file.">
        Nothing in the pack was drawn in a piano roll. Each note is one call to a small helper, rendered by a standard-library Python script, and
        checked by two parsers that share no code with it.
      </SectionHeading>
      <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {steps.map((s, i) => (
          <li key={s.title} className="panel relative flex flex-col p-4">
            <div className="flex items-center justify-between">
              <span className="grid size-9 place-items-center rounded-lg border border-border bg-muted">
                <s.icon className="size-4 text-primary" />
              </span>
              <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
            </div>
            <h3 className="mt-3 font-semibold">{s.title}</h3>
            <p className="truncate font-mono text-[0.68rem] text-primary" title={s.code}>
              {s.code}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            {i < steps.length - 1 && <ArrowRight aria-hidden className="absolute -right-3 top-8 hidden size-4 text-primary lg:block" />}
          </li>
        ))}
      </ol>

      <div className="panel mt-6 overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <p className="eyebrow">
            Live decoder · {pattern.id} {pattern.name}, bar {decoder.bar}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Hover a line or a note. The source is read from <span className="font-mono text-foreground">{decoder.file}</span>; the notes are read back from{' '}
            <span className="font-mono text-foreground">{pattern.filename}</span> in this browser, not from the source.
          </p>
        </div>
        <div className="grid lg:grid-cols-2">
          <div className="border-b border-border bg-background/50 p-4 font-mono text-[0.78rem] leading-7 lg:border-b-0 lg:border-r">
            <div className="text-muted-foreground">{decoder.comment}</div>
            {decoder.lines.map((l, i) => (
              <div
                key={l.line}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                className={cn('-mx-2 flex cursor-default gap-3 rounded px-2', hover === i && 'bg-primary/15')}
              >
                <span className="w-6 shrink-0 text-right text-muted-foreground/70">{l.line}</span>
                <code className="whitespace-pre-wrap break-all">{l.source},</code>
              </div>
            ))}
            <p className="mt-3 border-t border-border pt-3 font-sans text-xs leading-relaxed text-muted-foreground">
              <span className="font-mono text-foreground">{decoder.helper}</span>. Beat 0.5 × 480 = tick 240. On line {decoder.lines[1]?.line}, extra_ticks=35
              stretches A5 to {decoder.lines[1]?.durationTicks} ticks, so it is still sounding 35 ticks after G5 begins: a deliberate legato overlap.
            </p>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {decoder.lines.map((l, i) => {
                const n = barNotes[i]
                const ok = n && n.midi === l.midi && n.ticks === l.startTick && n.durationTicks === l.durationTicks && n.velocity === l.velocity
                return (
                  <div
                    key={l.line}
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(null)}
                    className={cn('rounded-lg border p-2 text-center font-mono transition-colors', hover === i ? 'border-primary bg-primary/10' : 'border-border bg-muted/40')}
                  >
                    {n ? (
                      <>
                        <div className="text-base font-semibold">{noteName(n.midi)}</div>
                        <div className="text-[0.66rem] text-muted-foreground">v{n.velocity}</div>
                        <div className="text-[0.66rem] text-muted-foreground">@{beats(n.ticks)}b</div>
                        <div className="text-[0.66rem] text-muted-foreground">{beats(n.durationTicks)}b</div>
                        <div className={cn('mt-1 flex justify-center', ok ? 'text-success' : 'text-destructive')}>
                          {ok ? <BadgeCheck className="size-3.5" /> : <TriangleAlert className="size-3.5" />}
                        </div>
                      </>
                    ) : (
                      <div className="h-20 animate-pulse rounded bg-muted" />
                    )}
                  </div>
                )
              })}
            </div>
            <BarRoll notes={barNotes} hover={hover} />
            <p className="mt-3 text-xs text-muted-foreground">
              A check means the note parsed from the file has exactly the pitch, start tick, duration, and velocity the source line computes.
            </p>
          </div>
        </div>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        Read the generator on{' '}
        <a className="text-primary underline-offset-4 hover:underline" href={`${REPO_URL}/tree/main/scripts`} target="_blank" rel="noreferrer">
          GitHub
        </a>
        .
      </p>
    </Section>
  )
}

function BarRoll({ notes, hover }: { notes: { midi: number; ticks: number; durationTicks: number }[]; hover: number | null }) {
  if (!notes.length) return null
  const lo = Math.min(...notes.map((n) => n.midi)) - 1
  const hi = Math.max(...notes.map((n) => n.midi)) + 1
  return (
    <svg viewBox={`0 0 1920 ${hi - lo + 1}`} preserveAspectRatio="none" className="mt-4 h-28 w-full rounded-lg border border-border bg-background/60" aria-hidden>
      {[480, 960, 1440].map((t) => (
        <line key={t} x1={t} x2={t} y1={0} y2={hi - lo + 1} stroke="var(--border)" vectorEffect="non-scaling-stroke" />
      ))}
      {notes.map((n, i) => (
        <rect
          key={i}
          x={n.ticks}
          y={hi - n.midi + 0.1}
          width={n.durationTicks}
          height={0.8}
          rx={0.25}
          fill={hover === i ? 'var(--brand-a)' : 'var(--g-neon)'}
          opacity={hover === null || hover === i ? 1 : 0.4}
        />
      ))}
    </svg>
  )
}
