# Nocturnal Synthesis: 50 Production-Ready Synthwave & Darkwave Lead MIDI Patterns

A curated, hand-crafted collection of **50 original monophonic/legato lead synthesizer MIDI compositions** (`001`–`050`) engineered for **Synthwave**, **Outrun**, **Darkwave**, **Coldwave**, and **Cyberpunk Soundtrack** production. Every phrase is written to stand on its own with a plain, dry mono synth patch—relying on memorable intervallic hooks, rhythmic syncopation, deliberate breathing space, and harmonic tension rather than delay or reverb tails.

---

## 1. Collection Architecture (5 Groups × 10 Patterns)

1. **Neon Hooks (`001`–`010`)** — Immediate, memorable motifs with clear rhythmic identities, octave leaps, and purposeful repetition.
2. **Midnight Sequences (`011`–`020`)** — Pulsing melodic figures, compound-melody upper-pedal lines, arpeggio-inspired movement, and evolving rhythms kept strictly in the foreground lead role.
3. **Cold Signals (`021`–`030`)** — Minimal, angular phrases with clipped staccato articulation, unsettling Phrygian/diminished/tritone intervals, and deliberate multi-beat silence.
4. **Haunted Melodies (`031`–`040`)** — Expressive minor-key themes, weeping descending figures, sustained notes, modal mixture, and bittersweet resolutions.
5. **Cinematic Flight (`041`–`050`)** — Soaring widescreen phrases, wider sixth/octave/tenth interval movement, rising tension, and energetic 4-bar and 8-bar melodic development.

---

## 2. Timing, Pitch, and Loop Conventions

- **MIDI File Format:** Standard MIDI File (SMF) **Format 0** (single integrated track per `.mid` file).
- **MIDI Channel:** Channel **1** (`0` in zero-indexed MIDI libraries) for every note event.
- **Timing Resolution (PPQ):** **480 ticks per quarter note**.
- **Time Signature:** **4/4** (`FF 58 04 04 02 18 08` at tick `0`).
- **Zero-Based Timing:** Tick `0` and beat `0.0` mark the downbeat of Bar 1, Beat 1.
- **Declared Loop Lengths in 4/4:**
  - **2 bars** = `8.0` quarter-note beats = **`3,840` ticks**
  - **4 bars** = `16.0` quarter-note beats = **`7,680` ticks**
  - **8 bars** = `32.0` quarter-note beats = **`15,360` ticks**
- **DAW Loop Boundary Note:** Every MIDI file places its single `End of Track` (`FF 2F 00`) meta event at the exact declared loop boundary (`3,840`, `7,680`, or `15,360` ticks), immediately after any `Note-Off` events at that tick. Because some DAWs trim imported clips to the last note-off or do not automatically enable loop brace lengths on import, consult the `loop_length_bars` and `loop_length_ticks` columns in `midi_patterns_index.csv` and set your DAW clip length to **2, 4, or 8 bars** accordingly.
- **Event Ordering at Identical Ticks:** Every note uses an explicit `Note-On` (`0x90`, velocity `1`–`127`) and explicit `Note-Off` (`0x80`, velocity `0`). Whenever a note ends at the exact tick another note begins, the binary stream writes the `Note-Off` event **before** the `Note-On` event so zero-overlap patterns never trigger unintended mono-synth retrigger glitches.
- **Pitch Reference:** Authoritative pitches are stored as **MIDI note numbers**. Human-readable note names follow the **C4 = MIDI note 60** convention (using sharp accidentals `C`, `C#`, `D`, `D#`, `E`, `F`, `F#`, `G`, `G#`, `A`, `A#`, `B` for deterministic note-event naming).
- **Register Discipline:** Primary melodic activity stays within **MIDI 60–84 (`C4`–`C6`)**, with selective low-register darkwave anchors down to **`G3` (MIDI 55)** and high cinematic peaks up to **`F#6` (MIDI 90)**—strictly inside the permitted `55`–`96` boundary.
- **Tempo Encoding:** Each pattern specifies an integer BPM (`85`–`130` BPM) encoded at tick `0` via the Set Tempo meta message (`FF 51 03`) as the nearest integer microseconds per quarter note (`round(60,000,000 / BPM)`).

