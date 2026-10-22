import { useEffect } from 'react'
import { RefreshCw, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Brief } from '@/components/Brief'
import { Drop } from '@/components/Drop'
import { Harmony } from '@/components/Harmony'
import { Hero, Marquee } from '@/components/Hero'
import { PatternLab } from '@/components/lab/PatternLab'
import { LongRead } from '@/components/LongRead'
import { MelodyMap } from '@/components/MelodyMap'
import { Mindmap } from '@/components/Mindmap'
import { Pipeline } from '@/components/Pipeline'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { SoundDesign } from '@/components/SoundDesign'
import { Validation } from '@/components/Validation'
import { asset } from '@/lib/asset'
import { LabProvider, useLab, useSiteData } from '@/lib/lab'

const SPACE_ROLES = new Set(['button', 'switch', 'checkbox', 'menuitem', 'option', 'tab', 'radio', 'link'])
const ARROW_ROLES = new Set(['slider', 'radio', 'tab', 'menuitem', 'option', 'combobox', 'spinbutton', 'textbox'])

function ignoreKey(e: KeyboardEvent): boolean {
  if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return true
  if (document.querySelector('[role="dialog"], [role="menu"], [role="listbox"]')) return true
  const el = e.target as HTMLElement | null
  if (!el || el === document.body) return false
  if (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) return true
  const role = el.getAttribute('role') ?? (el.tagName === 'BUTTON' ? 'button' : el.tagName === 'A' ? 'link' : '')
  return e.key === ' ' ? SPACE_ROLES.has(role) : ARROW_ROLES.has(role)
}

function Shortcuts() {
  const { togglePlay, step } = useLab()
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (ignoreKey(e)) return
      if (e.key === ' ') {
        e.preventDefault()
        togglePlay()
      } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'k') {
        e.preventDefault()
        step(1)
      } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'j') {
        e.preventDefault()
        step(-1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [togglePlay, step])
  return null
}

function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8" aria-busy="true" aria-label="Loading the pattern lab">
      <div className="panel h-[30rem] animate-pulse" />
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="panel h-40 animate-pulse" />
        ))}
      </div>
    </div>
  )
}

function LoadError({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
      <TriangleAlert className="mx-auto size-10 text-destructive" />
      <h1 className="mt-4 text-2xl font-bold">The pattern data did not load.</h1>
      <p className="mt-3 text-muted-foreground">
        The lab reads its data from the same files as the download, and one of them failed: <span className="font-mono text-foreground">{message}</span>
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button onClick={() => window.location.reload()} className="gap-2 rounded-full">
          <RefreshCw className="size-4" /> Try again
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <a href={asset('synthwave_darkwave_50_midi_leads.zip')} download>
            Download the pack directly
          </a>
        </Button>
      </div>
    </div>
  )
}

export default function App() {
  const status = useSiteData()
  return (
    <TooltipProvider delayDuration={200}>
      <SiteHeader />
      <main id="main">
        {status.state === 'loading' && <Loading />}
        {status.state === 'error' && <LoadError message={status.message} />}
        {status.state === 'ready' && (
          <LabProvider data={status.data}>
            <Shortcuts />
            <Hero />
            <Marquee />
            <PatternLab />
            <MelodyMap />
            <Mindmap />
            <Harmony />
            <SoundDesign />
            <Pipeline />
            <Validation />
            <Drop />
            <Brief />
            <LongRead />
          </LabProvider>
        )}
      </main>
      <SiteFooter />
    </TooltipProvider>
  )
}
