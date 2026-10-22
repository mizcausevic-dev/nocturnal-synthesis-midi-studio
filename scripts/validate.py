#!/usr/bin/env python3
"""
Independent validation of the Nocturnal Synthesis pack with mido.

Re-reads every MIDI file with mido (no code shared with midi_core.py), compares
it with both CSVs, re-derives Roman numerals and out-of-scale notes from first
principles, checks duplicates, rebuilds the pack in a temp folder to prove the
build is deterministic, tests the ZIP, and writes validation_report.json.

Usage:
    pip install -r scripts/requirements.txt
    python3 scripts/validate.py
"""

from __future__ import annotations

import csv
import hashlib
import json
import platform
import sys
import tempfile
import zipfile
from datetime import datetime, timezone
from itertools import combinations
from pathlib import Path
from typing import Dict, List, Tuple

import mido
from importlib.metadata import version as pkg_version

REPO = Path(__file__).resolve().parent.parent
MIDI_DIR = REPO / "midi"
INDEX_CSV = REPO / "midi_patterns_index.csv"
NOTES_CSV = REPO / "midi_note_events.csv"
MANIFEST = REPO / "manifest.json"
ZIP_NAME = "synthwave_darkwave_50_midi_leads.zip"
REPORT_PATHS = [REPO / "validation_report.json", REPO / "public" / "data" / "validation_report.json"]

PPQ = 480
BAR = PPQ * 4
NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
LETTER = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
MAJOR_DEGREES = [0, 2, 4, 5, 7, 9, 11]
ROMAN_DIGITS = ["i", "ii", "iii", "iv", "v", "vi", "vii"]
SCALES = {
    "Natural Minor": "W H W W H W W",
    "Harmonic Minor": "W H W W H A H",
    "Dorian": "W H W W W H W",
    "Phrygian": "H W W W H W W",
}
GROUPS = ["Neon Hooks", "Midnight Sequences", "Cold Signals", "Haunted Melodies", "Cinematic Flight"]
NEAR_DUP_THRESHOLD = 0.85
PROHIBITED = {"program_change", "pitchwheel", "control_change", "aftertouch", "polytouch", "sysex"}

Note = Tuple[int, int, int, int]  # start, duration, pitch, velocity


def pitch_class(name: str) -> int:
    pc = LETTER[name[0]]
    for ch in name[1:]:
        pc += 1 if ch == "#" else -1 if ch == "b" else 0
    return pc % 12


def note_name(pitch: int) -> str:
    return f"{NAMES[pitch % 12]}{pitch // 12 - 1}"


def scale_pcs(tonic: str, scale: str) -> set:
    steps = {"H": 1, "W": 2, "A": 3}
    pc = pitch_class(tonic)
    out = {pc}
    for s in SCALES[scale].split()[:-1]:
        pc = (pc + steps[s]) % 12
        out.add(pc)
    return out


def roman_to_chord(roman: str, tonic: str) -> Tuple[int, str]:
    """Derive (root pitch class, quality) from the documented convention."""
    flat = roman.startswith("b")
    body = roman[1:] if flat else roman
    dim = body.endswith("°")
    body = body.rstrip("°")
    degree = ROMAN_DIGITS.index(body.lower())
    quality = "dim" if dim else ("m" if body.islower() else "maj")
    root = (pitch_class(tonic) + MAJOR_DEGREES[degree] - (1 if flat else 0)) % 12
    return root, quality


def chord_from_symbol(sym: str) -> Tuple[int, str]:
    if sym.endswith("dim"):
        return pitch_class(sym[:-3]), "dim"
    if sym.endswith("m"):
        return pitch_class(sym[:-1]), "m"
    return pitch_class(sym), "maj"


def triad(sym: str) -> set:
    root, q = chord_from_symbol(sym)
    third = 3 if q in ("m", "dim") else 4
    fifth = 6 if q == "dim" else 7
    return {root, (root + third) % 12, (root + fifth) % 12}


