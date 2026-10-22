import { useCallback, useState } from 'react'

export const THEMES = [
  { id: 'neon', name: 'Neon Night', swatch: ['#ff4fa8', '#4ff0ff'] },
  { id: 'outrun', name: 'Outrun Sunset', swatch: ['#ffcb47', '#ff3d8b'] },
  { id: 'coldwave', name: 'Coldwave', swatch: ['#e2f4ff', '#5aa9ff'] },
  { id: 'crimson', name: 'Darkwave Crimson', swatch: ['#ff4d5e', '#b583ff'] },
  { id: 'phosphor', name: 'Phosphor Terminal', swatch: ['#3dff88', '#d4ff5a'] },
  { id: 'chrome', name: 'Chrome', swatch: ['#ffffff', '#8494a8'] },
  { id: 'score', name: 'Paper Score', swatch: ['#8a2c1d', '#24507a'] },
] as const

export type ThemeId = (typeof THEMES)[number]['id']
export type Mode = 'dark' | 'light'

function read(): { theme: ThemeId; mode: Mode } {
  const el = document.documentElement
  return { theme: (el.dataset.theme as ThemeId) || 'neon', mode: (el.dataset.mode as Mode) || 'dark' }
}

function apply(theme: ThemeId, mode: Mode) {
  const el = document.documentElement
  el.dataset.theme = theme
  el.dataset.mode = mode
  el.classList.toggle('dark', mode === 'dark')
  const bg = getComputedStyle(el).getPropertyValue('--background').trim()
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg || '#08070f')
  try {
    localStorage.setItem('ns-theme', theme)
    localStorage.setItem('ns-mode', mode)
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new CustomEvent('ns-theme'))
}

export function useTheme() {
  const [state, setState] = useState(read)
  const setTheme = useCallback((theme: ThemeId) => {
    setState((s) => {
      apply(theme, s.mode)
      return { ...s, theme }
    })
  }, [])
  const toggleMode = useCallback(() => {
    setState((s) => {
      const mode: Mode = s.mode === 'dark' ? 'light' : 'dark'
      apply(s.theme, mode)
      return { ...s, mode }
    })
  }, [])
  return { ...state, setTheme, toggleMode }
}
