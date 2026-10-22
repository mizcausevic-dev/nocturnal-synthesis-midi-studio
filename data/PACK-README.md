# Nocturnal Synthesis: 50 Synthwave and Darkwave Lead MIDI Loops

Version 1.1.0. Fifty original, monophonic lead lines (`001`-`050`) for synthwave,
outrun, darkwave, coldwave, and dark cinematic work. Each loop is written to carry itself on
a dry mono synth: interval shape, rhythm, and rests do the work, not delay or reverb.

Live lab: https://mizcausevic-dev.github.io/nocturnal-synthesis-midi-studio/
Source: https://github.com/mizcausevic-dev/nocturnal-synthesis-midi-studio

## What is in the ZIP

| Path | Contents |
| :--- | :--- |
| `midi/` | 50 Standard MIDI Files, one loop each |
| `midi_patterns_index.csv` | One row per pattern: tempo, key, scale, chords, Roman numerals, notes on sound |
| `midi_note_events.csv` | 1,024 rows, one per note, in ticks and beats |
| `manifest.json` | Byte size and SHA-256 for every file above |
| `LICENSE-PATTERNS.md` | What you may do with the patterns |
| `README.md` | This file |

## Collection

1. **Neon Hooks (`001`-`010`)**: Immediate, memorable motifs with clear rhythmic identities. Legato: 7 of 10.
2. **Midnight Sequences (`011`-`020`)**: Pulsing figures and arpeggio-inspired movement, kept in the lead role. Legato: 4 of 10.
3. **Cold Signals (`021`-`030`)**: Minimal, angular phrases with clipped articulation and deliberate silence. Legato: 2 of 10.
4. **Haunted Melodies (`031`-`040`)**: Expressive minor-key themes, sustained notes, and bittersweet resolutions. Legato: 9 of 10.
5. **Cinematic Flight (`041`-`050`)**: Soaring phrases, wider intervals, rising tension, longer development. Legato: 7 of 10.

Loop lengths: 5 two-bar, 38 four-bar, and 7 eight-bar loops (218 bars in total).
Tempos are integers from 85 to 130 BPM.

## File conventions

- Standard MIDI File, Format 0, one track, MIDI channel 1 (channel `0` in zero-based tools).
- 480 ticks per quarter note. 4/4. One bar is 1,920 ticks; 2, 4, and 8 bars are 3,840, 7,680, and 15,360 ticks.
- Tick 0 holds the track name, the tempo (`round(60,000,000 / BPM)` microseconds per quarter note), and the 4/4 time signature.
- Timing is zero-based: tick 0 and beat 0.0 are bar 1, beat 1.
- Every note has an explicit Note On (`0x90`) and Note Off (`0x80`). When one note ends where another begins, the Note Off is written first.
- There is exactly one End of Track event, placed on the loop boundary. Some DAWs trim an imported clip to its last note; if yours does, set the clip to the length in `loop_length_bars`.
- No program changes, pitch bend, controllers, or aftertouch.
- Pitch names use C4 = MIDI 60 with sharps. The MIDI number is authoritative.
- Range: every note sits between G3 (MIDI 55) and F#6 (MIDI 90); 96.6% of notes are inside the primary range C4-C6 (MIDI 60-84).

## Legato

- 29 patterns are marked `legato: yes`. They contain 144 intentional overlaps of 25 to 45 ticks between adjacent notes of different pitch. The later note always starts after, and ends after, the earlier one; no more than two notes ever sound together, and nothing overlaps across the loop boundary.
- 21 patterns are marked `legato: no` and never overlap.
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
