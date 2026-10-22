import { asset } from '@/lib/asset'
import { GitHubIcon, Logo, REPO_URL } from './common'

export function SiteFooter({ home = true }: { home?: boolean }) {
  const page = (hash: string) => (home ? hash : `./${hash}`)
  const columns = [
    {
      title: 'Project',
      links: [
        { label: 'Source on GitHub', href: REPO_URL, external: true },
        { label: 'The article', href: 'article.html' },
        { label: 'Validation report', href: asset('data/validation_report.json') },
        { label: 'Manifest', href: asset('data/manifest.json') },
      ],
    },
    {
      title: 'Explore',
      links: [
        { label: 'Pattern lab', href: page('#lab') },
        { label: 'Melody map', href: page('#map') },
        { label: 'Harmony', href: page('#harmony') },
        { label: 'Download the pack', href: page('#drop') },
      ],
    },
  ]
  return (
    <footer className="border-t border-border bg-card/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr_1.6fr] lg:px-8">
        <div>
          <div className="flex items-center gap-2.5 font-semibold">
            <Logo className="size-8" />
            Nocturnal Synthesis
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
            50 validated synthwave and darkwave MIDI leads and the open builder behind them.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Built by <span className="text-foreground">Miz Causevic</span> at{' '}
            <span className="text-foreground">Kinetic Gain</span>.
          </p>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <GitHubIcon className="size-4" /> mizcausevic-dev
          </a>
        </div>
        {columns.map((c) => (
          <div key={c.title}>
            <p className="eyebrow">{c.title}</p>
            <ul className="mt-3 space-y-2 text-sm">
              {c.links.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    {...('external' in l && l.external ? { target: '_blank', rel: 'noreferrer' } : {})}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <p className="eyebrow">Fine print</p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Code: MIT license. Patterns: royalty-free for your own productions, see{' '}
            <a className="text-primary underline-offset-4 hover:underline" href={asset('data/LICENSE-PATTERNS.md')}>
              LICENSE-PATTERNS
            </a>
            . Illustrations are AI-generated for this project. No cookies, no analytics, no forms. Your theme choice is kept in this browser's local
            storage, and audio is synthesized locally.
          </p>
        </div>
      </div>
    </footer>
  )
}