def read_midi(path: Path) -> Dict:
    mf = mido.MidiFile(str(path))
    info: Dict = {"type": mf.type, "tracks": len(mf.tracks), "ppq": mf.ticks_per_beat, "problems": []}
    tick = 0
    open_notes: Dict[int, Tuple[int, int]] = {}
    notes: List[Note] = []
    metas: Dict[str, List] = {"track_name": [], "set_tempo": [], "time_signature": [], "end_of_track": []}
    channels = set()
    prohibited = []
    last_kind_at_tick: Dict[int, str] = {}
    msgs = list(mf.tracks[0]) if mf.tracks else []
    for idx, msg in enumerate(msgs):
        tick += msg.time
        if msg.type in metas:
            metas[msg.type].append((tick, msg, idx))
        if msg.type in PROHIBITED:
            prohibited.append(msg.type)
        if hasattr(msg, "channel"):
            channels.add(msg.channel)
        if msg.type == "note_on" and msg.velocity == 0:
            info["problems"].append(f"note_on with velocity 0 at tick {tick} (implicit note-off)")
        elif msg.type == "note_on":
            if msg.note in open_notes:
                info["problems"].append(f"pitch {msg.note} re-triggered at tick {tick} while sounding")
            open_notes[msg.note] = (tick, msg.velocity)
            last_kind_at_tick[tick] = "on"
        elif msg.type == "note_off":
            if last_kind_at_tick.get(tick) == "on":
                info["problems"].append(f"note-off after note-on at shared tick {tick}")
            if msg.note not in open_notes:
                info["problems"].append(f"note-off for silent pitch {msg.note} at tick {tick}")
                continue
            start, vel = open_notes.pop(msg.note)
            notes.append((start, tick - start, msg.note, vel))
    if open_notes:
        info["problems"].append(f"notes never closed: {sorted(open_notes)}")
    notes.sort(key=lambda x: (x[0], x[2]))
    info.update(notes=notes, metas=metas, channels=channels, prohibited=prohibited, last_index=len(msgs) - 1)
    return info


def jaccard(a: set, b: set) -> float:
    return len(a & b) / len(a | b) if a | b else 1.0


