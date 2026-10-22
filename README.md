# Nocturnal Synthesis

50 monophonic synthwave and darkwave lead loops, written as data, rendered to Standard MIDI Files, and checked by two parsers that did not write them. The browser lab plays those same files.

## What's in the pack

- 50 Format 0 MIDI files, 480 PPQ, 4/4, channel 1, integer tempos from 85 to 130 BPM
- 1,024 notes across 218 bars, in 2-, 4-, and 8-bar loops
- Five groups of ten: Neon Hooks, Midnight Sequences, Cold Signals, Haunted Melodies, Cinematic Flight
- One reference chord per bar, with Roman numerals measured from the parallel major (`bvii` is the minor chord on the lowered seventh)
- A pattern index CSV, a note-event CSV, a SHA-256 manifest, and `validation_report.json`
- `synthwave_darkwave_50_midi_leads.zip`, rebuilt byte-for-byte by the script

Conventions, the numeral rules, and the license for the patterns are in [README_MIDI_COLLECTION.md](README_MIDI_COLLECTION.md) and [LICENSE-PATTERNS.md](LICENSE-PATTERNS.md). The code is MIT. The patterns are royalty-free in your own music and are not licensed for redistribution as a sample pack.

## Run the lab

```bash
npm ci
npm run dev
```

The lab serves at [http://127.0.0.1:43123](http://127.0.0.1:43123). `npm run build` writes `dist/`, including the pre-rendered [article](article/synthwave-darkwave-midi-leads.md) at `article.html`.

## Rebuild and check the MIDI

```bash
python3 scripts/build_pack.py           # stdlib only
pip install -r scripts/requirements.txt  # mido 1.3.3
python3 scripts/validate.py             # writes validation_report.json
npm ci && node scripts/validate-tonejs.mjs
```

`npm run validate:midi` runs the builder, both validators, and the standalone HTML dashboards. A clean rebuild matches the committed ZIP and every hash in `manifest.json`.

## Layout

| Path | What it is |
| --- | --- |
| `scripts/patterns_part1.py`, `scripts/patterns_part2.py` | The 50 patterns, one `n()` call per note |
| `scripts/midi_core.py` | Format 0 encoder and the builder's own parser |
| `scripts/build_pack.py` | MIDI, CSVs, manifest, ZIP, and the site data |
| `scripts/validate.py` | mido checks |
| `scripts/validate-tonejs.mjs` | Second parser, `@tonejs/midi` |
| `src/` | Vite, React, and the Web Audio lab |
| `article/` | Source for the long read |
| `public/midi/` | The files the lab fetches |