---

## 3. Roman-Numeral & Harmonic Context Convention

Each pattern provides a **reference chord progression** (one chord per bar, held conceptually for that bar) in `midi_patterns_index.csv`. Chord notes are **never** written into the MIDI files.

- **Case & Chord Quality:**
  - **Lowercase** Roman numerals denote **minor** triads (`i`, `ii`, `iii`, `iv`, `v`, `vii`).
  - **Uppercase** Roman numerals denote **major** triads (`I`, `bII`, `bIII`, `IV`, `V`, `bVI`, `bVII`).
  - **Degree symbol (`°`)** denotes a **diminished** triad (`ii°`, `vi°`, `vii°`).
- **Scale-Degree Prefixes:**
  - Accidentals in Roman numerals are measured **relative to the parallel major scale of the stated tonic**:
    - `i` = tonic minor triad (`0` semitones above tonic)
    - `bII` = Neapolitan / Phrygian flat-second major triad (`+1` semitone)
    - `ii°` = supertonic diminished triad (`+2` semitones)
    - `bIII` = mediant major triad (`+3` semitones)
    - `iv` = subdominant minor triad (`+5` semitones)
    - `IV` = Dorian subdominant major triad (`+5` semitones, featuring the raised 6th scale degree)
    - `v` = natural-minor dominant minor triad (`+7` semitones)
    - `V` = harmonic-minor dominant major triad (`+7` semitones, featuring the raised 7th leading tone)
    - `bVI` = submediant major triad (`+8` semitones)
    - `vii` = Phrygian subtonic minor triad (`+10` semitones)
    - `bVII` = subtonic major triad (`+10` semitones)
- **Borrowed vs. Native Chords:**
  - `borrowed_or_out_of_scale_chords` explicitly documents any chord whose triad tones step outside the pattern's primary stated scale (for example, a `V` major chord borrowed from harmonic minor inside a Natural Minor pattern, or a `bVI` chord borrowed from natural minor inside a Dorian pattern).
  - `out_of_scale_melody_notes` separately lists every melody note in the MIDI file whose pitch class lies outside the stated tonic + scale (such as harmonic-minor leading tones `G#5`, `C#5`, `F#5`, `E5`, `A#5`, `B#4/C5`, `F##5/G5`, modal-mixture `b6` tones, or chromatic tritone inflections).

---

## 4. Suggested Instrument Setup & Legato Rules

- **Dry Patch First:** Audition patterns with an unadorned monophonic analog or virtual-analog synthesizer (single or dual sawtooth, pulse/square, or triangle oscillator, zero delay/reverb) to hear how rhythm, contour, and silence carry the phrase.
- **No Embedded Controllers:** All 50 MIDI files omit `Program Change`, `Pitch Bend`, `Control Change` (CC1/CC64/etc.), and `Aftertouch`. Sound-design and performance treatments are documented strictly in the CSV metadata.
- **Legato Overlaps (`legato: yes` vs. `legato: no`):**
  - **21 patterns** are strictly non-overlapping (`legato: no`), with every note ending before or at the onset of the next note.
  - **29 patterns** include deliberate legato transitions (`legato: yes`) where selected adjacent notes of **different pitches** overlap by **25 to 45 ticks** (`> 0` and `<= 60` ticks).
  - In every overlap, the second note starts strictly after the first note starts and ends strictly after the first note ends, with at most **2 notes sounding simultaneously** and **zero overlaps across the loop boundary**.
  - **Important Hardware/Plugin Note:** Overlapping MIDI notes do **not** automatically produce pitch glide on every instrument. To hear single-envelope legato or portamento slide on `legato: yes` patterns, set your synth to **Mono / Fingered Legato** mode and dial in `15 ms`–`45 ms` of portamento time.

---

## 5. How to Interpret the CSV Deliverables

