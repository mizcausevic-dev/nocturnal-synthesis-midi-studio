import { ArrowRight, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { asset } from '@/lib/asset'
import { articleMeta } from 'virtual:article-meta'
import { Section } from './common'

export function LongRead() {
  const article = articleMeta
  return (
    <Section id="long-read" className="pt-4">
      <p className="eyebrow">09 · The long read</p>
      <a href="article.html" className="panel group mt-4 grid overflow-hidden transition-colors hover:border-primary md:grid-cols-[1fr_1.15fr]">
        <div className="relative min-h-56 overflow-hidden">
          <img
            src={asset('images/hero_nocturnal_synthesis.webp')}
            alt="A modular synthesizer by a rainy window, with a glowing piano roll floating over a neon city"
            loading="lazy"
            decoding="async"
            className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>
        <div className="flex flex-col justify-center p-6 sm:p-10">
          <h2 className="text-2xl font-bold leading-tight tracking-tight text-balance sm:text-3xl">{article.title}</h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">{article.description}</p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Button asChild className="gap-2 rounded-full">
              <span>
                Read the article <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Button>
            <span className="inline-flex items-center gap-1.5 font-mono text-sm text-muted-foreground">
              <Clock className="size-3.5" /> {article.readMinutes} min read
            </span>
          </div>
        </div>
      </a>
    </Section>
  )
}
