import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { loadArticle } from './scripts/render-article.mjs'

const root = dirname(fileURLToPath(import.meta.url))

function articlePlugin(): Plugin {
  const virtual = '\0article-meta'
  return {
    name: 'article-page',
    resolveId(id) {
      if (id === 'virtual:article-meta') return virtual
    },
    load(id) {
      if (id !== virtual) return null
      const article = loadArticle()
      return `export const articleMeta = ${JSON.stringify({
        title: article.title,
        description: article.description,
        readMinutes: article.readMinutes,
        words: article.words,
      })}`
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        if (!ctx.filename?.endsWith('article.html')) return html
        const article = loadArticle()
        const json = JSON.stringify(article.jsonLd).replaceAll('<', '\\u003c')
        return html
          .replaceAll('__SEO_TITLE__', escapeHtml(article.seoTitle))
          .replaceAll('__TITLE__', escapeHtml(article.title))
          .replaceAll('__DESCRIPTION__', escapeHtml(article.description))
          .replaceAll('__DATE__', escapeHtml(article.date))
          .replace('__JSONLD__', json)
          .replace('<!--ARTICLE-->', article.page)
      },
    },
  }
}

function escapeHtml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), articlePlugin()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { host: '0.0.0.0', port: 43123 },
  preview: { host: '0.0.0.0', port: 43123 },
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        article: resolve(root, 'article.html'),
      },
    },
  },
})
