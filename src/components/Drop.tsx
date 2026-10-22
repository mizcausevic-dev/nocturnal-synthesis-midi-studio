import { Download, FileSpreadsheet, FileText, Fingerprint, Scale } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { asset } from '@/lib/asset'
import { formatBytes } from '@/lib/music'
import { useLab } from '@/lib/lab'
import { Section } from './common'

export function Drop() {
  const { data } = useLab()
  const { meta } = data.payload
  const files = [
    { icon: FileSpreadsheet, label: 'Pattern index CSV', href: 'data/midi_patterns_index.csv', note: `${meta.patterns} rows: key, scale, chords, numerals, motif, sound` },
    { icon: FileSpreadsheet, label: 'Note-events CSV', href: 'data/midi_note_events.csv', note: `${meta.notes.toLocaleString('en-US')} rows: pitch, tick, duration, velocity` },
    { icon: FileText, label: 'Pack README', href: 'data/PACK-README.md', note: 'Conventions, numeral rules, and how to use the files' },
    { icon: Fingerprint, label: 'Manifest', href: 'data/manifest.json', note: 'SHA-256 and size for every file in the ZIP' },
    { icon: Scale, label: 'Pattern license', href: 'data/LICENSE-PATTERNS.md', note: 'Royalty-free in your own music' },
  ]
  return (
    <Section id="drop" className="py-12 sm:py-16">
      <div className="panel relative overflow-hidden">
        <img
          src={asset('images/synthwave_vs_darkwave_duality.webp')}
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-card via-card/90 to-card/40" aria-hidden />
        <div className="relative grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <p className="eyebrow">The drop</p>
            <h2 className="mt-3 text-3xl font-bold leading-[1.08] tracking-tight text-balance sm:text-[2.6rem]">
              Take all fifty <span className="text-gradient">into your session.</span>
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              One ZIP with {meta.patterns} Standard MIDI Files, the pattern index, the note-event table, a SHA-256 manifest, and a README with the
              conventions. Royalty-free for use in your own tracks. No sign-up, no email gate.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="gap-2 rounded-full">
                <a href={asset(meta.zip)} download>
                  <Download className="size-4" /> Download the ZIP
                </a>
              </Button>
              <span className="font-mono text-sm text-muted-foreground">
                {formatBytes(meta.zipBytes)} · v{meta.version}
              </span>
            </div>
          </div>
          <ul className="grid gap-2">
            {files.map((f) => (
              <li key={f.href}>
                <a
                  href={asset(f.href)}
                  className="group flex items-center gap-3 rounded-xl border border-border bg-background/70 px-4 py-3 backdrop-blur transition-colors hover:border-primary"
                >
                  <f.icon className="size-4 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{f.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">{f.note}</span>
                  </span>
                  <span className="font-mono text-[0.68rem] text-muted-foreground group-hover:text-primary">{f.href.split('.').pop()}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  )
}