### `midi_patterns_index.csv` (50 rows + header)
| Column | Description |
| :--- | :--- |
| `pattern_id` | Three-digit identifier (`001`–`050`). |
| `pattern_name` | Composition title. |
| `collection_group` | One of the 5 creative groups (10 patterns each). |
| `midi_filename` | Exact `.mid` filename inside `midi/`. |
| `bpm` | Declared integer tempo (`85`–`130` BPM). |
| `encoded_tempo_mpqn` | Integer microseconds per quarter note encoded in the MIDI header (`round(60000000 / bpm)`). |
| `tonal_center` | Tonic pitch class (`A`, `B`, `C`, `C#`, `D`, `E`, `F`, `F#`, `G`, `G#`). |
| `scale` | Primary modal/tonal framework (`Natural Minor`, `Harmonic Minor`, `Dorian`, `Phrygian`). |
| `out_of_scale_melody_notes` | Exact MIDI notes in the melody outside `tonal_center + scale`, or `none`. |
| `loop_length_bars` | Loop length in bars (`2`, `4`, or `8`). |
| `loop_length_ticks` | Loop length in ticks (`3840`, `7680`, or `15360`). |
| `suggested_chord_symbols` | Bar-by-bar chord progression (`|`-separated, one entry per bar). |
| `roman_numerals` | Corresponding Roman numerals (`|`-separated, one entry per bar). |
| `borrowed_or_out_of_scale_chords` | Explanation of borrowed chords relative to the stated scale, or `none`. |
| `motif_and_phrase_description` | Structural analysis of the hook, rhythmic identity, and phrase development. |
| `suggested_playback_sound` | Concise dry synth patch recommendation. |
| `optional_performance_suggestion` | Optional expressive routing (vibrato, portamento, filter modulation), or `none`. |
| `intentional_legato_overlaps` | `yes` if adjacent-note 1..60 tick overlaps are present; `no` if strictly non-overlapping. |

### `midi_note_events.csv` (1024 rows + header)
| Column | Description |
| :--- | :--- |
| `pattern_id` | Matching pattern ID (`001`–`050`). |
| `midi_note_number` | Authoritative MIDI pitch (`55`–`96`). |
| `note_name` | Readable pitch name where `C4 = 60`. |
| `start_tick` | Zero-based authoritative start position in integer ticks (`480` PPQ). |
| `duration_ticks` | Authoritative positive integer duration in ticks. |
| `start_beat` | Zero-based start time in quarter-note beats (`start_tick / 480`). |
| `duration_beats` | Duration in quarter-note beats (`duration_ticks / 480`). |
| `velocity` | Note-on velocity (`1`–`127`). |

---

## 6. Validation Performed & Honest Scope Distinction

1. **Binary Re-Parse Verification (Completed):** All 50 generated `.mid` files were reopened from disk and parsed at the byte level. Verified `MThd` Format 0 header, 1 track, `480` PPQ division, channel `0` (MIDI Ch 1) assignment, track name, tempo `FF 51 03`, `4/4` time signature `FF 58 04`, absence of prohibited controllers/program-changes/pitch-bend, explicit `0x80` note-off pairing, `Note-Off` before `Note-On` ordering at identical ticks, pitch range (`G3 (MIDI 55)`–`F#6 (MIDI 90)`), legato rules (`0` violations), exact `End of Track` loop boundary ticks, and 100% bit-for-bit agreement with `midi_note_events.csv`.
2. **Automated Duplicate, Transposition & Sub-Loop Checks (Completed):** All 1,225 pairwise pattern comparisons passed (`0` exact pitch+rhythm duplicates, `0` rhythm+transposition duplicates, `0` unchanged shorter-loop repetitions).
3. **Score-Based Musical & Harmonic Review (Completed):** Verified chord-symbol-to-Roman-numeral accuracy across all 218 bars, out-of-scale melody note identification, motif development, and loop transition phrasing.
4. **Browser Web Audio Synthesizer Auditioning (Available in Interactive Web Experience):** Real-time dry and FX synthesizer playback is provided via the interactive Web Audio API studio in the web application; offline DAW rendering was not used to judge the files during headless script generation.
