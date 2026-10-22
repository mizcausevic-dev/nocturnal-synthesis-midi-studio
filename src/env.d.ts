/// <reference types="vite/client" />

declare module 'virtual:article-meta' {
  export const articleMeta: {
    title: string
    description: string
    readMinutes: number
    words: number
  }
}
