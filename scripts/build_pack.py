#!/usr/bin/env python3
"""
Build the Nocturnal Synthesis pack: 50 Format 0 MIDI lead loops, the index and
note-event CSVs, the pack README, a SHA-256 manifest, a reproducible ZIP, and the
site data (patterns.json with melody and harmony metrics, decoder.json).

Standard library only. The build stops on any rule violation it can detect from
its own data (chord/Roman mismatch, legato label mismatch, out-of-range notes).
Independent re-parsing lives in validate.py (mido) and validate-tonejs.mjs.

Usage:
    python3 scripts/build_pack.py            # writes the pack into the repo and public/
    build(out_root)                          # used by validate.py for the determinism check
"""

from __future__ import annotations

import ast
import csv
import hashlib
import io
import json
import shutil
import sys
import zipfile
from pathlib import Path
from typing import Dict, List, Tuple

SCRIPTS_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPTS_DIR.parent
sys.path.insert(0, str(SCRIPTS_DIR))

from midi_core import (  # noqa: E402
    PITCH_CLASS_MAP,
    PPQ,
    SCALE_INTERVALS,
    TICKS_PER_BAR,
    bpm_to_mpqn,
    midi_to_name,
    n,
    write_format0_midi,
)
from patterns_part1 import PATTERNS_PART1  # noqa: E402
from patterns_part2 import PATTERNS_PART2  # noqa: E402
from patterns_part3 import PATTERNS_PART3  # noqa: E402

PACK_NAME = "Nocturnal Synthesis"
PACK_VERSION = "1.1.0"
ZIP_NAME = "synthwave_darkwave_50_midi_leads.zip"
SITE_URL = "https://mizcausevic-dev.github.io/nocturnal-synthesis-midi-studio/"
REPO_URL = "https://github.com/mizcausevic-dev/nocturnal-synthesis-midi-studio"

GROUPS = [
    ("Neon Hooks", "neon", "Immediate, memorable motifs with clear rhythmic identities."),
    ("Midnight Sequences", "midnight", "Pulsing figures and arpeggio-inspired movement, kept in the lead role."),
    ("Cold Signals", "cold", "Minimal, angular phrases with clipped articulation and deliberate silence."),
    ("Haunted Melodies", "haunted", "Expressive minor-key themes, sustained notes, and bittersweet resolutions."),
    ("Cinematic Flight", "cinematic", "Soaring phrases, wider intervals, rising tension, longer development."),
]
GROUP_SLUG = {name: slug for name, slug, _ in GROUPS}

CHORD_QUALITY_INTERVALS = {"m": (0, 3, 7), "maj": (0, 4, 7), "dim": (0, 3, 6)}

# Degree offsets are measured from the parallel major scale of the tonic.
# Case gives triad quality (lowercase minor, uppercase major, ° diminished);
# a "b" prefix lowers the degree by a semitone.
ROMAN_DEGREE_SEMITONES = {
    "i": (0, "m"),
    "I": (0, "maj"),
    "bII": (1, "maj"),
    "ii°": (2, "dim"),
    "ii": (2, "m"),
    "bIII": (3, "maj"),
    "iii": (4, "m"),
    "iv": (5, "m"),
    "IV": (5, "maj"),
    "v": (7, "m"),
    "V": (7, "maj"),
    "bVI": (8, "maj"),
    "vi°": (9, "dim"),
    "bvii": (10, "m"),
    "bVII": (10, "maj"),
    "vii°": (11, "dim"),
}

