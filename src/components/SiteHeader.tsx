import { Check, ChevronDown, Menu, Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { THEMES, useTheme } from '@/lib/theme'
import { GitHubIcon, Logo, REPO_URL } from './common'

export const NAV = [
  { href: '#lab', label: 'Lab' },
  { href: '#map', label: 'Melody map' },
  { href: '#mindmap', label: 'Mindmap' },
  { href: '#harmony', label: 'Harmony' },
  { href: '#sound', label: 'Sound' },
  { href: '#pipeline', label: 'Pipeline' },
  { href: '#validation', label: 'Validation' },
  { href: '#brief', label: 'Brief' },
  { href: 'article.html', label: 'Article' },
]

function Swatch({ colors }: { colors: readonly string[] }) {
  return (
    <span
      aria-hidden
      className="inline-block size-4 shrink-0 rounded-full border border-border"
      style={{ background: `linear-gradient(135deg, ${colors[0]} 0 50%, ${colors[1]} 50% 100%)` }}
    />
  )
}

export function ThemeControls() {
  const { theme, mode, setTheme, toggleMode } = useTheme()
  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0]
  return (
    <div className="flex items-center gap-1.5">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-2 rounded-full px-3 text-xs" aria-label={`Theme: ${current.name}`}>
            <Swatch colors={current.swatch} />
            <span className="hidden sm:inline">{current.name}</span>
            <ChevronDown className="size-3.5 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">Theme</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {THEMES.map((t) => (
            <DropdownMenuItem key={t.id} onSelect={() => setTheme(t.id)} className="gap-2.5">
              <Swatch colors={t.swatch} />
              <span className="flex-1">{t.name}</span>
              {t.id === theme && <Check className="size-4 text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="outline"
        size="icon"
        className="size-8 rounded-full"
        onClick={toggleMode}
        aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {mode === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </Button>
      <Button asChild variant="outline" size="icon" className="size-8 rounded-full">
        <a href={REPO_URL} target="_blank" rel="noreferrer" aria-label="Source on GitHub">
          <GitHubIcon className="size-4" />
        </a>
      </Button>
    </div>
  )
}

export function SiteHeader({ home = true }: { home?: boolean }) {
  const [open, setOpen] = useState(false)
  const link = (href: string) => (home || href.startsWith('article') ? href : `./${href}`)
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <a
        href={home ? '#lab' : '#article'}
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        {home ? 'Skip to the pattern lab' : 'Skip to the article'}
      </a>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a href={home ? '#top' : './'} className="flex items-center gap-2.5 font-semibold tracking-tight">
          <Logo className="size-8" />
          <span>Nocturnal Synthesis</span>
        </a>
        <nav aria-label="Sections" className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <a key={n.href} href={link(n.href)} className="rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              {n.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
          <ThemeControls />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="size-8 rounded-full lg:hidden" aria-label="Open menu">
                <Menu className="size-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xs">
              <DialogTitle className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Sections</DialogTitle>
              <nav aria-label="Sections" className="grid gap-1">
                {NAV.map((n) => (
                  <a key={n.href} href={link(n.href)} onClick={() => setOpen(false)} className="rounded-md px-3 py-2.5 text-base hover:bg-muted">
                    {n.label}
                  </a>
                ))}
              </nav>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  )
}
