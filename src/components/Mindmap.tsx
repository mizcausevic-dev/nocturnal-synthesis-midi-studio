import { useState } from 'react'
import { useLab } from '@/lib/lab'
import { GROUP_VAR, patternCode } from '@/lib/music'
import { Section, SectionHeading } from './common'

const W = 1200
const H = 900
const CX = 600
const CY = 450
const R_GROUP = 165
const R_LEAF = 272

function polar(r: number, deg: number) {
  const a = (deg * Math.PI) / 180
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) }
}

export function Mindmap() {
  const { data, patterns, select, selected } = useLab()
  const { meta } = data.payload
  const { summary } = data.report
  const [hover, setHover] = useState<string | null>(null)
  const groups = meta.groups

  const corners = [
    { x: 24, y: 24, title: 'Conventions', lines: ['MIDI 60 = C4 · sharps in names', '480 PPQ · 4/4 · beats from 0', 'One chord per bar, never in the MIDI'] },
    { x: W - 264, y: 24, title: 'Deliverables', lines: ['50 Standard MIDI Files, Format 0', 'Index CSV + note-events CSV', 'ZIP · manifest · README · license'] },
    { x: 24, y: H - 120, title: 'Validation', lines: ['mido + @tonejs/midi, independently', `${summary.checks_passed}/${summary.checks_total} checks, deterministic rebuild`, `${meta.notes.toLocaleString('en-US')} notes matched to the CSV`] },
    { x: W - 264, y: H - 120, title: 'Sound design', lines: ['Kept out of the MIDI', 'Four preview patches in the lab', 'Glide only where notes overlap'] },
  ]

  return (
    <Section id="mindmap">
      <SectionHeading index="03" label="Mindmap" title="The whole collection on one page.">
        Five groups branch from the core and every pattern hangs off its group. The four corners hold the rules the pack is built on. Click any
        pattern to load it in the lab.
      </SectionHeading>
      <div className="panel mt-10 overflow-x-auto p-2 sm:p-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[860px]" role="img" aria-label="Radial mindmap of the five groups and fifty patterns">
          <defs>
            <radialGradient id="mm-core" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--brand-a)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--brand-a)" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="mm-ring" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="var(--brand-a)" />
              <stop offset="1" stopColor="var(--brand-b)" />
            </linearGradient>
          </defs>
          {corners.map((c) => (
            <g key={c.title}>
              <line x1={c.x + 120} y1={c.y + 48} x2={CX} y2={CY} stroke="var(--border)" strokeDasharray="4 6" />
              <rect x={c.x} y={c.y} width={240} height={96} rx={12} fill="var(--card)" stroke="var(--border)" />
              <text x={c.x + 16} y={c.y + 26} fontSize={11} letterSpacing="0.18em" className="fill-primary font-mono">
                {c.title.toUpperCase()}
              </text>
              {c.lines.map((l, i) => (
                <text key={l} x={c.x + 16} y={c.y + 48 + i * 17} fontSize={12} className="fill-foreground">
                  {l}
                </text>
              ))}
            </g>
          ))}

          {groups.map((g, gi) => {
            const angle = -90 + gi * 72
            const gp = polar(R_GROUP, angle)
            const members = patterns.filter((p) => p.groupSlug === g.slug)
            const color = GROUP_VAR[g.slug]
            return (
              <g key={g.slug}>
                <line x1={CX} y1={CY} x2={gp.x} y2={gp.y} stroke={color} strokeWidth={2.5} opacity={0.8} />
                {members.map((p, i) => {
                  const a = angle + (i - 4.5) * 6.4
                  const lp = polar(R_LEAF, a)
                  const ctrl = polar(R_GROUP + 70, angle)
                  const flip = Math.cos((a * Math.PI) / 180) < 0
                  const label = polar(R_LEAF + 12, a)
                  const active = p.id === selected.id
                  const hot = hover === p.id || active
                  return (
                    <g
                      key={p.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`${patternCode(p.id)} ${p.name}`}
                      className="cursor-pointer outline-none"
                      onMouseEnter={() => setHover(p.id)}
                      onMouseLeave={() => setHover(null)}
                      onFocus={() => setHover(p.id)}
                      onBlur={() => setHover(null)}
                      onClick={() => select(p.id, { scroll: true })}
                      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), select(p.id, { scroll: true }))}
                    >
                      <path d={`M${gp.x},${gp.y} Q${ctrl.x},${ctrl.y} ${lp.x},${lp.y}`} fill="none" stroke={color} strokeWidth={hot ? 2 : 1.1} opacity={hot ? 1 : 0.55} />
                      <circle cx={lp.x} cy={lp.y} r={hot ? 6 : 4.2} fill={active ? color : 'var(--card)'} stroke={color} strokeWidth={1.8} />
                      <text
                        x={label.x}
                        y={label.y}
                        transform={`rotate(${flip ? a + 180 : a} ${label.x} ${label.y})`}
                        textAnchor={flip ? 'end' : 'start'}
                        dominantBaseline="middle"
                        fontSize={11.5}
                        className="font-mono"
                        fill={hot ? 'var(--foreground)' : 'var(--muted-foreground)'}
                      >
                        <tspan fill={color}>{patternCode(p.id)}</tspan> {p.name}
                      </text>
                    </g>
                  )
                })}
                <circle cx={gp.x} cy={gp.y} r={38} fill="var(--card)" stroke={color} strokeWidth={2.5} />
                <text x={gp.x} y={gp.y - 4} textAnchor="middle" fontSize={12.5} fontWeight={600} className="fill-foreground">
                  {g.name.split(' ')[0]}
                </text>
                <text x={gp.x} y={gp.y + 13} textAnchor="middle" fontSize={11} className="font-mono" fill={color}>
                  {g.count} · {g.legato} legato
                </text>
              </g>
            )
          })}
          <circle cx={CX} cy={CY} r={110} fill="url(#mm-core)" />
          <circle cx={CX} cy={CY} r={68} fill="var(--card)" stroke="url(#mm-ring)" strokeWidth={3} />
          <path d={`M${CX - 30},${CY - 14} h14 M${CX - 14},${CY - 22} h12 M${CX},${CY - 18} h10 M${CX + 12},${CY - 30} h18`} stroke="url(#mm-ring)" strokeWidth={5} strokeLinecap="round" />
          <text x={CX} y={CY + 12} textAnchor="middle" fontSize={14} fontWeight={700} className="fill-foreground">
            Nocturnal Synthesis
          </text>
          <text x={CX} y={CY + 30} textAnchor="middle" fontSize={11} className="fill-muted-foreground font-mono">
            {meta.patterns} patterns · {meta.totalBars} bars
          </text>
        </svg>
      </div>
      <p className="mt-3 text-xs text-muted-foreground sm:hidden">Scroll sideways to see the full map.</p>
    </Section>
  )
}