PATCHES = [
    {
        "id": "neon-saw",
        "name": "Neon Saw",
        "summary": "One sawtooth into a resonant low-pass with a quick filter envelope.",
        "recipe": [
            "Single saw, mono, no unison",
            "Low-pass around 2.4 kHz, resonance moderate",
            "Filter envelope: fast attack, 250 ms decay",
        ],
    },
    {
        "id": "hollow-pulse",
        "name": "Hollow Pulse",
        "summary": "Narrow pulse wave, high-passed, with a short gate for cold staccato.",
        "recipe": [
            "Pulse width around 25 percent",
            "High-pass near 180 Hz, low-pass near 3 kHz",
            "Short release so rests stay silent",
        ],
    },
    {
        "id": "glass-triangle",
        "name": "Glass Triangle",
        "summary": "Triangle with a quiet sine an octave up. Soft, close, vocal.",
        "recipe": [
            "Triangle core plus sine one octave up",
            "Gentle low-pass, almost no resonance",
            "Medium attack for sustained themes",
        ],
    },
    {
        "id": "wide-unison",
        "name": "Wide Unison",
        "summary": "Two saws detuned by about 12 cents with delayed vibrato and a long release.",
        "recipe": [
            "Two saws, plus and minus 6 cents",
            "Delayed vibrato around 5.5 Hz",
            "Long release for widescreen phrases",
        ],
    },
]


def all_patterns() -> List[Dict]:
    patterns = PATTERNS_PART1 + PATTERNS_PART2 + PATTERNS_PART3
    if len(patterns) != 50:
        raise SystemExit(f"Expected 50 patterns, found {len(patterns)}")
    return patterns


def parse_chord_symbol(sym: str) -> Tuple[int, str]:
    sym = sym.strip()
    if sym.endswith("dim"):
        return PITCH_CLASS_MAP[sym[:-3]], "dim"
    if sym.endswith("m"):
        return PITCH_CLASS_MAP[sym[:-1]], "m"
    return PITCH_CLASS_MAP[sym], "maj"


def chord_pitch_classes(sym: str) -> Tuple[int, ...]:
    root, quality = parse_chord_symbol(sym)
    return tuple((root + iv) % 12 for iv in CHORD_QUALITY_INTERVALS[quality])


def scale_pitch_classes(tonal_center: str, scale: str) -> set:
    tonic = PITCH_CLASS_MAP[tonal_center]
    return {(tonic + iv) % 12 for iv in SCALE_INTERVALS[scale]}


def out_of_scale_text(tonal_center: str, scale: str, notes) -> str:
    allowed = scale_pitch_classes(tonal_center, scale)
    pitches = sorted({p for (_s, _d, p, _v) in notes if p % 12 not in allowed})
    if not pitches:
        return "none"
    return ", ".join(f"{midi_to_name(p)} (MIDI {p})" for p in pitches)


def format_beat(ticks: int) -> str:
    val = ticks / PPQ
    s = f"{val:.4f}".rstrip("0").rstrip(".")
    return s if "." in s else f"{s}.0"


def assign_patch(sound: str) -> str:
    s = sound.lower()
    if any(k in s for k in ("dual", "detuned", "stadium", "sustained", "flagship")):
        return "wide-unison"
    if any(k in s for k in ("pulse", "square", "pwm", "harpsichord")):
        return "hollow-pulse"
    if any(k in s for k in ("triangle", "sine", "glass", "bell", "fm")):
        return "glass-triangle"
    if "thin" in s:
        return "hollow-pulse"
    return "neon-saw"


def overlaps(notes) -> List[Dict]:
    """Return every pair of notes that sound at the same time, in start order."""
    found = []
    for i, (s1, d1, p1, _v1) in enumerate(notes):
        e1 = s1 + d1
        for j in range(i + 1, len(notes)):
            s2, d2, p2, _v2 = notes[j]
            if s2 >= e1:
                break
            found.append({"i": i, "j": j, "ticks": e1 - s2, "from": p1, "to": p2,
                          "adjacent": j == i + 1, "contained": not (s2 > s1 and s2 + d2 > e1)})
    return found


