import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'
import patterns from '../public/data/patterns.json' with { type: 'json' }

const base = process.env.BASE_URL ?? 'http://127.0.0.1:43123'
const shots = '/tmp/ns-shots'
mkdirSync(shots, { recursive: true })

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome-stable',
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required'],
})

const problems = []
function check(name, ok, detail = '') {
  const mark = ok ? 'PASS' : 'FAIL'
  console.log(`${mark}  ${name}${detail ? ` — ${detail}` : ''}`)
  if (!ok) problems.push(`${name}${detail ? `: ${detail}` : ''}`)
}

async function watch(page, label) {
  page.on('pageerror', (err) => problems.push(`${label} pageerror: ${err.message}`))
  page.on('console', (msg) => {
    if (msg.type() === 'error') problems.push(`${label} console: ${msg.text()}`)
  })
  page.on('requestfailed', (req) => {
    const url = req.url()
    if (url.includes('favicon')) return
    problems.push(`${label} request failed: ${req.method()} ${url} ${req.failure()?.errorText ?? ''}`)
  })
}

const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await watch(page, 'home')

await page.goto(`${base}/`, { waitUntil: 'networkidle' })
await page.getByRole('heading', { level: 1, name: /Fifty leads for the/ }).waitFor()
check('hero', await page.getByRole('heading', { level: 1 }).innerText().then((t) => t.includes('night drive')))
check('validation count', (await page.getByRole('link', { name: /19\/19 validation checks/ }).count()) === 1)
await page.screenshot({ path: `${shots}/01-hero.png` })

const lab = page.locator('#lab')
const play = lab.getByRole('button', { name: 'Play Chrome Horizon' })
await play.waitFor()
await play.click()
await lab.getByRole('button', { name: 'Stop' }).waitFor({ timeout: 8000 })
check('playback starts', true)
await page.screenshot({ path: `${shots}/02-playing.png` })

await page.locator('body').click({ position: { x: 2, y: 2 } })
await page.keyboard.press('ArrowRight')
await lab.getByRole('heading', { level: 3, name: 'Sunset Overdrive' }).waitFor()
check('arrow key steps forward', true)
await page.keyboard.press('j')
await lab.getByRole('heading', { level: 3, name: 'Chrome Horizon' }).waitFor()
check('J steps back', true)

await page.getByRole('button', { name: 'Cold Signals' }).click()
await page.getByText('Showing 10 of 50 patterns').waitFor()
check('group filter', true)
await page.getByRole('button', { name: 'Reset filters' }).click()
await page.getByText('Showing 50 of 50 patterns').waitFor()

await page.getByLabel('Legato only').click()
await page.getByText('Showing 29 of 50 patterns').waitFor()
check('legato filter', true)
await page.getByRole('button', { name: 'Reset filters' }).click()

await page.getByLabel('Filter by scale').click()
await page.getByRole('option', { name: 'Phrygian' }).click()
await page.getByText('Showing 5 of 50 patterns').waitFor()
check('scale filter', true)
await page.getByRole('button', { name: 'Reset filters' }).click()

await page.locator('#map').scrollIntoViewIfNeeded()
await page.screenshot({ path: `${shots}/03-map.png` })
await page.locator('#validation').scrollIntoViewIfNeeded()
check('report renders', (await page.getByText('19/19').count()) > 0)
await page.screenshot({ path: `${shots}/04-validation.png` })

await page.getByRole('button', { name: /Theme:/ }).click()
await page.getByRole('menuitem', { name: 'Phosphor Terminal' }).click()
check('theme', (await page.locator('html').getAttribute('data-theme')) === 'phosphor')
await page.getByRole('button', { name: 'Switch to light mode' }).click()
check('light mode', (await page.locator('html').getAttribute('data-mode')) === 'light')
await page.screenshot({ path: `${shots}/05-theme-light.png` })

for (const pattern of patterns.patterns) {
  await page.evaluate((id) => {
    window.location.hash = `#L${id}`
  }, pattern.id)
  try {
    await lab.getByRole('heading', { level: 3, name: pattern.name, exact: true }).waitFor({ timeout: 2000 })
  } catch {
    problems.push(`deep link #L${pattern.id} did not show ${pattern.name}`)
  }
}
check('deep links L001–L050', !problems.some((p) => p.startsWith('deep link')))

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } })
await watch(mobile, 'mobile')
await mobile.goto(`${base}/#L001`, { waitUntil: 'networkidle' })
await mobile.getByRole('button', { name: 'Open menu' }).click()
check('mobile menu', (await mobile.getByRole('link', { name: 'Melody map' }).count()) >= 1)
await mobile.screenshot({ path: `${shots}/06-mobile-menu.png` })
await mobile.keyboard.press('Escape')
await mobile.screenshot({ path: `${shots}/07-mobile-lab.png`, fullPage: false })

const article = await browser.newPage({ viewport: { width: 1280, height: 900 } })
await watch(article, 'article')
await article.goto(`${base}/article.html`, { waitUntil: 'networkidle' })
const articleTitle = await article.locator('h1').innerText()
check('article title', articleTitle.startsWith('50 Free Synthwave'))
check('article toc', (await article.getByRole('navigation', { name: 'On this page' }).getByRole('link').count()) >= 10)
check('article faq', (await article.getByRole('heading', { name: 'Can I use these MIDI files in commercial releases?' }).count()) === 1)
await article.screenshot({ path: `${shots}/08-article.png` })
const noscript = await article.locator('main').innerText()
check('article has the numeral correction', noscript.includes('bvii'))

await browser.close()
console.log(`\n${problems.length ? problems.length + ' problem(s)' : 'all checks passed'}`)
for (const problem of problems) console.log(' - ' + problem)
process.exit(problems.length ? 1 : 0)
