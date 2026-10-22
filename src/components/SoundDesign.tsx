import { AudioWaveform, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { asset } from '@/lib/asset'
import { useLab } from '@/lib/lab'
import { GROUP_VAR, noteName, patternCode } from '@/lib/music'
import { cn } from '@/lib/utils'
import { Section, SectionHeading } from './common'

export function SoundDesign() {
  const { data, patterns, settings, updateSettings, select } = useLab()
  const { meta } = data.payload
  return (
    <Section id="sound">
      <SectionHeading index="05" label="Sound design" title="The MIDI is the melody." highlight="The patch is the voice.">
        No synth settings are baked into the files. Each pattern carries a separate sound suggestion, and the lab offers four basic preview
        patches so you can hear how the same notes change character.
      </SectionHeading>
      <div className="mt-10 grid gap-4 lg:grid-cols-[0.9fr_1.6fr]">
        <figure className="panel relative min-h-[420px] overflow-hidden">
          <img
            src={asset('images/sound-oscillator.webp')}
            alt="Macro of a synth filter knob with a glowing sawtooth and pulse waveform crossing in front of it"
            width={864}
            height={1152}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-card via-card/70 to-transparent" />
          <figcaption className="absolute inset-x-0 bottom-0 p-5">
            <p className="eyebrow">Three rules the files follow</p>
            <ul className="mt-3 grid gap-2.5 text-sm leading-snug">
              <li>
                <span className="font-semibold text-primary">No sound is baked in.</span> No program changes, controllers, pitch bend, or aftertouch.
                Patch ideas live in the CSV.
              </li>
              <li>
                <span className="font-semibold text-primary">Glide is never assumed.</span> Only the {meta.legatoYes} legato patterns overlap notes,
                by {meta.overlapMin} to {meta.overlapMax} ticks.
              </li>
              <li>
                <span className="font-semibold text-primary">Range stays in the lead register.</span> Every note sits between {noteName(meta.minPitch)}{' '}
                and {noteName(meta.maxPitch)} (MIDI {meta.minPitch} to {meta.maxPitch}); {meta.primaryShare}% fall inside C4 to C6.
              </li>
            </ul>
          </figcaption>
        </figure>
        <div className="grid gap-4 sm:grid-cols-2">
          {meta.patches.map((pt) => {
            const suggested = patterns.filter((p) => p.patch === pt.id)
            const inUse = settings.patch === pt.id
            return (
              <div key={pt.id} className={cn('panel flex flex-col p-5 transition-colors', inUse && 'border-primary shadow-[0_0_28px_var(--glow)]')}>
                <div className="flex items-center gap-2">
                  <AudioWaveform className="size-4 text-primary" />
                  <h3 className="font-semibold">{pt.name}</h3>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{pt.summary}</p>
                <ul className="mt-3 grid gap-1.5 text-sm">
                  {pt.recipe.map((r) => (
                    <li key={r} className="flex gap-2">
                      <span className="mt-2 size-1 shrink-0 rounded-full bg-primary" />
                      {r}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
                  Suggested for {suggested.length} patterns
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {suggested.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        updateSettings({ patch: pt.id })
                        select(p.id, { scroll: true })
                      }}
                      className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-mono text-[0.66rem] hover:bg-primary/20"
                      title={p.name}
                    >
                      <span className="size-1.5 rounded-full" style={{ background: GROUP_VAR[p.groupSlug] }} />
                      {patternCode(p.id)}
                    </button>
                  ))}
                </div>
                <div className="mt-auto pt-5">
                  <Button variant={inUse ? 'default' : 'outline'} className="w-full" onClick={() => updateSettings({ patch: pt.id })} aria-pressed={inUse}>
                    {inUse ? (
                      <>
                        <Check className="size-4" /> Preview patch in use
                      </>
                    ) : (
                      'Use as preview patch'
                    )}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Patch matches come from keywords in each pattern’s sound suggestion (saw, pulse, triangle, detuned). They are starting points, not prescriptions.
      </p>
    </Section>
  )
}
