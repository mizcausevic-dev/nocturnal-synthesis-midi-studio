import { CircleCheck, CircleX, FileJson, Info, Terminal } from 'lucide-react'
import { useState } from 'react'
import { asset } from '@/lib/asset'
import { cn } from '@/lib/utils'
import { Section, SectionHeading } from './common'
import { useLab } from '@/lib/lab'

export function Validation() {
  const { data } = useLab()
  const { report } = data
  const { summary } = report
  const [open, setOpen] = useState<string | null>(null)
  const allPassed = summary.failed === 0 && summary.checks_passed === summary.checks_total

  const tiles = [
    { label: 'MIDI files', value: summary.files },
    { label: 'Note events', value: summary.notes.toLocaleString('en-US') },
    { label: 'Failed', value: summary.failed },
    { label: 'Parsers', value: summary.parsers.length },
  ]

  return (
    <Section id="validation">
      <SectionHeading index="07" label="Validation" title="Checks that actually ran," highlight="with their limits stated.">
        This panel renders <span className="font-mono text-foreground">validation_report.json</span>, the same report that ships inside the pack. If a check
        had failed, it would show here in red. Nothing on this page is a projected result.
      </SectionHeading>

      <div className="mt-10 grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <div className="panel p-5 sm:p-6">
          <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
            <div className={cn('font-mono text-6xl font-bold tabular-nums leading-none', allPassed ? 'text-success' : 'text-destructive')}>
              {summary.checks_passed}
              <span className="text-3xl text-muted-foreground">/{summary.checks_total}</span>
            </div>
            <p className="pb-1 text-sm text-muted-foreground">checks passed, including the second parser</p>
          </div>
          <div className="mt-6 grid grid-cols-2 divide-x divide-y divide-border overflow-hidden rounded-xl border border-border sm:grid-cols-4 sm:divide-y-0">
            {tiles.map((t) => (
              <div key={t.label} className="px-4 py-3">
                <div className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground">{t.label}</div>
                <div className="mt-1 font-mono text-2xl font-semibold tabular-nums">{t.value}</div>
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
            Generated {report.generated_utc} by <span className="font-mono text-foreground">{report.generator}</span> with mido {report.tools.mido} on Python{' '}
            {report.tools.python}.
          </p>
          <a
            href={asset('data/validation_report.json')}
            className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            <FileJson className="size-4" /> Raw report JSON
          </a>
        </div>

        <div className="grid gap-4">
          {report.second_parser && (
            <div className="panel p-5">
              <p className="eyebrow">Second, independent parser</p>
              <h3 className="mt-2 font-mono text-lg font-semibold">
                {report.second_parser.name} {report.second_parser.version}
                <span className="ml-2 text-sm font-normal text-muted-foreground">on {report.second_parser.runtime}</span>
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Compares {report.second_parser.compared_fields} with the CSVs. It shares no parsing code with mido or with the Python builder.
              </p>
              <p className="mt-3 font-mono text-sm">
                {report.second_parser.files} files · {report.second_parser.notes_compared.toLocaleString('en-US')} notes compared ·{' '}
                <span className={report.second_parser.problems ? 'text-destructive' : 'text-success'}>{report.second_parser.problems} problems</span>
              </p>
            </div>
          )}
          <div className="panel p-5">
            <p className="eyebrow flex items-center gap-2">
              <Info className="size-3.5" /> Limitations
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
              {report.limitations.map((l) => (
                <li key={l} className="flex gap-2">
                  <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground" />
                  {l}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <ol className="panel mt-4 divide-y divide-border overflow-hidden">
        {report.checks.map((c, i) => {
          const expanded = open === c.id
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setOpen(expanded ? null : c.id)}
                aria-expanded={expanded}
                className="grid w-full grid-cols-[auto_1fr_auto] items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/40 sm:px-5"
              >
                {c.passed ? (
                  <CircleCheck className="mt-0.5 size-5 text-success" aria-label="Passed" />
                ) : (
                  <CircleX className="mt-0.5 size-5 text-destructive" aria-label="Failed" />
                )}
                <span>
                  <span className="block text-sm font-medium sm:text-[0.95rem]">{c.title}</span>
                  <span className={cn('mt-0.5 block text-xs leading-relaxed text-muted-foreground sm:text-sm', !expanded && 'line-clamp-1')}>{c.detail}</span>
                  {expanded && c.problems.length > 0 && (
                    <span className="mt-2 block space-y-1 font-mono text-xs text-destructive">
                      {c.problems.slice(0, 12).map((p) => (
                        <span key={p} className="block">
                          {p}
                        </span>
                      ))}
                      {c.problem_count > 12 && <span className="block">…and {c.problem_count - 12} more</span>}
                    </span>
                  )}
                </span>
                <span className="font-mono text-[0.68rem] text-muted-foreground">
                  {String(i + 1).padStart(2, '0')} · {c.id}
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      <div className="panel mt-4 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border px-5 py-3">
          <Terminal className="size-4 text-primary" />
          <p className="eyebrow">Reproduce it yourself</p>
        </div>
        <pre className="overflow-x-auto bg-background/60 px-5 py-4 font-mono text-[0.78rem] leading-7">
          {report.reproduce.map((line) => {
            const [cmd, comment] = line.split(/\s+#\s*/)
            return (
              <div key={line}>
                <span className="text-primary">$</span> {cmd}
                {comment && <span className="text-muted-foreground"> # {comment}</span>}
              </div>
            )
          })}
        </pre>
        <p className="border-t border-border px-5 py-3 text-sm leading-relaxed text-muted-foreground">
          The builder is deterministic. Running it again produces byte-identical MIDI files and an identical ZIP, and every file's SHA-256 is listed in{' '}
          <a className="font-mono text-primary underline-offset-4 hover:underline" href={asset('data/manifest.json')}>
            manifest.json
          </a>
          .
        </p>
      </div>
    </Section>
  )
}
