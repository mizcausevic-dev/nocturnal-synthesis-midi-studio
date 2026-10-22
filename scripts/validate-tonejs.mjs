#!/usr/bin/env node
// Second, independent parser: re-reads every MIDI file with @tonejs/midi and
// compares it with both CSVs. Run after scripts/validate.py; merges its result
// into validation_report.json.
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import tonejs from '@tonejs/midi'

const { Midi } = tonejs
const require = createRequire(import.meta.url)
const repo = join(dirname(fileURLToPath(import.meta.url)), '..')
const PPQ = 480
const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (ch === '"') quoted = false
      else field += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else field += ch
  }
  if (field || row.length) {
    row.push(field)
    rows.push(row)
  }
  const [header, ...body] = rows
  return body.filter((r) => r.length === header.length).map((r) => Object.fromEntries(header.map((h, k) => [h, r[k]])))
}

const index = parseCsv(readFileSync(join(repo, 'midi_patterns_index.csv'), 'utf8'))
const noteRows = parseCsv(readFileSync(join(repo, 'midi_note_events.csv'), 'utf8'))
const rowsById = new Map()
for (const r of noteRows) {
  if (!rowsById.has(r.pattern_id)) rowsById.set(r.pattern_id, [])
  rowsById.get(r.pattern_id).push(r)
}

const problems = []
let compared = 0
for (const row of index) {
  const id = row.pattern_id
  const midi = new Midi(readFileSync(join(repo, 'midi', row.midi_filename)))
  const { header } = midi
  if (header.ppq !== PPQ) problems.push(`${id}: PPQ ${header.ppq}`)
  if (midi.tracks.length !== 1) problems.push(`${id}: ${midi.tracks.length} tracks`)
  if (header.tempos.length !== 1 || header.tempos[0].ticks !== 0 || Math.abs(header.tempos[0].bpm - Number(row.bpm)) > 0.01) {
    problems.push(`${id}: tempo ${JSON.stringify(header.tempos)} vs ${row.bpm} BPM`)
  }
  const ts = header.timeSignatures
  if (ts.length !== 1 || ts[0].ticks !== 0 || ts[0].timeSignature.join('/') !== '4/4') {
    problems.push(`${id}: time signature ${JSON.stringify(ts)}`)
  }
  const track = midi.tracks[0]
  if (!track) continue
  if (track.name !== `${id} - ${row.pattern_name}`) problems.push(`${id}: track name "${track.name}"`)
  if (track.endOfTrackTicks !== Number(row.loop_length_ticks)) {
    problems.push(`${id}: end of track ${track.endOfTrackTicks} vs loop ${row.loop_length_ticks}`)
  }
  if (track.channel !== 0) problems.push(`${id}: channel ${track.channel}`)
  if (Object.keys(track.controlChanges).length || track.pitchBends.length) problems.push(`${id}: controllers or pitch bend present`)
  const notes = [...track.notes].sort((a, b) => a.ticks - b.ticks || a.midi - b.midi)
  const rows = rowsById.get(id) ?? []
  if (notes.length !== rows.length) {
    problems.push(`${id}: ${notes.length} notes parsed, ${rows.length} in CSV`)
    continue
  }
  notes.forEach((n, k) => {
    const r = rows[k]
    const velocity = Math.round(n.velocity * 127)
    const name = `${NAMES[n.midi % 12]}${Math.floor(n.midi / 12) - 1}`
    compared++
    if (
      n.midi !== Number(r.midi_note_number) ||
      n.ticks !== Number(r.start_tick) ||
      n.durationTicks !== Number(r.duration_ticks) ||
      velocity !== Number(r.velocity) ||
      name !== r.note_name
    ) {
      problems.push(`${id} note ${k}: ${n.midi}@${n.ticks}+${n.durationTicks} v${velocity} vs CSV ${JSON.stringify(r)}`)
    }
  })
}

const version = require('@tonejs/midi/package.json').version
const reportPaths = [join(repo, 'validation_report.json'), join(repo, 'public', 'data', 'validation_report.json')]
const report = JSON.parse(readFileSync(reportPaths[0], 'utf8'))
report.checks = report.checks.filter((c) => c.id !== 'tonejs')
report.checks.push({
  id: 'tonejs',
  title: 'A second parser, @tonejs/midi, reads the same notes, tempo, meter, and loop end as the CSVs',
  passed: problems.length === 0,
  detail: `${index.length} files, ${compared} notes compared with @tonejs/midi ${version} on Node ${process.version}`,
  problems: problems.slice(0, 20),
  problem_count: problems.length,
})
report.second_parser = {
  name: '@tonejs/midi',
  version,
  runtime: `Node ${process.version}`,
  files: index.length,
  notes_compared: compared,
  problems: problems.length,
  compared_fields: 'PPQ, tempo, 4/4 time signature, track name, channel, end-of-track tick, and every note (pitch, start tick, duration, velocity, name)',
}
report.tools.tonejs_midi = version
report.tools.node = process.version
report.summary.checks_total = report.checks.length
report.summary.checks_passed = report.checks.filter((c) => c.passed).length
report.summary.failed = report.summary.checks_total - report.summary.checks_passed
report.summary.parsers = ['mido', '@tonejs/midi']
for (const p of reportPaths) writeFileSync(p, JSON.stringify(report, null, 2) + '\n')

console.log(`@tonejs/midi ${version}: ${index.length} files, ${compared} notes compared, ${problems.length} problems`)
for (const p of problems.slice(0, 10)) console.log(`  - ${p}`)
console.log(`${report.summary.checks_passed}/${report.summary.checks_total} checks passed in validation_report.json`)
if (problems.length) process.exit(1)
