import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Marked } from 'marked'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SITE = 'https://mizcausevic-dev.github.io/nocturnal-synthesis-midi-studio'
const ARTICLE_PATH = 'article/synthwave-darkwave-midi-leads.md'

const IMAGE_SIZE = {
  'images/hero_nocturnal_synthesis.webp': [1280, 720],
  'images/synthwave_vs_darkwave_duality.webp': [1280, 720],
  'images/sound-oscillator.webp': [864, 1152],
  'images/hero-night-drive.webp': [1280, 720],
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function slugify(value) {
  const slug = value
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z]+;/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return slug || 'section'
}

function uniqueSlug(base, used) {
  const count = used.get(base) ?? 0
  used.set(base, count + 1)
  return count === 0 ? base : `${base}-${count + 1}`
}

function parseFrontmatter(raw) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(raw)
  if (!match) throw new Error(`${ARTICLE_PATH} is missing frontmatter`)
  const meta = {}
  for (const line of match[1].split('\n')) {
    const cut = line.indexOf(':')
    if (cut === -1) continue
    meta[line.slice(0, cut).trim()] = line.slice(cut + 1).trim()
  }
  return { meta, body: match[2].trim() }
}

function wordCount(markdown) {
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/[#>*_|`~-]/g, ' ')
  return text.split(/\s+/).filter(Boolean).length
}

function faqEntries(tokens) {
  const faq = []
  let collecting = false
  let active = null
  for (const token of tokens) {
    if (token.type === 'heading' && token.depth === 2) {
      collecting = token.text.trim().toLowerCase() === 'faq'
      active = null
      continue
    }
    if (!collecting) continue
    if (token.type === 'heading' && token.depth === 3) {
      active = { question: token.text, answer: '' }
      faq.push(active)
      continue
    }
    if (active && token.type === 'paragraph') {
      active.answer = active.answer ? `${active.answer} ${token.text}` : token.text
    }
  }
  return faq
}

export function loadArticle() {
  const raw = readFileSync(resolve(ROOT, ARTICLE_PATH), 'utf8')
  const { meta, body } = parseFrontmatter(raw)
  const tokens = new Marked().lexer(body)
  const used = new Map()
  const toc = []
  for (const token of tokens) {
    if (token.type !== 'heading' || (token.depth !== 2 && token.depth !== 3)) continue
    token._id = uniqueSlug(slugify(token.text), used)
    if (token.depth === 2) toc.push({ id: token._id, text: token.text })
  }
  const faq = faqEntries(tokens)

  const parser = new Marked()
  parser.use({
    renderer: {
      image({ href, text }) {
        const dim = IMAGE_SIZE[href]
        const size = dim ? ` width="${dim[0]}" height="${dim[1]}"` : ''
        return `<img src="${escapeHtml(href)}" alt="${escapeHtml(text)}"${size} loading="lazy" decoding="async" />`
      },
      link({ href, tokens: inline }) {
        const text = this.parser.parseInline(inline)
        const external = /^https?:\/\//.test(href ?? '')
        const attrs = external ? ' target="_blank" rel="noreferrer"' : ''
        return `<a href="${escapeHtml(href ?? '')}"${attrs}>${text}</a>`
      },
    },
  })

  let html = parser.parse(body)
  if (typeof html !== 'string') throw new Error('marked.parse did not return a string')
  const queue = tokens.filter((token) => token.type === 'heading' && (token.depth === 2 || token.depth === 3))
  let index = 0
  html = html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (full, depth, inner) => {
    const token = queue[index++]
    const id = token?._id ?? `section-${index}`
    return `<h${depth} id="${id}">${inner}</h${depth}>`
  })
  html = html.replaceAll('<table>', '<div class="table-wrap"><table>').replaceAll('</table>', '</table></div>')

  const words = wordCount(body)
  const readMinutes = Math.max(1, Math.round(words / 220))
  const title = meta.title
  const description = meta.description
  const seoTitle = meta.seoTitle || title
  const date = meta.date || '2026-10-22'
  const url = `${SITE}/article.html`
  const image = `${SITE}/images/og-hero.jpg`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Nocturnal Synthesis', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: title, item: url },
        ],
      },
      {
        '@type': 'Article',
        '@id': `${url}#article`,
        headline: title,
        description,
        datePublished: date,
        dateModified: date,
        inLanguage: 'en',
        image,
        mainEntityOfPage: url,
        wordCount: words,
        keywords: meta.keywords,
        author: { '@id': 'https://github.com/mizcausevic-dev#person' },
        publisher: { '@id': 'https://kineticgain.com/#organization' },
        isPartOf: { '@id': `${SITE}/#website` },
      },
      {
        '@type': 'FAQPage',
        '@id': `${url}#faq`,
        mainEntity: faq.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      },
    ],
  }

  const tocHtml = toc.map((item) => `<li><a href="#${item.id}">${escapeHtml(item.text)}</a></li>`).join('\n')
  const page = `<div class="article-shell">
  <nav class="article-toc" aria-label="On this page">
    <p class="eyebrow">On this page</p>
    <ol>
      ${tocHtml}
    </ol>
  </nav>
  <article id="article">
    <header class="article-header">
      <p class="eyebrow">The long read · ${escapeHtml(date)}</p>
      <h1>${escapeHtml(title)}</h1>
      <p class="article-dek">${escapeHtml(description)}</p>
      <p class="article-byline">${readMinutes} min read · ${words.toLocaleString('en-US')} words · <a href="https://github.com/mizcausevic-dev">Miz Causevic</a></p>
      <img src="images/hero_nocturnal_synthesis.webp" alt="A modular synthesizer by a rainy window, with a glowing piano roll floating over a neon city" width="1280" height="720" fetchpriority="high" decoding="async" />
    </header>
    <div class="prose">
      ${html}
    </div>
  </article>
</div>`

  return { title, description, seoTitle, date, words, readMinutes, toc, faq, jsonLd, page }
}
