#!/usr/bin/env python3
"""
Part 3 of the 50 Synthwave & Darkwave Lead MIDI Patterns:
- Group 5: Cinematic Flight (041 - 050)
Soaring phrases, wider interval movement, rising tension, and energetic melodic development.
"""

from typing import Dict, List
from midi_core import n

PATTERNS_PART3: List[Dict] = [
    {
        "id": "041",
        "name": "Stratosphere Burn",
        "group": "Cinematic Flight",
        "filename": "041_stratosphere_burn.mid",
        "bpm": 124,
        "tonal_center": "A",
        "scale": "Natural Minor",
        "bars": 4,
        "chords": ["Am", "F", "Dm", "E"],
        "romans": ["i", "bVI", "iv", "V"],
        "borrowed_chords": "E (V major borrowed from A harmonic minor)",
        "motif_desc": "Heroic wide-interval ascent leaping a minor tenth (A4 to C6 via E5) in bar 1, soaring through D6 in bar 3, and resolving via a blazing sixteenth-note G#5-B5-E6-G#5 flight.",
        "sound_suggestion": "Bright sawtooth lead with a restrained filter envelope.",
        "performance_suggestion": "Mono legato portamento (~35 ms) for wide octave and sixth leaps (not encoded in MIDI).",
        "legato": "yes",
        "notes": [
            # Bar 1 (Am): Fifth + fourth + octave ascent
            n(0.0, 0.5, "A4", 112, extra_ticks=30),
            n(0.5, 0.5, "E5", 118, extra_ticks=30),
            n(1.0, 1.5, "C6", 125, extra_ticks=40),
            n(2.5, 0.75, "B5", 116),
            n(3.25, 0.5, "A5", 112),
            # Bar 2 (F)
            n(4.0, 0.75, "C5", 110, extra_ticks=30),
            n(4.75, 0.75, "A5", 122),
            n(5.5, 1.25, "G5", 116),
            n(6.75, 0.5, "F5", 110),
            n(7.25, 0.5, "E5", 106),
            # Bar 3 (Dm): Climax leap to D6 (MIDI 86, extended high range)
            n(8.0, 0.5, "D5", 114, extra_ticks=30),
            n(8.5, 0.5, "A5", 120, extra_ticks=30),
            n(9.0, 1.5, "D6", 127, extra_ticks=40),
            n(10.5, 0.75, "C6", 118),
            n(11.25, 0.5, "A5", 114),
            # Bar 4 (E - V major with G#5 leading tone)
            n(12.0, 1.25, "B5", 122, extra_ticks=35),
            n(13.25, 0.75, "G#5", 120),  # Intentional leading tone G#5
            n(14.0, 0.5, "E5", 114),
            n(14.5, 0.25, "F5", 112),
            n(14.75, 0.25, "G#5", 118),  # Intentional leading tone G#5
            n(15.0, 0.75, "B5", 122),
        ],
    },
    {
        "id": "042",
        "name": "Valkyrie Vector",
        "group": "Cinematic Flight",
        "filename": "042_valkyrie_vector.mid",
        "bpm": 128,
        "tonal_center": "E",
        "scale": "Dorian",
        "bars": 4,
        "chords": ["Em", "C", "D", "A"],
        "romans": ["i", "bVI", "bVII", "IV"],
        "borrowed_chords": "C (bVI borrowed from E natural minor)",
        "motif_desc": "High-velocity aerial pursuit theme leaping across E4-B4-G5, contrasting C-natural in bar 2 (borrowed bVI) against the triumphant C#6 Dorian climax in bar 4.",
        "sound_suggestion": "Dual-saw stadium lead with wide filter envelope sweep.",
        "performance_suggestion": "none",
        "legato": "no",
        "notes": [
            # Bar 1 (Em)
            n(0.0, 0.5, "E4", 114),
            n(0.5, 0.5, "B4", 118),
            n(1.0, 1.0, "G5", 124),
            n(2.0, 0.75, "F#5", 118),
            n(2.75, 0.5, "E5", 114),
            n(3.25, 0.5, "D5", 110),
            # Bar 2 (C - borrowed bVI with C5 & C6 natural)
            n(4.0, 0.5, "C5", 116),  # Intentional modal mixture C5
            n(4.5, 0.5, "G5", 120),
            n(5.0, 1.0, "C6", 126),  # Intentional modal mixture C6
            n(6.0, 0.75, "B5", 118),
            n(6.75, 0.75, "G5", 112),
            # Bar 3 (D)
            n(8.0, 0.5, "D5", 116),
            n(8.5, 0.5, "A5", 122),
            n(9.0, 1.0, "D6", 127),
            n(10.0, 0.75, "A5", 118),
            n(10.75, 0.5, "F#5", 112),
            n(11.25, 0.5, "D5", 108),
            # Bar 4 (A - Dorian IV with C#6 and C#5)
            n(12.0, 1.0, "C#6", 126),
            n(13.0, 0.75, "B5", 120),
            n(13.75, 0.75, "A5", 116),
            n(14.5, 0.5, "E5", 112),
            n(15.0, 0.75, "C#5", 118),
        ],
    },
    {
        "id": "043",
        "name": "Hyperdrive Ascent",
        "group": "Cinematic Flight",
        "filename": "043_hyperdrive_ascent.mid",
        "bpm": 130,
        "tonal_center": "F#",
        "scale": "Natural Minor",
        "bars": 8,
        "chords": ["F#m", "D", "Bm", "C#", "F#m", "D", "A", "C#"],
        "romans": ["i", "bVI", "iv", "V", "i", "bVI", "bIII", "V"],
        "borrowed_chords": "C# (V major borrowed from F# harmonic minor)",
        "motif_desc": "Maximum-tempo (130 BPM) 8-bar cinematic showpiece: bars 1-4 build momentum through rising sixths; bars 5-8 erupt into octave leaps reaching C#6 and F#6 (MIDI 90) before an E#5 cadence.",
        "sound_suggestion": "Bright sawtooth lead with a restrained filter envelope.",
        "performance_suggestion": "Use mod wheel to open filter resonance during bars 5-8 (not encoded in MIDI).",
        "legato": "yes",
        "notes": [
            # Bar 1 (F#m)
            n(0.0, 0.75, "F#4", 112, extra_ticks=30),
            n(0.75, 0.75, "C#5", 118, extra_ticks=30),
            n(1.5, 1.0, "F#5", 122),
            n(2.5, 0.75, "E5", 114),
            n(3.25, 0.5, "C#5", 108),
            # Bar 2 (D)
            n(4.0, 0.75, "D5", 114, extra_ticks=30),
            n(4.75, 0.75, "A5", 122),
            n(5.5, 1.25, "F#5", 116),
            n(6.75, 0.75, "D5", 110),
            # Bar 3 (Bm)
            n(8.0, 0.5, "B4", 110),
            n(8.5, 0.5, "D5", 114),
            n(9.0, 0.5, "F#5", 118),
            n(9.5, 1.0, "B5", 124, extra_ticks=35),
            n(10.5, 0.75, "A5", 116),
            n(11.25, 0.5, "F#5", 112),
            # Bar 4 (C#)
            n(12.0, 1.5, "G#5", 120, extra_ticks=40),
            n(13.5, 1.0, "F5", 122),  # Intentional leading tone E#5 (F5)
            n(14.5, 1.0, "C#5", 112),
            # Bar 5 (F#m - High climax)
            n(16.0, 0.75, "F#5", 118, extra_ticks=30),
            n(16.75, 0.75, "C#6", 124, extra_ticks=30),
            n(17.5, 1.0, "F#6", 127),  # MIDI 90 (extended high range)
            n(18.5, 0.75, "E6", 120),
            n(19.25, 0.5, "C#6", 116),
            # Bar 6 (D)
            n(20.0, 0.75, "D6", 124, extra_ticks=35),
            n(20.75, 0.75, "A5", 118),
            n(21.5, 1.25, "F#5", 114),
            n(22.75, 0.75, "A5", 118),
            # Bar 7 (A)
            n(24.0, 0.5, "C#6", 124),
            n(24.5, 0.5, "B5", 118),
            n(25.0, 0.75, "A5", 120),
            n(25.75, 0.75, "E5", 112),
            n(26.5, 1.0, "A5", 118),
            # Bar 8 (C#)
            n(28.0, 1.0, "G#5", 122, extra_ticks=35),
            n(29.0, 1.0, "F5", 124),  # Intentional leading tone E#5 (F5)
            n(30.0, 0.5, "G#5", 118),
            n(30.5, 0.5, "F5", 116),  # Intentional leading tone E#5 (F5)
            n(31.0, 0.75, "C#5", 112),
        ],
    },
    {
        "id": "044",
        "name": "Solar Flare Escape",
        "group": "Cinematic Flight",
        "filename": "044_solar_flare_escape.mid",
        "bpm": 122,
        "tonal_center": "C",
        "scale": "Harmonic Minor",
        "bars": 4,
        "chords": ["Cm", "Ab", "Fm", "G"],
        "romans": ["i", "bVI", "iv", "V"],
        "borrowed_chords": "none",
        "motif_desc": "Urgent C harmonic minor flight theme combining wide seventh leaps (C5 to B5) with rapid sixteenth-note propulsive runs.",
        "sound_suggestion": "Aggressive mono saw lead with resonant filter peak.",
        "performance_suggestion": "none",
        "legato": "no",
        "notes": [
            # Bar 1 (Cm)
            n(0.0, 0.5, "C5", 116),
            n(0.5, 0.5, "G5", 120),
            n(1.0, 0.75, "D#6", 126),
            n(1.75, 0.75, "C6", 120),
            n(2.5, 0.5, "B5", 122),
            n(3.0, 0.75, "G5", 114),
            # Bar 2 (Ab)
            n(4.0, 0.5, "G#5", 120),
            n(4.5, 0.25, "G5", 112),
            n(4.75, 0.25, "F5", 110),
            n(5.0, 1.0, "D#5", 116),
            n(6.0, 0.75, "C6", 124),
            n(6.75, 0.75, "G#5", 118),
            # Bar 3 (Fm)
            n(8.0, 0.5, "F5", 116),
            n(8.5, 0.5, "G#5", 120),
            n(9.0, 1.0, "C#6", 126),  # Intentional Neapolitan Db6 (C#6) climax note
            n(10.0, 0.75, "C6", 120),
            n(10.75, 0.75, "G#5", 116),
            # Bar 4 (G - V)
            n(12.0, 0.75, "G5", 120),
            n(12.75, 0.75, "B5", 124),
            n(13.5, 0.5, "D6", 126),
            n(14.0, 0.25, "C6", 118),
            n(14.25, 0.25, "B5", 116),
            n(14.5, 0.5, "G5", 112),
            n(15.0, 0.75, "D5", 108),
        ],
    },
    {
        "id": "045",
        "name": "Andromeda Crossing",
        "group": "Cinematic Flight",
        "filename": "045_andromeda_crossing.mid",
        "bpm": 116,
        "tonal_center": "G",
        "scale": "Dorian",
        "bars": 4,
        "chords": ["Gm", "Bb", "C", "Eb"],
        "romans": ["i", "bIII", "IV", "bVI"],
        "borrowed_chords": "Eb (bVI borrowed from G natural minor)",
        "motif_desc": "Broad widescreen space-synth theme celebrating the G Dorian E5 natural in bar 3 before soaring onto Eb6 (borrowed b6) in bar 4.",
        "sound_suggestion": "Sustained lead suited to subtle vibrato and spacious effects.",
        "performance_suggestion": "Gentle expression swell across bar-long leaps (not encoded in MIDI).",
        "legato": "yes",
        "notes": [
            # Bar 1 (Gm)
            n(0.0, 0.75, "G4", 110, extra_ticks=35),
            n(0.75, 0.75, "D5", 118, extra_ticks=35),
            n(1.5, 1.5, "A#5", 124),
            n(3.0, 0.75, "A5", 116),
            # Bar 2 (Bb)
            n(4.0, 0.75, "F5", 114, extra_ticks=35),
            n(4.75, 0.75, "D6", 126),
            n(5.5, 1.5, "C6", 120),
            n(7.0, 0.75, "A#5", 116),
            # Bar 3 (C - Dorian IV featuring E5 & E6 natural)
            n(8.0, 0.75, "G5", 118, extra_ticks=35),
            n(8.75, 0.75, "E6", 127),
            n(9.5, 1.25, "C6", 120),
            n(10.75, 0.5, "A5", 114),
            n(11.25, 0.5, "G5", 110),
            # Bar 4 (Eb - borrowed bVI featuring D#6 / Eb6 and D#5 / Eb5)
            n(12.0, 1.25, "D#6", 126, extra_ticks=40),  # Intentional modal mixture Eb6 (D#6)
            n(13.25, 0.75, "A#5", 118),
            n(14.0, 1.0, "G5", 114),
            n(15.0, 0.75, "D#5", 112),  # Intentional modal mixture Eb5 (D#5)
        ],
    },
    {
        "id": "046",
        "name": "Interceptor Afterburner",
        "group": "Cinematic Flight",
        "filename": "046_interceptor_afterburner.mid",
        "bpm": 126,
        "tonal_center": "D",
        "scale": "Natural Minor",
        "bars": 4,
        "chords": ["Dm", "C", "Bb", "A"],
        "romans": ["i", "bVII", "bVI", "V"],
        "borrowed_chords": "A (V major borrowed from D harmonic minor)",
        "motif_desc": "Relentless descending-bass-implied heroic lead with upward tenth leaps in each bar and a blazing C#5-E5-A5-C#6 harmonic-minor climb in bar 4.",
        "sound_suggestion": "Bright sawtooth lead with a restrained filter envelope.",
        "performance_suggestion": "none",
        "legato": "no",
        "notes": [
            # Bar 1 (Dm)
            n(0.0, 0.5, "D5", 116),
            n(0.5, 0.25, "F5", 114),
            n(0.75, 0.75, "A5", 122),
            n(1.5, 0.75, "D6", 126),
            n(2.25, 0.75, "C6", 118),
            n(3.0, 0.75, "A5", 114),
            # Bar 2 (C)
            n(4.0, 0.5, "C5", 114),
            n(4.5, 0.25, "E5", 112),
            n(4.75, 0.75, "G5", 120),
            n(5.5, 0.75, "C6", 124),
            n(6.25, 0.75, "A#5", 118),
            n(7.0, 0.75, "G5", 112),
            # Bar 3 (Bb)
            n(8.0, 0.5, "A#4", 112),
            n(8.5, 0.25, "D5", 114),
            n(8.75, 0.75, "F5", 120),
            n(9.5, 0.75, "A#5", 124),
            n(10.25, 0.75, "A5", 118),
            n(11.0, 0.75, "F5", 112),
            # Bar 4 (A - V major with C#5 and C#6)
            n(12.0, 0.5, "C#5", 118),  # Intentional leading tone C#5
            n(12.5, 0.5, "E5", 116),
            n(13.0, 0.5, "A5", 122),
            n(13.5, 1.0, "C#6", 127),  # Intentional leading tone C#6
            n(14.5, 0.5, "A5", 118),
            n(15.0, 0.75, "E5", 114),
        ],
    },
    {
        "id": "047",
        "name": "Titan Skyway",
        "group": "Cinematic Flight",
        "filename": "047_titan_skyway.mid",
        "bpm": 118,
        "tonal_center": "B",
        "scale": "Natural Minor",
        "bars": 4,
        "chords": ["Bm", "G", "D", "F#"],
        "romans": ["i", "bVI", "bIII", "V"],
        "borrowed_chords": "F# (V major borrowed from B harmonic minor)",
        "motif_desc": "Anthemic synth-rock lead soaring from B4 to D6 over four bars, using syncopated dotted-eighth hooks and a dramatic A#5 leading-tone resolution.",
        "sound_suggestion": "Overdriven mono analog lead with singing upper harmonics.",
        "performance_suggestion": "Pitch-wheel vibrato on the high D6 in bar 3 (not encoded in MIDI).",
        "legato": "yes",
        "notes": [
            # Bar 1 (Bm)
            n(0.0, 0.5, "B4", 114, extra_ticks=30),
            n(0.5, 0.75, "D5", 118, extra_ticks=30),
            n(1.25, 0.75, "F#5", 120, extra_ticks=30),
            n(2.0, 1.25, "B5", 124),
            n(3.25, 0.5, "A5", 116),
            # Bar 2 (G)
            n(4.0, 0.75, "G5", 118, extra_ticks=35),
            n(4.75, 0.75, "D6", 126),
            n(5.5, 1.25, "B5", 120),
            n(6.75, 0.75, "G5", 114),
            # Bar 3 (D)
            n(8.0, 0.75, "A5", 120, extra_ticks=35),
            n(8.75, 0.75, "D6", 127, extra_ticks=35),
            n(9.5, 1.0, "C#6", 122),
            n(10.5, 0.75, "A5", 116),
            n(11.25, 0.5, "F#5", 112),
            # Bar 4 (F# - V major with A#5 leading tone)
            n(12.0, 1.25, "A#5", 124, extra_ticks=40),  # Intentional leading tone A#5
            n(13.25, 0.75, "B5", 120),
            n(14.0, 0.75, "F#5", 116),
            n(14.75, 0.75, "C#5", 110),
        ],
    },
    {
        "id": "048",
        "name": "Eclipse Over Neo-Tokyo",
        "group": "Cinematic Flight",
        "filename": "048_eclipse_over_neo_tokyo.mid",
        "bpm": 121,
        "tonal_center": "C#",
        "scale": "Natural Minor",
        "bars": 4,
        "chords": ["C#m", "A", "E", "G#"],
        "romans": ["i", "bVI", "bIII", "V"],
        "borrowed_chords": "G# (V major borrowed from C# harmonic minor)",
        "motif_desc": "Cyberpunk skyline theme built on pentatonic-infused fourths and fifths that open into full diatonic and harmonic-minor (B#5) grandeur by bar 4.",
        "sound_suggestion": "Bright sawtooth lead with a restrained filter envelope.",
        "performance_suggestion": "none",
        "legato": "yes",
        "notes": [
            # Bar 1 (C#m)
            n(0.0, 0.5, "C#5", 114, extra_ticks=25),
            n(0.5, 0.75, "G#5", 122),
            n(1.25, 0.75, "B5", 124, extra_ticks=30),
            n(2.0, 1.0, "G#5", 118),
            n(3.0, 0.75, "F#5", 114),
            # Bar 2 (A)
            n(4.0, 0.5, "E5", 114, extra_ticks=25),
            n(4.5, 0.75, "A5", 122),
            n(5.25, 0.75, "C#6", 126, extra_ticks=35),
            n(6.0, 1.0, "B5", 120),
            n(7.0, 0.75, "G#5", 114),
            # Bar 3 (E)
            n(8.0, 0.5, "B5", 120),
            n(8.5, 0.5, "E6", 127),  # MIDI 88 (extended high range)
            n(9.0, 0.75, "D#6", 124),
            n(9.75, 0.75, "B5", 118),
            n(10.5, 0.75, "G#5", 114),
            n(11.25, 0.5, "E5", 110),
            # Bar 4 (G# - V major with C6 = B#5 leading tone)
            n(12.0, 1.0, "D#5", 116, extra_ticks=35),
            n(13.0, 1.0, "G#5", 120, extra_ticks=35),
            n(14.0, 1.0, "C6", 125),  # Intentional leading tone B#5 (C6)
            n(15.0, 0.75, "G#5", 118),
        ],
    },
    {
        "id": "049",
        "name": "Event Horizon Glide",
        "group": "Cinematic Flight",
        "filename": "049_event_horizon_glide.mid",
        "bpm": 114,
        "tonal_center": "F",
        "scale": "Natural Minor",
        "bars": 4,
        "chords": ["Fm", "Db", "Bb", "C"],
        "romans": ["i", "bVI", "IV", "V"],
        "borrowed_chords": "Bb (IV major borrowed from F Dorian), C (V major borrowed from F harmonic minor)",
        "motif_desc": "Epic harmonic journey combining Db major (bVI), Dorian Bb major (IV with D5 natural), and C major (V with E5 natural) under a soaring octave-leaping lead.",
        "sound_suggestion": "Sustained lead suited to subtle vibrato and spacious effects.",
        "performance_suggestion": "40 ms fingered portamento for octave and sixth glides (not encoded in MIDI).",
        "legato": "yes",
        "notes": [
            # Bar 1 (Fm)
            n(0.0, 0.5, "F5", 116, extra_ticks=30),
            n(0.5, 0.5, "G#5", 118, extra_ticks=30),
            n(1.0, 1.25, "C6", 124, extra_ticks=40),
            n(2.25, 0.75, "A#5", 118),
            n(3.0, 0.75, "G5", 114),
            # Bar 2 (Db)
            n(4.0, 0.75, "F5", 114, extra_ticks=35),
            n(4.75, 1.25, "C#6", 126, extra_ticks=40),
            n(6.0, 1.0, "C6", 120),
            n(7.0, 0.75, "G#5", 114),
            # Bar 3 (Bb - Borrowed Dorian IV featuring D6 natural)
            n(8.0, 0.75, "A#5", 120, extra_ticks=35),
            n(8.75, 1.25, "D6", 127, extra_ticks=40),  # Intentional Dorian 6th D6
            n(10.0, 1.0, "A#5", 118),
            n(11.0, 0.75, "F5", 112),
            # Bar 4 (C - Borrowed harmonic minor V featuring E5 & E6 natural)
            n(12.0, 1.0, "G5", 118, extra_ticks=35),
            n(13.0, 1.0, "C6", 124, extra_ticks=35),
            n(14.0, 1.0, "E6", 127),  # Intentional leading tone E6 (MIDI 88)
            n(15.0, 0.75, "G5", 114),
        ],
    },
    {
        "id": "050",
        "name": "Omega Dawn Finale",
        "group": "Cinematic Flight",
        "filename": "050_omega_dawn_finale.mid",
        "bpm": 120,
        "tonal_center": "A",
        "scale": "Harmonic Minor",
        "bars": 8,
        "chords": ["Am", "F", "Dm", "E", "Am", "F", "Bdim", "E"],
        "romans": ["i", "bVI", "iv", "V", "i", "bVI", "ii°", "V"],
        "borrowed_chords": "none",
        "motif_desc": "Grand 8-bar finale of the 50-pattern collection: synthesizes synthwave octave heroism and darkwave harmonic-minor tension, climbing to E6 before a decisive G#5-A5 cadence loop.",
        "sound_suggestion": "Flagship dual-sawtooth + sub-octave mono synth lead with expressive filter sweep.",
        "performance_suggestion": "Fingered portamento + mod-wheel vibrato on bar-4 and bar-8 climaxes (not encoded in MIDI).",
        "legato": "yes",
        "notes": [
            # Bar 1 (Am)
            n(0.0, 0.5, "A4", 114, extra_ticks=30),
            n(0.5, 0.5, "E5", 118, extra_ticks=30),
            n(1.0, 1.0, "A5", 124, extra_ticks=35),
            n(2.0, 0.75, "G#5", 120),
            n(2.75, 0.5, "A5", 122),
            n(3.25, 0.5, "E5", 112),
            # Bar 2 (F)
            n(4.0, 0.75, "F5", 118, extra_ticks=35),
            n(4.75, 0.75, "C6", 124),
            n(5.5, 1.25, "A5", 118),
            n(6.75, 0.75, "F5", 112),
            # Bar 3 (Dm)
            n(8.0, 0.5, "D5", 114),
            n(8.5, 0.5, "F5", 118),
            n(9.0, 1.0, "A5", 122, extra_ticks=35),
            n(10.0, 0.75, "B5", 120),
            n(10.75, 0.75, "A5", 116),
            # Bar 4 (E)
            n(12.0, 1.5, "G#5", 124, extra_ticks=40),
            n(13.5, 1.0, "E5", 116),
            n(14.5, 1.0, "B4", 110),
            # Bar 5 (Am - Second half intensification)
            n(16.0, 0.5, "A5", 120, extra_ticks=30),
            n(16.5, 0.5, "C6", 124, extra_ticks=30),
            n(17.0, 1.0, "E6", 127, extra_ticks=35),
            n(18.0, 0.75, "D6", 122),
            n(18.75, 0.5, "C6", 118),
            n(19.25, 0.5, "B5", 116),
            # Bar 6 (F)
            n(20.0, 0.75, "C6", 124, extra_ticks=35),
            n(20.75, 0.75, "A5", 120),
            n(21.5, 1.25, "F5", 116),
            n(22.75, 0.75, "E5", 112),
            # Bar 7 (Bdim - ii°)
            n(24.0, 0.5, "D5", 114),
            n(24.5, 0.5, "F5", 118),
            n(25.0, 0.75, "B5", 124),
            n(25.75, 0.75, "D6", 126),
            n(26.5, 1.0, "F5", 116),
            # Bar 8 (E - V)
            n(28.0, 1.0, "E5", 118, extra_ticks=35),
            n(29.0, 1.0, "G#5", 122, extra_ticks=35),
            n(30.0, 1.0, "B5", 126),
            n(31.0, 0.75, "G#5", 120),
        ],
    },
]
