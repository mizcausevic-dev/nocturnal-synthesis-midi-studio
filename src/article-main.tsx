import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/space-grotesk'
import '@fontsource-variable/jetbrains-mono'
import './index.css'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'

const header = document.getElementById('site-header')
const footer = document.getElementById('site-footer')

if (header) {
  createRoot(header).render(
    <StrictMode>
      <SiteHeader home={false} />
    </StrictMode>,
  )
}

if (footer) {
  createRoot(footer).render(
    <StrictMode>
      <SiteFooter home={false} />
    </StrictMode>,
  )
}
