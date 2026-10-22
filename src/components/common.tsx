import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { GROUP_VAR } from '@/lib/music'
import type { GroupSlug } from '@/lib/types'

export const REPO_URL = 'https://github.com/mizcausevic-dev/nocturnal-synthesis-midi-studio'
export const SITE_URL = 'https://mizcausevic-dev.github.io/nocturnal-synthesis-midi-studio/'

export function SectionHeading({
  index,
  label,
  title,
  highlight,
  children,
  className,
}: {
  index: string
  label: string
  title: string
  highlight?: string
  children?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('max-w-3xl', className)}>
      <p className="eyebrow">
        {index} · {label}
      </p>
      <h2 className="mt-3 text-3xl font-bold leading-[1.08] tracking-tight text-balance sm:text-[2.6rem]">
        {title} {highlight && <span className="text-primary">{highlight}</span>}
      </h2>
      {children && <div className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">{children}</div>}
    </div>
  )
}

export function Section({ id, children, className }: { id: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={cn('mx-auto w-full max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28 lg:px-8', className)}>
      {children}
    </section>
  )
}

export function GroupDot({ slug, className }: { slug: GroupSlug; className?: string }) {
  return <span aria-hidden className={cn('inline-block size-2 shrink-0 rounded-full', className)} style={{ background: GROUP_VAR[slug] }} />
}

export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id="logo-g" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="var(--brand-a)" />
          <stop offset="1" stopColor="var(--brand-b)" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="var(--muted)" stroke="var(--border)" />
      <rect x="10" y="40" width="12" height="5" rx="2.5" fill="url(#logo-g)" />
      <rect x="20" y="31" width="10" height="5" rx="2.5" fill="url(#logo-g)" />
      <rect x="30" y="35" width="8" height="5" rx="2.5" fill="url(#logo-g)" />
      <rect x="38" y="22" width="16" height="5" rx="2.5" fill="url(#logo-g)" />
    </svg>
  )
}

export function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  )
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="px-4 py-4 sm:px-5">
      <div className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className="mt-1.5 font-mono text-2xl font-semibold tabular-nums sm:text-[1.7rem]">{value}</div>
    </div>
  )
}
