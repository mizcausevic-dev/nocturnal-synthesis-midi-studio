import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useLab } from '@/lib/lab'
import { Section, SectionHeading } from './common'

const KPIS = [
  {
    kpi: 'Pack downloads per visit',
    event: 'self_serve_cta_click',
    params: 'cta_target=pack_zip | single_mid, placement',
    decision: 'Whether the lab converts, and which placement earns it',
  },
  {
    kpi: 'Patterns auditioned for a full loop',
    event: 'tool_complete',
    params: 'content_type=midi_pattern, offer=pattern_id',
    decision: 'Which groups to extend in the next pack',
  },
  {
    kpi: 'Article to lab click-through',
    event: 'content_engagement_click',
    params: 'placement=article, destination=lab',
    decision: 'Whether long-form content is worth a second piece',
  },
]

export function Brief() {
  const { data } = useLab()
  const { meta } = data.payload
  const cards = [
    {
      title: 'What it is',
      body: `A free pack of ${meta.patterns} monophonic MIDI lead loops for synthwave and darkwave, this browser lab that plays the real files, and the open-source builder and validators behind them.`,
    },
    {
      title: 'Who it is for',
      body: 'Producers of synthwave, outrun, darkwave, coldwave, and soundtrack-leaning electronica who want a topline to start from instead of a blank piano roll. Also teachers who explain melody writing over minor-key progressions.',
    },
    {
      title: 'Why it wins',
      body: 'Every convention is published next to the files: MIDI 60 = C4, zero-based beats, one chord per bar with a checked Roman numeral, out-of-scale notes listed, legato only where labeled. Two independent parsers confirm the files say what the CSVs say.',
    },
    {
      title: 'How it is structured',
      body: 'A standard-library Python builder writes the pack. Two validators check it. A static Vite and React site reads the same files at runtime, so the site cannot drift from the download.',
    },
    {
      title: 'How users discover it',
      body: 'Search intent such as "free synthwave MIDI leads" and "darkwave melody MIDI pack", the long-read article, GitHub topics, and deep links to single patterns (for example #L016) shared in producer communities.',
    },
    {
      title: 'How users engage',
      body: 'Audition with four preview patches and optional reference chords and drums, filter by group, length, and scale, explore the melody map, mindmap, and harmony view, and read note-by-note tables before downloading.',
    },
    {
      title: 'How users convert',
      body: 'Download the ZIP or a single .mid, with no sign-up and no email gate. Secondary conversion is a GitHub star or a fork of the builder.',
    },
    {
      title: 'How it makes money',
      body: 'Today it does not, by design. Options: a paid extended pack with matching bass and arp companions, preset banks for the suggested patches, custom topline commissions, or a clearly labeled sponsor from a synth or plugin maker.',
    },
    {
      title: 'How it launches',
      body: `GitHub Pages live preview, a v${meta.version} tag on the repo, the long-read article, then targeted posts where synthwave producers share MIDI. Measure before scaling any channel.`,
    },
    {
      title: 'How it improves',
      body: 'Import tests inside Ableton Live, Bitwig, FL Studio, and Logic. Rendered audio previews through real patches. Companion packs keyed to the same progressions, driven by download data once a privacy notice and consent-aware analytics exist.',
    },
  ]

  return (
    <Section id="brief">
      <SectionHeading index="08" label="Product brief" title="The executive view:" highlight="what this is and how it grows.">
        Assumed business goal: build a credible, free creative-technology asset that earns an audience of synth producers and proves the build-and-verify
        approach. Page goal: get a visitor to audition, then download.
      </SectionHeading>
      <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c, i) => (
          <li key={c.title} className="panel flex flex-col p-5">
            <span className="font-mono text-xs text-primary">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="mt-2 font-semibold">{c.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
          </li>
        ))}
      </ol>

      <div className="panel mt-6 overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
          <h3 className="font-semibold">KPIs mapped to canonical events</h3>
          <Badge variant="outline" className="border-destructive/50 font-mono text-[0.65rem] uppercase tracking-wider text-destructive">
            Not wired
          </Badge>
          <p className="w-full text-sm text-muted-foreground sm:w-auto">This site sets no cookies and loads no analytics.</p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">KPI</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Parameters</TableHead>
                <TableHead className="pr-5">Decision it informs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {KPIS.map((k) => (
                <TableRow key={k.event}>
                  <TableCell className="pl-5 font-medium">{k.kpi}</TableCell>
                  <TableCell className="font-mono text-xs text-primary">{k.event}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{k.params}</TableCell>
                  <TableCell className="min-w-64 whitespace-normal pr-5 text-muted-foreground">{k.decision}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="border-t border-border px-5 py-3 text-sm leading-relaxed text-muted-foreground">
          Before any measurement ships: publish a privacy notice, document consent defaults, and register these events with their trigger conditions.
        </p>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground">Repurpose note:</span> the same builder, validator, and lab pattern works for basslines, arpeggios, chord
        progressions, or any rule-based content pack that needs proof it is correct.
      </p>
    </Section>
  )
}