def tile(notes: List[Note], loop: int, target: int) -> List[Note]:
    out = []
    for k in range(target // loop):
        out += [(s + k * loop, d, p, v) for (s, d, p, v) in notes]
    return out


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    checks: List[Dict] = []

    def check(cid: str, title: str, problems: List[str], detail: str) -> None:
        checks.append({
            "id": cid,
            "title": title,
            "passed": not problems,
            "detail": detail,
            "problems": problems[:20],
            "problem_count": len(problems),
        })

    index = list(csv.DictReader(open(INDEX_CSV, encoding="utf-8")))
    note_rows = list(csv.DictReader(open(NOTES_CSV, encoding="utf-8")))
    rows_by_id: Dict[str, List[Dict]] = {}
    for r in note_rows:
        rows_by_id.setdefault(r["pattern_id"], []).append(r)
    by_id = {r["pattern_id"]: r for r in index}
    files = sorted(MIDI_DIR.glob("*.mid"))

    # 1. Files and IDs
    probs = []
    expected_ids = [f"{i:03d}" for i in range(1, 51)]
    if [r["pattern_id"] for r in index] != expected_ids:
        probs.append("index CSV IDs are not 001-050 in order")
    if sorted(rows_by_id) != expected_ids:
        probs.append("note-event CSV IDs are not exactly 001-050")
    if sorted(f.name for f in files) != sorted(r["midi_filename"] for r in index):
        probs.append("MIDI filenames on disk do not match the index CSV")
    for f in files:
        if not f.name.startswith(by_id.get(f.name[:3], {}).get("pattern_id", "???")):
            probs.append(f"{f.name}: filename does not start with its pattern ID")
    check("files", "Exactly 50 MIDI files with matching IDs across files and both CSVs", probs,
          f"{len(files)} files, {len(index)} index rows, {len(note_rows)} note-event rows")

    # 2. Parse
    parsed: Dict[str, Dict] = {}
    probs = []
    for r in index:
        try:
            info = read_midi(MIDI_DIR / r["midi_filename"])
        except Exception as exc:  # noqa: BLE001
            probs.append(f"{r['pattern_id']}: mido failed: {exc}")
            continue
        parsed[r["pattern_id"]] = info
        if info["type"] != 0 or info["tracks"] != 1 or info["ppq"] != PPQ:
            probs.append(f"{r['pattern_id']}: type {info['type']}, {info['tracks']} tracks, {info['ppq']} PPQ")
    check("parse", "Every file parses with mido as Format 0, one track, 480 PPQ", probs,
          f"{len(parsed)}/50 parsed with mido {pkg_version('mido')}")

    # 3. Meta
    probs = []
    for pid, info in parsed.items():
        r = by_id[pid]
        m = info["metas"]
        bpm = int(r["bpm"])
        if not (85 <= bpm <= 130):
            probs.append(f"{pid}: BPM {bpm} outside 85-130")
        for kind in ("track_name", "set_tempo", "time_signature"):
            if len(m[kind]) != 1 or m[kind][0][0] != 0:
                probs.append(f"{pid}: expected one {kind} at tick 0, found {[(t, i) for t, _m, i in m[kind]]}")
        if m["track_name"] and m["track_name"][0][1].name != f"{pid} - {r['pattern_name']}":
            probs.append(f"{pid}: track name '{m['track_name'][0][1].name}'")
        if m["set_tempo"]:
            tempo = m["set_tempo"][0][1].tempo
            if tempo != round(60_000_000 / bpm) or tempo != int(r["encoded_tempo_mpqn"]):
                probs.append(f"{pid}: tempo {tempo} us/qn does not encode {bpm} BPM")
            if abs(mido.tempo2bpm(tempo) - bpm) > 0.01:
                probs.append(f"{pid}: tempo reads back as {mido.tempo2bpm(tempo):.4f} BPM")
        if m["time_signature"]:
            ts = m["time_signature"][0][1]
            if (ts.numerator, ts.denominator, ts.clocks_per_click, ts.notated_32nd_notes_per_beat) != (4, 4, 24, 8):
                probs.append(f"{pid}: time signature {ts}")
    check("meta", "Track name, tempo, and 4/4 time signature at tick 0; integer BPM 85-130", probs,
          "tempo compared within 0.01 BPM after microsecond rounding")

    # 4. Channel and prohibited messages
    probs = []
    for pid, info in parsed.items():
        if info["channels"] != {0}:
            probs.append(f"{pid}: channels {sorted(info['channels'])}")
        if info["prohibited"]:
            probs.append(f"{pid}: {sorted(set(info['prohibited']))}")
    check("channel", "Channel 1 only; no program change, pitch bend, CC, aftertouch, or SysEx", probs,
          "every channel message is an explicit note-on or note-off on channel 1")

    # 5. Pairing
    probs = [f"{pid}: {p}" for pid, info in parsed.items() for p in info["problems"]]
    check("pairing", "Explicit note-offs; every note-on paired; note-offs first on shared ticks", probs,
          "note-on/off pairing re-done from the raw message stream, independent of the builder")

    # 6. End of track
    probs = []
    for pid, info in parsed.items():
        r = by_id[pid]
        bars, loop = int(r["loop_length_bars"]), int(r["loop_length_ticks"])
        eots = info["metas"]["end_of_track"]
        if bars not in (2, 4, 8) or loop != bars * BAR:
            probs.append(f"{pid}: {bars} bars / {loop} ticks")
        if len(eots) != 1 or eots[0][0] != loop or eots[0][2] != info["last_index"]:
            probs.append(f"{pid}: end-of-track {[(t, i) for t, _m, i in eots]} vs loop {loop}")
        late = [n for n in info["notes"] if n[0] + n[1] > loop]
        if late:
            probs.append(f"{pid}: {len(late)} notes cross the loop boundary")
    check("eot", "One end-of-track event, last in the file, exactly on the 2, 4, or 8-bar loop boundary", probs,
          "no note crosses the boundary")

    # 7. Ranges
    probs = []
    all_pitches = []
    for pid, info in parsed.items():
        loop = int(by_id[pid]["loop_length_ticks"])
        for s, d, p, v in info["notes"]:
            all_pitches.append(p)
            if not (55 <= p <= 96):
                probs.append(f"{pid}: pitch {p}")
            if not (1 <= v <= 127):
                probs.append(f"{pid}: velocity {v}")
            if d <= 0 or s < 0 or s >= loop:
                probs.append(f"{pid}: note at {s} for {d}")
    share = sum(1 for p in all_pitches if 60 <= p <= 84) / len(all_pitches)
    if share < 0.9:
        probs.append(f"only {share:.1%} of notes inside 60-84")
    check("ranges", "Pitches 55-96, at least 90% in C4-C6 (60-84), velocities 1-127, notes inside the loop", probs,
          f"{len(all_pitches)} notes, {note_name(min(all_pitches))}-{note_name(max(all_pitches))}, "
          f"{share:.1%} in the primary range")

    # 8. Legato
    probs = []
    overlap_total, legato_yes = 0, 0
    for pid, info in parsed.items():
        notes = info["notes"]
        found = 0
        for i in range(len(notes)):
            s1, d1, p1, _ = notes[i]
            sounding = 1
            for j in range(i + 1, len(notes)):
                s2, d2, p2, _ = notes[j]
                if s2 >= s1 + d1:
                    break
                found += 1
                sounding += 1
                ov = s1 + d1 - s2
                if j != i + 1:
                    probs.append(f"{pid}: notes {i} and {j} overlap but are not adjacent")
                if p1 == p2:
                    probs.append(f"{pid}: same pitch {p1} overlaps at {s2}")
                if not (s2 > s1 and s2 + d2 > s1 + d1):
                    probs.append(f"{pid}: note {j} does not start and end after note {i}")
                if not (1 <= ov <= 60):
                    probs.append(f"{pid}: overlap {ov} ticks")
            if sounding > 2:
                probs.append(f"{pid}: {sounding} notes sound at tick {s1}")
        label = by_id[pid]["intentional_legato_overlaps"]
        legato_yes += label == "yes"
        overlap_total += found
        if (label == "yes") != (found > 0):
            probs.append(f"{pid}: labeled legato={label} with {found} overlaps")
    check("legato", "Overlaps only in legato-labeled patterns: adjacent, different pitches, 1-60 ticks, max 2 voices",
          probs, f"{legato_yes} legato patterns, {overlap_total} intentional overlaps, "
                 f"{50 - legato_yes} patterns with none")

    # 9. CSV match
    probs = []
    for pid, info in parsed.items():
        rows = rows_by_id.get(pid, [])
        r = by_id[pid]
        if len(rows) != len(info["notes"]):
            probs.append(f"{pid}: {len(info['notes'])} notes in MIDI, {len(rows)} in CSV")
            continue
        for (s, d, p, v), row in zip(info["notes"], rows):
            if (int(row["start_tick"]), int(row["duration_ticks"]), int(row["midi_note_number"]), int(row["velocity"])) != (s, d, p, v):
                probs.append(f"{pid}: {(s, d, p, v)} vs CSV {row}")
            if row["note_name"] != note_name(p):
                probs.append(f"{pid}: name {row['note_name']} for MIDI {p}")
            if abs(float(row["start_beat"]) - s / PPQ) > 1e-4 or abs(float(row["duration_beats"]) - d / PPQ) > 1e-4:
                probs.append(f"{pid}: beats {row['start_beat']}/{row['duration_beats']} vs ticks {s}/{d}")
        if not r["midi_filename"].startswith(pid):
            probs.append(f"{pid}: filename {r['midi_filename']}")
    check("csv", "Note-event and index CSVs match the parsed MIDI exactly", probs,
          "pitch, start tick, duration, velocity, note names (MIDI 60 = C4), and beats = ticks / 480")

    # 10. Roman numerals
    probs = []
    bars_total = 0
    for r in index:
        chords = [c.strip() for c in r["suggested_chord_symbols"].split("|")]
        romans = [x.strip() for x in r["roman_numerals"].split("|")]
        bars = int(r["loop_length_bars"])
        bars_total += bars
        if len(chords) != bars or len(romans) != bars:
            probs.append(f"{r['pattern_id']}: {bars} bars, {len(chords)} chords, {len(romans)} numerals")
        for b, (c, rn) in enumerate(zip(chords, romans)):
            try:
                if roman_to_chord(rn, r["tonal_center"]) != chord_from_symbol(c):
                    probs.append(f"{r['pattern_id']} bar {b + 1}: {c} is not {rn} in {r['tonal_center']}")
            except ValueError:
                probs.append(f"{r['pattern_id']} bar {b + 1}: cannot read numeral {rn}")
    check("romans", "One chord per bar, and every Roman numeral matches its chord under the documented convention",
          probs, f"{bars_total} bars; numerals re-derived from the parallel-major convention, not from a lookup table")

    # 11. Out-of-scale notes
    probs = []
    oos_total = 0
    for pid, info in parsed.items():
        r = by_id[pid]
        allowed = scale_pcs(r["tonal_center"], r["scale"])
        outside = sorted({p for (_s, _d, p, _v) in info["notes"] if p % 12 not in allowed})
        oos_total += sum(1 for n in info["notes"] if n[2] % 12 not in allowed)
        text = ", ".join(f"{note_name(p)} (MIDI {p})" for p in outside) or "none"
        if text != r["out_of_scale_melody_notes"]:
            probs.append(f"{pid}: CSV says '{r['out_of_scale_melody_notes']}', recomputed '{text}'")
    check("scale", "Every out-of-scale melody note is listed in the index CSV", probs,
          f"{oos_total} out-of-scale note events, recomputed from tonal center + scale step patterns")

    # 12. Harmony proxy
    probs = []
    lowest = (2.0, "")
    for pid, info in parsed.items():
        r = by_id[pid]
        chords = [c.strip() for c in r["suggested_chord_symbols"].split("|")]
        total = sum(d for _s, d, _p, _v in info["notes"])
        on = sum(d for s, d, p, _v in info["notes"] if p % 12 in triad(chords[min(len(chords) - 1, s // BAR)]))
        ratio = on / total
        lowest = min(lowest, (ratio, pid))
        if ratio < 0.5:
            probs.append(f"{pid}: only {ratio:.0%} of sounding time on chord tones")
    check("harmony", "Proxy: every pattern spends at least half its sounding time on tones of its reference chords",
          probs, f"lowest is {lowest[1]} at {lowest[0]:.0%}; this is a proxy, not a listening test")

    # 13. Exact and transposed duplicates
    probs = []
    rhythm_twins = 0
    ids = sorted(parsed)
    for a, b in combinations(ids, 2):
        na, nb = parsed[a]["notes"], parsed[b]["notes"]
        if [(s, d, p) for s, d, p, _ in na] == [(s, d, p) for s, d, p, _ in nb]:
            probs.append(f"{a}/{b}: identical pitches and rhythm")
        if [(s, d) for s, d, _p, _v in na] == [(s, d) for s, d, _p, _v in nb]:
            rhythm_twins += 1
            offsets = {x[2] - y[2] for x, y in zip(na, nb)}
            if len(offsets) == 1:
                probs.append(f"{a}/{b}: transposition by {offsets.pop()} semitones")
    check("duplicates", "No exact, transposed, re-velocitied, or re-tempoed duplicates", probs,
          f"1,225 pairs compared ignoring velocity and tempo; rhythm-and-duration twins: {rhythm_twins}")

    # 14. Near duplicates
    probs = []
    closest_pc, closest_iv, closest_on = (0.0, ""), (0.0, ""), (0.0, "")
    contour_twins = []
    for a, b in combinations(ids, 2):
        la, lb = int(by_id[a]["loop_length_ticks"]), int(by_id[b]["loop_length_ticks"])
        span = max(la, lb)
        na, nb = tile(parsed[a]["notes"], la, span), tile(parsed[b]["notes"], lb, span)
        tok_pc_a = {(s, p % 12) for s, _d, p, _v in na}
        tok_pc_b = {(s, p % 12) for s, _d, p, _v in nb}
        tok_iv_a = {(na[i][0], na[i][2] - na[i - 1][2]) for i in range(1, len(na))}
        tok_iv_b = {(nb[i][0], nb[i][2] - nb[i - 1][2]) for i in range(1, len(nb))}
        on_a, on_b = {s for s, *_ in na}, {s for s, *_ in nb}
        j_pc, j_iv, j_on = jaccard(tok_pc_a, tok_pc_b), jaccard(tok_iv_a, tok_iv_b), jaccard(on_a, on_b)
        closest_pc = max(closest_pc, (j_pc, f"{a}/{b}"))
        closest_iv = max(closest_iv, (j_iv, f"{a}/{b}"))
        closest_on = max(closest_on, (j_on, f"{a}/{b}"))
        if j_pc >= NEAR_DUP_THRESHOLD:
            probs.append(f"{a}/{b}: onset+pitch-class Jaccard {j_pc:.2f}")
        if j_iv >= NEAR_DUP_THRESHOLD:
            probs.append(f"{a}/{b}: onset+interval Jaccard {j_iv:.2f} (transposition-invariant)")
        pa, pb = [x[2] for x in parsed[a]["notes"]], [x[2] for x in parsed[b]["notes"]]
        ia = [y - x for x, y in zip(pa, pa[1:])][:6]
        ib = [y - x for x, y in zip(pb, pb[1:])][:6]
        if len(ia) == 6 and ia == ib:
            contour_twins.append(f"{a}/{b}")
    probs += [f"{t}: identical first six intervals" for t in contour_twins]
    check("near", "No near-duplicates by onset, pitch-class, or interval similarity", probs,
          f"closest onset+pitch-class {closest_pc[1]} Jaccard {closest_pc[0]:.2f}; closest onset+interval "
          f"{closest_iv[1]} {closest_iv[0]:.2f}; closest onset grids {closest_on[1]} {closest_on[0]:.2f}; "
          f"fail threshold {NEAR_DUP_THRESHOLD}")

    # 15. Shorter-loop repetition
    probs = []
    for pid in ids:
        loop = int(by_id[pid]["loop_length_ticks"])
        notes = [(s, d, p) for s, d, p, _ in parsed[pid]["notes"]]
        half = loop // 2
        first = [(s, d, p) for s, d, p in notes if s < half]
        second = [(s - half, d, p) for s, d, p in notes if s >= half]
        if first == second:
            probs.append(f"{pid}: second half repeats the first half")
        if first and second and len(first) == len(second):
            if [(s, d) for s, d, _ in first] == [(s, d) for s, d, _ in second]:
                shifts = {x[2] - y[2] for x, y in zip(first, second)}
                if len(shifts) == 1:
                    probs.append(f"{pid}: second half is the first half transposed")
    for a, b in combinations(ids, 2):
        la, lb = int(by_id[a]["loop_length_ticks"]), int(by_id[b]["loop_length_ticks"])
        if la == lb:
            continue
        short, long_ = (a, b) if la < lb else (b, a)
        ls, ll = min(la, lb), max(la, lb)
        if [(s, d, p) for s, d, p, _ in tile(parsed[short]["notes"], ls, ll)] == \
           [(s, d, p) for s, d, p, _ in parsed[long_]["notes"]]:
            probs.append(f"{long_} is {short} repeated")
    check("subloop", "No pattern is a shorter loop repeated unchanged, inside itself or across the pack", probs,
          "halves compared for exact and transposed repeats; every longer loop compared with every shorter one tiled")

    # 16. Structure
    probs = []
    for gi, g in enumerate(GROUPS):
        members = [r["pattern_id"] for r in index if r["collection_group"] == g]
        if members != [f"{gi * 10 + k:03d}" for k in range(1, 11)]:
            probs.append(f"{g}: {members}")
    bars_count = {b: sum(1 for r in index if int(r["loop_length_bars"]) == b) for b in (2, 4, 8)}
    if not all(bars_count.values()):
        probs.append(f"loop lengths {bars_count}")
    check("structure", "Five groups of ten in ID order; 2, 4, and 8-bar loops all present", probs,
          f"groups {', '.join(f'{g} 10' for g in GROUPS)}; bars 2-bar {bars_count[2]}, 4-bar {bars_count[4]}, "
          f"8-bar {bars_count[8]}")

    # 17. Determinism and manifest
    probs = []
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    for entry in manifest["files"]:
        src = REPO / ("README_MIDI_COLLECTION.md" if entry["path"] == "README.md" else entry["path"])
        if sha256(src) != entry["sha256"] or src.stat().st_size != entry["bytes"]:
            probs.append(f"manifest hash mismatch for {entry['path']}")
    sys.path.insert(0, str(REPO / "scripts"))
    import build_pack  # noqa: E402

    compared = 0
    with tempfile.TemporaryDirectory() as tmp:
        build_pack.build(Path(tmp))
        rebuilt = sorted(p.relative_to(tmp) for p in Path(tmp).rglob("*") if p.is_file())
        for rel in rebuilt:
            compared += 1
            if sha256(Path(tmp) / rel) != sha256(REPO / rel):
                probs.append(f"{rel} differs on rebuild")
    check("determinism", "A clean rebuild is byte-identical, and every SHA-256 in manifest.json matches", probs,
          f"{compared} files rebuilt in a temp folder and hashed, ZIP included; "
          f"{len(manifest['files'])} manifest entries verified")

    # 18. ZIP
    probs = []
    zpath = REPO / ZIP_NAME
    with zipfile.ZipFile(zpath) as zf:
        bad = zf.testzip()
        if bad:
            probs.append(f"CRC failure in {bad}")
        names = zf.namelist()
        expected = ["README.md", "LICENSE-PATTERNS.md", "midi_patterns_index.csv", "midi_note_events.csv",
                    "manifest.json"] + [f"midi/{r['midi_filename']}" for r in index]
        if names != expected:
            probs.append("ZIP member list differs from the expected 55 entries")
        for name in names:
            src = REPO / ("README_MIDI_COLLECTION.md" if name == "README.md" else name)
            if zf.read(name) != src.read_bytes():
                probs.append(f"{name} in the ZIP differs from the validated file")
    if (REPO / "public" / ZIP_NAME).read_bytes() != zpath.read_bytes():
        probs.append("public ZIP differs from the validated ZIP")
    for f in files:
        if (REPO / "public" / "midi" / f.name).read_bytes() != f.read_bytes():
            probs.append(f"public/midi/{f.name} differs from midi/{f.name}")
    check("zip", "ZIP passes its CRC test and every member is byte-identical to the validated files", probs,
          f"{ZIP_NAME}, {len(names)} members, {zpath.stat().st_size:,} bytes; the site serves the same bytes")

    report = {
        "pack": manifest["pack"],
        "version": manifest["version"],
        "generated_utc": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        "generator": "scripts/validate.py",
        "tools": {"python": platform.python_version(), "mido": pkg_version("mido")},
        "summary": {
            "files": len(files),
            "notes": len(note_rows),
            "checks_total": len(checks),
            "checks_passed": sum(c["passed"] for c in checks),
            "failed": sum(not c["passed"] for c in checks),
            "parsers": ["mido"],
        },
        "checks": checks,
        "second_parser": None,
        "limitations": [
            "Musical quality, memorability, and how a line sits in a mix are judgments. The chord-tone share is a proxy, not a listening test.",
            "Glide on legato overlaps depends on the receiving synth's mono legato mode and portamento; it cannot be verified from MIDI.",
            "The files were not imported into commercial DAWs in this environment. They were parsed with mido and @tonejs/midi.",
            "The browser preview synth is a sketch of each suggested sound, not the suggested patch itself.",
            "Near-duplicate detection compares onset, pitch-class, and interval token sets; it cannot judge perceived similarity.",
        ],
        "reproduce": [
            "python3 scripts/build_pack.py          # stdlib only, writes midi/, CSVs, manifest, ZIP",
            "pip install -r scripts/requirements.txt  # mido 1.3.3",
            "python3 scripts/validate.py            # mido checks, writes validation_report.json",
            "npm ci && node scripts/validate-tonejs.mjs  # second parser",
        ],
    }
    for path in REPORT_PATHS:
        path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    for c in checks:
        mark = "PASS" if c["passed"] else "FAIL"
        print(f"[{mark}] {c['title']}\n       {c['detail']}")
        for p in c["problems"][:5]:
            print(f"       - {p}")
    s = report["summary"]
    print(f"\n{s['checks_passed']}/{s['checks_total']} mido checks passed")
    if s["failed"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