def melody_metrics(p: Dict, notes) -> Dict:
    bars = p["bars"]
    loop_ticks = bars * TICKS_PER_BAR
    pitches = [x[2] for x in notes]
    intervals = [b - a for a, b in zip(pitches, pitches[1:])]
    abs_iv = [abs(i) for i in intervals]

    def onset_weight(tick: int) -> float:
        if tick % PPQ == 0:
            return 0.0
        if tick % (PPQ // 2) == 0:
            return 0.5
        return 1.0

    sounding = [False] * (loop_ticks // 10)
    for s, d, _p, _v in notes:
        for t in range(s // 10, min(len(sounding), (s + d + 9) // 10)):
            sounding[t] = True

    chord_dur = 0
    total_dur = 0
    strong_hits = 0
    strong_total = 0
    for s, d, pitch, _v in notes:
        bar = min(bars - 1, s // TICKS_PER_BAR)
        pcs = chord_pitch_classes(p["chords"][bar])
        total_dur += d
        if pitch % 12 in pcs:
            chord_dur += d
        if s % (TICKS_PER_BAR // 2) == 0:
            strong_total += 1
            if pitch % 12 in pcs:
                strong_hits += 1

    allowed = scale_pitch_classes(p["tonal_center"], p["scale"])
    ov = overlaps(notes)
    return {
        "notesPerBar": round(len(notes) / bars, 3),
        "meanInterval": round(sum(abs_iv) / len(abs_iv), 3) if abs_iv else 0.0,
        "stepShare": round(sum(1 for i in abs_iv if i <= 2) / len(abs_iv), 3) if abs_iv else 0.0,
        "leapShare": round(sum(1 for i in abs_iv if i >= 5) / len(abs_iv), 3) if abs_iv else 0.0,
        "maxLeap": max(abs_iv) if abs_iv else 0,
        "span": max(pitches) - min(pitches),
        "syncopation": round(sum(onset_weight(x[0]) for x in notes) / len(notes), 3),
        "restShare": round(1 - sum(sounding) / len(sounding), 3),
        "chordToneShare": round(chord_dur / total_dur, 3),
        "strongBeatChordTone": round(strong_hits / strong_total, 3) if strong_total else None,
        "strongBeatNotes": strong_total,
        "outOfScaleEvents": sum(1 for x in notes if x[2] % 12 not in allowed),
        "primaryShare": round(sum(1 for x in pitches if 60 <= x <= 84) / len(pitches), 3),
        "overlapCount": len(ov),
        "overlapTicks": sorted({o["ticks"] for o in ov}),
        "ascending": sum(1 for i in intervals if i > 0),
        "descending": sum(1 for i in intervals if i < 0),
        "repeats": sum(1 for i in intervals if i == 0),
    }


def derive_tags(p: Dict, m: Dict, min_pitch: int, max_pitch: int) -> List[str]:
    tags = []
    scale = p["scale"].lower()
    if scale != "natural minor":
        tags.append(scale)
    if p["legato"] == "yes":
        tags.append("legato")
    if p["borrowed_chords"] != "none" and not p["borrowed_chords"].startswith("none"):
        tags.append("borrowed chord")
    if m["maxLeap"] >= 12:
        tags.append("octave leap")
    if p["bars"] == 8:
        tags.append("8 bar")
    if min_pitch < 60:
        tags.append("low anchor")
    if max_pitch > 84:
        tags.append("high peak")
    if m["restShare"] >= 0.4:
        tags.append("spacious")
    return tags[:3]


def check_pattern(p: Dict, notes, errors: List[str]) -> None:
    pid = p["id"]
    bars = p["bars"]
    loop_ticks = bars * TICKS_PER_BAR
    if bars not in (2, 4, 8):
        errors.append(f"{pid}: loop length {bars} bars is not 2, 4, or 8")
    if not (85 <= p["bpm"] <= 130) or int(p["bpm"]) != p["bpm"]:
        errors.append(f"{pid}: BPM {p['bpm']} outside 85-130")
    if len(p["chords"]) != bars or len(p["romans"]) != bars:
        errors.append(f"{pid}: {bars} bars but {len(p['chords'])} chords / {len(p['romans'])} numerals")
    tonic = PITCH_CLASS_MAP[p["tonal_center"]]
    for b, (chord, roman) in enumerate(zip(p["chords"], p["romans"])):
        if roman not in ROMAN_DEGREE_SEMITONES:
            errors.append(f"{pid} bar {b + 1}: unknown Roman numeral {roman}")
            continue
        root, quality = parse_chord_symbol(chord)
        offset, expected_quality = ROMAN_DEGREE_SEMITONES[roman]
        if root != (tonic + offset) % 12 or quality != expected_quality:
            errors.append(f"{pid} bar {b + 1}: {chord} is not {roman} in {p['tonal_center']}")
    for s, d, pitch, vel in notes:
        if s < 0 or d <= 0 or s + d > loop_ticks:
            errors.append(f"{pid}: note at {s} (+{d}) leaves the {loop_ticks}-tick loop")
        if not (55 <= pitch <= 96):
            errors.append(f"{pid}: pitch {pitch} outside 55-96")
        if not (1 <= vel <= 127):
            errors.append(f"{pid}: velocity {vel} outside 1-127")
    ov = overlaps(notes)
    for o in ov:
        if not o["adjacent"] or o["contained"] or o["from"] == o["to"] or not (1 <= o["ticks"] <= 60):
            errors.append(f"{pid}: overlap breaks the legato rules: {o}")
    if (p["legato"] == "yes") != bool(ov):
        errors.append(f"{pid}: legato label {p['legato']} but {len(ov)} overlaps")


def decoder_payload() -> Dict:
    """Source lines for pattern 001, bar 1, read straight from patterns_part1.py."""
    path = SCRIPTS_DIR / "patterns_part1.py"
    source = path.read_text(encoding="utf-8")
    tree = ast.parse(source)
    for node in ast.walk(tree):
        if not isinstance(node, ast.Dict):
            continue
        keys = [k.value if isinstance(k, ast.Constant) else None for k in node.keys]
        if "id" not in keys:
            continue
        id_node = node.values[keys.index("id")]
        if not (isinstance(id_node, ast.Constant) and id_node.value == "001"):
            continue
        notes_node = node.values[keys.index("notes")]
        lines = []
        for call in notes_node.elts:
            segment = ast.get_source_segment(source, call)
            start, dur, pitch, vel = eval(compile(ast.Expression(call), str(path), "eval"), {"n": n})
            if start < TICKS_PER_BAR:
                lines.append({
                    "line": call.lineno,
                    "source": segment,
                    "startTick": start,
                    "durationTicks": dur,
                    "midi": pitch,
                    "velocity": vel,
                })
        src_lines = source.splitlines()
        comment = src_lines[lines[0]["line"] - 2].strip()
        return {
            "patternId": "001",
            "bar": 1,
            "file": "scripts/patterns_part1.py",
            "comment": comment,
            "helper": 'n(beat, dur_beats, note, velocity, shift_ticks=0, extra_ticks=0)',
            "lines": lines,
        }
    raise SystemExit("Pattern 001 not found for the decoder")


def generate_readme(stats: Dict) -> str:
    g = stats["groups"]
    group_lines = "\n".join(
        f"{i + 1}. **{name} (`{(i * 10) + 1:03d}`-`{(i + 1) * 10:03d}`)**: {desc} "
        f"Legato: {g[name]['legato']} of 10."
        for i, (name, _slug, desc) in enumerate(GROUPS)
    )
    return f"""# {PACK_NAME}: 50 Synthwave and Darkwave Lead MIDI Loops

Version {PACK_VERSION}. Fifty original, monophonic lead lines (`001`-`050`) for synthwave,
outrun, darkwave, coldwave, and dark cinematic work. Each loop is written to carry itself on
a dry mono synth: interval shape, rhythm, and rests do the work, not delay or reverb.

Live lab: {SITE_URL}
Source: {REPO_URL}

## What is in the ZIP

| Path | Contents |
| :--- | :--- |
| `midi/` | 50 Standard MIDI Files, one loop each |
| `midi_patterns_index.csv` | One row per pattern: tempo, key, scale, chords, Roman numerals, notes on sound |
| `midi_note_events.csv` | {stats['notes']:,} rows, one per note, in ticks and beats |
| `manifest.json` | Byte size and SHA-256 for every file above |
| `LICENSE-PATTERNS.md` | What you may do with the patterns |
| `README.md` | This file |

## Collection

{group_lines}

Loop lengths: {stats['bars_count'][2]} two-bar, {stats['bars_count'][4]} four-bar, and {stats['bars_count'][8]} eight-bar loops ({stats['total_bars']} bars in total).
Tempos are integers from {stats['bpm_min']} to {stats['bpm_max']} BPM.

## File conventions

- Standard MIDI File, Format 0, one track, MIDI channel 1 (channel `0` in zero-based tools).
- 480 ticks per quarter note. 4/4. One bar is 1,920 ticks; 2, 4, and 8 bars are 3,840, 7,680, and 15,360 ticks.
- Tick 0 holds the track name, the tempo (`round(60,000,000 / BPM)` microseconds per quarter note), and the 4/4 time signature.
- Timing is zero-based: tick 0 and beat 0.0 are bar 1, beat 1.
- Every note has an explicit Note On (`0x90`) and Note Off (`0x80`). When one note ends where another begins, the Note Off is written first.
- There is exactly one End of Track event, placed on the loop boundary. Some DAWs trim an imported clip to its last note; if yours does, set the clip to the length in `loop_length_bars`.
- No program changes, pitch bend, controllers, or aftertouch.
- Pitch names use C4 = MIDI 60 with sharps. The MIDI number is authoritative.
- Range: every note sits between {stats['min_name']} and {stats['max_name']}; {stats['primary_share']}% of notes are inside the primary range C4-C6 (MIDI 60-84).

## Legato

- {stats['legato_yes']} patterns are marked `legato: yes`. They contain {stats['overlap_total']} intentional overlaps of {stats['overlap_min']} to {stats['overlap_max']} ticks between adjacent notes of different pitch. The later note always starts after, and ends after, the earlier one; no more than two notes ever sound together, and nothing overlaps across the loop boundary.
- {stats['legato_no']} patterns are marked `legato: no` and never overlap.
- Overlaps do not glide by themselves. Put your synth in mono legato (fingered) mode and add 15-45 ms of portamento to hear them slide.

## Harmony and Roman numerals

Each pattern lists one reference chord per bar. The chords are context for writing a pad or bass; they are not in the MIDI files.

Roman numerals are measured from the **parallel major scale** of the tonal center:

- Lowercase is a minor triad, uppercase is major, `°` is diminished.
- A `b` prefix lowers that degree by a semitone.
- In use: `i` (tonic minor), `bII` (Neapolitan/Phrygian major), `ii°`, `bIII`, `iv`, `IV` (Dorian major subdominant), `v` (minor dominant), `V` (major dominant from harmonic minor), `bVI`, `bvii` (Phrygian minor subtonic), and `bVII`.

`borrowed_or_out_of_scale_chords` names any chord that leaves the stated scale. `out_of_scale_melody_notes` lists every melody pitch outside the tonal center plus scale, recomputed from the notes at build time.

## CSV columns

`midi_patterns_index.csv`: `pattern_id`, `pattern_name`, `collection_group`, `midi_filename`, `bpm`, `encoded_tempo_mpqn`, `tonal_center`, `scale`, `out_of_scale_melody_notes`, `loop_length_bars`, `loop_length_ticks`, `suggested_chord_symbols`, `roman_numerals`, `borrowed_or_out_of_scale_chords`, `motif_and_phrase_description`, `suggested_playback_sound`, `optional_performance_suggestion`, `intentional_legato_overlaps`.

`midi_note_events.csv`: `pattern_id`, `midi_note_number`, `note_name`, `start_tick`, `duration_ticks`, `start_beat`, `duration_beats`, `velocity`. Beats are quarter notes from zero (`ticks / 480`).

## Sound

Suggested sounds and performance ideas live in the index CSV only. Start with a dry, single-oscillator mono patch to judge a line, then add effects.

## How the files were checked

The builder refuses to write a pack if a chord does not match its Roman numeral, a note leaves the loop or the allowed range, or an overlap breaks the legato rules. Two parsers that share no code with the builder then re-read every file: `mido` (Python) and `@tonejs/midi` (Node). Their results, including the checks that ran and their stated limits, are published as `validation_report.json` in the repository and on the live lab. Musical quality was judged by reading the notes and harmony, and by listening in the lab's preview synth; the files were not auditioned inside commercial DAWs.
"""


def deterministic_zip(zip_path: Path, members: List[Tuple[str, Path]]) -> None:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for arcname, path in members:
            info = zipfile.ZipInfo(arcname, date_time=(2026, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            info.create_system = 3
            zf.writestr(info, path.read_bytes(), compresslevel=9)
    zip_path.write_bytes(buf.getvalue())


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def build(out_root: Path) -> Dict:
    """Write the pack into out_root and return the site payload."""
    out_root = Path(out_root)
    midi_dir = out_root / "midi"
    if midi_dir.exists():
        shutil.rmtree(midi_dir)
    midi_dir.mkdir(parents=True)

    patterns = all_patterns()
    errors: List[str] = []
    index_rows, note_rows, site_patterns = [], [], []

    for p in patterns:
        notes = sorted(p["notes"], key=lambda x: (x[0], x[2]))
        check_pattern(p, notes, errors)
        loop_ticks = p["bars"] * TICKS_PER_BAR
        mpqn = write_format0_midi(midi_dir / p["filename"], f"{p['id']} - {p['name']}", p["bpm"], loop_ticks, notes)
        oos = out_of_scale_text(p["tonal_center"], p["scale"], notes)

        index_rows.append({
            "pattern_id": p["id"],
            "pattern_name": p["name"],
            "collection_group": p["group"],
            "midi_filename": p["filename"],
            "bpm": p["bpm"],
            "encoded_tempo_mpqn": mpqn,
            "tonal_center": p["tonal_center"],
            "scale": p["scale"],
            "out_of_scale_melody_notes": oos,
            "loop_length_bars": p["bars"],
            "loop_length_ticks": loop_ticks,
            "suggested_chord_symbols": " | ".join(p["chords"]),
            "roman_numerals": " | ".join(p["romans"]),
            "borrowed_or_out_of_scale_chords": p["borrowed_chords"],
            "motif_and_phrase_description": p["motif_desc"],
            "suggested_playback_sound": p["sound_suggestion"],
            "optional_performance_suggestion": p["performance_suggestion"],
            "intentional_legato_overlaps": p["legato"],
        })
        for s, d, pitch, vel in notes:
            note_rows.append({
                "pattern_id": p["id"],
                "midi_note_number": pitch,
                "note_name": midi_to_name(pitch),
                "start_tick": s,
                "duration_ticks": d,
                "start_beat": format_beat(s),
                "duration_beats": format_beat(d),
                "velocity": vel,
            })

        metrics = melody_metrics(p, notes)
        pitches = [x[2] for x in notes]
        site_patterns.append({
            "id": p["id"],
            "name": p["name"],
            "group": p["group"],
            "groupSlug": GROUP_SLUG[p["group"]],
            "filename": p["filename"],
            "bpm": p["bpm"],
            "mpqn": mpqn,
            "tonalCenter": p["tonal_center"],
            "scale": p["scale"],
            "bars": p["bars"],
            "loopTicks": loop_ticks,
            "chords": p["chords"],
            "romans": p["romans"],
            "chordTones": [list(chord_pitch_classes(c)) for c in p["chords"]],
            "borrowedChords": p["borrowed_chords"],
            "outOfScaleNotes": oos,
            "outOfScalePitchClasses": sorted({x % 12 for x in pitches} - scale_pitch_classes(p["tonal_center"], p["scale"])),
            "motif": p["motif_desc"],
            "sound": p["sound_suggestion"],
            "performance": p["performance_suggestion"],
            "legato": p["legato"] == "yes",
            "patch": assign_patch(p["sound_suggestion"]),
            "noteCount": len(notes),
            "minPitch": min(pitches),
            "maxPitch": max(pitches),
            "range": f"{midi_to_name(min(pitches))}-{midi_to_name(max(pitches))}",
            "tags": derive_tags(p, metrics, min(pitches), max(pitches)),
            "metrics": metrics,
        })

    if errors:
        print("Build stopped:\n  " + "\n  ".join(errors), file=sys.stderr)
        raise SystemExit(1)

    index_csv = out_root / "midi_patterns_index.csv"
    with open(index_csv, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(index_rows[0].keys()), lineterminator="\n")
        w.writeheader()
        w.writerows(index_rows)
    notes_csv = out_root / "midi_note_events.csv"
    with open(notes_csv, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(note_rows[0].keys()), lineterminator="\n")
        w.writeheader()
        w.writerows(note_rows)

    all_notes = [(r["midi_note_number"]) for r in note_rows]
    ov_ticks = [t for sp in site_patterns for t in sp["metrics"]["overlapTicks"]]
    stats = {
        "patterns": len(site_patterns),
        "notes": len(note_rows),
        "total_bars": sum(sp["bars"] for sp in site_patterns),
        "bars_count": {b: sum(1 for sp in site_patterns if sp["bars"] == b) for b in (2, 4, 8)},
        "bpm_min": min(sp["bpm"] for sp in site_patterns),
        "bpm_max": max(sp["bpm"] for sp in site_patterns),
        "min_pitch": min(all_notes),
        "max_pitch": max(all_notes),
        "min_name": f"{midi_to_name(min(all_notes))} (MIDI {min(all_notes)})",
        "max_name": f"{midi_to_name(max(all_notes))} (MIDI {max(all_notes)})",
        "primary_share": round(100 * sum(1 for x in all_notes if 60 <= x <= 84) / len(all_notes), 1),
        "legato_yes": sum(1 for sp in site_patterns if sp["legato"]),
        "legato_no": sum(1 for sp in site_patterns if not sp["legato"]),
        "overlap_total": sum(sp["metrics"]["overlapCount"] for sp in site_patterns),
        "overlap_min": min(ov_ticks),
        "overlap_max": max(ov_ticks),
        "groups": {
            name: {
                "count": sum(1 for sp in site_patterns if sp["group"] == name),
                "legato": sum(1 for sp in site_patterns if sp["group"] == name and sp["legato"]),
            }
            for name, _s, _d in GROUPS
        },
    }

    readme = out_root / "README_MIDI_COLLECTION.md"
    readme.write_text(generate_readme(stats), encoding="utf-8")
    license_src = REPO_ROOT / "LICENSE-PATTERNS.md"
    license_out = out_root / "LICENSE-PATTERNS.md"
    if license_src.resolve() != license_out.resolve():
        shutil.copyfile(license_src, license_out)

    zip_members: List[Tuple[str, Path]] = [
        ("README.md", readme),
        ("LICENSE-PATTERNS.md", license_out),
        ("midi_patterns_index.csv", index_csv),
        ("midi_note_events.csv", notes_csv),
    ] + [(f"midi/{p['filename']}", midi_dir / p["filename"]) for p in patterns]

    manifest = {
        "pack": PACK_NAME,
        "version": PACK_VERSION,
        "conventions": {
            "format": "Standard MIDI File, Format 0, 1 track",
            "ppq": PPQ,
            "time_signature": "4/4",
            "channel": 1,
            "pitch_reference": "MIDI 60 = C4",
            "beats": "zero-based quarter notes",
        },
        "files": [
            {"path": arc, "bytes": path.stat().st_size, "sha256": sha256(path)}
            for arc, path in zip_members
        ],
    }
    manifest_path = out_root / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    zip_members.insert(4, ("manifest.json", manifest_path))
    deterministic_zip(out_root / ZIP_NAME, zip_members)

    hashes = {f["path"]: f["sha256"] for f in manifest["files"]}
    for sp in site_patterns:
        sp["sha256"] = hashes[f"midi/{sp['filename']}"]
        sp["bytes"] = (midi_dir / sp["filename"]).stat().st_size

    roman_usage: Dict[str, int] = {}
    for sp in site_patterns:
        for r in sp["romans"]:
            roman_usage[r] = roman_usage.get(r, 0) + 1

    return {
        "meta": {
            "pack": PACK_NAME,
            "version": PACK_VERSION,
            "zip": ZIP_NAME,
            "zipBytes": (out_root / ZIP_NAME).stat().st_size,
            "ppq": PPQ,
            "patterns": stats["patterns"],
            "notes": stats["notes"],
            "totalBars": stats["total_bars"],
            "barsCount": {str(k): v for k, v in stats["bars_count"].items()},
            "bpmMin": stats["bpm_min"],
            "bpmMax": stats["bpm_max"],
            "minPitch": stats["min_pitch"],
            "maxPitch": stats["max_pitch"],
            "primaryShare": stats["primary_share"],
            "legatoYes": stats["legato_yes"],
            "legatoNo": stats["legato_no"],
            "overlapTotal": stats["overlap_total"],
            "overlapMin": stats["overlap_min"],
            "overlapMax": stats["overlap_max"],
            "groups": [
                {"name": name, "slug": slug, "description": desc, **stats["groups"][name]}
                for name, slug, desc in GROUPS
            ],
            "romanUsage": dict(sorted(roman_usage.items(), key=lambda kv: -kv[1])),
            "patches": PATCHES,
        },
        "patterns": site_patterns,
    }


def main() -> None:
    payload = build(REPO_ROOT)
    public = REPO_ROOT / "public"
    pub_midi = public / "midi"
    pub_data = public / "data"
    if pub_midi.exists():
        shutil.rmtree(pub_midi)
    shutil.copytree(REPO_ROOT / "midi", pub_midi)
    pub_data.mkdir(parents=True, exist_ok=True)
    for name in ("midi_patterns_index.csv", "midi_note_events.csv", "manifest.json", "LICENSE-PATTERNS.md"):
        shutil.copyfile(REPO_ROOT / name, pub_data / name)
    shutil.copyfile(REPO_ROOT / "README_MIDI_COLLECTION.md", pub_data / "PACK-README.md")
    shutil.copyfile(REPO_ROOT / ZIP_NAME, public / ZIP_NAME)
    (pub_data / "patterns.json").write_text(json.dumps(payload, indent=1) + "\n", encoding="utf-8")
    (pub_data / "decoder.json").write_text(json.dumps(decoder_payload(), indent=1) + "\n", encoding="utf-8")
    m = payload["meta"]
    print(
        f"Built {m['patterns']} patterns, {m['notes']} notes, {m['totalBars']} bars, "
        f"legato {m['legatoYes']}/{m['legatoNo']}, overlaps {m['overlapTotal']} "
        f"({m['overlapMin']}-{m['overlapMax']} ticks), primary range {m['primaryShare']}%, "
        f"ZIP {m['zipBytes']} bytes"
    )


if __name__ == "__main__":
    main()
