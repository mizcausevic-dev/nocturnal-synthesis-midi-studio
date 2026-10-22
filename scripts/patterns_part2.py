#!/usr/bin/env python3
"""
Part 2 of the 50 Synthwave & Darkwave Lead MIDI Patterns:
- Group 3: Cold Signals (021 - 030)
- Group 4: Haunted Melodies (031 - 040)
"""

from typing import Dict, List
from midi_core import n

PATTERNS_PART2: List[Dict] = [
    # =========================================================================
    # GROUP 3: COLD SIGNALS (021 - 030)
    # Minimal, angular phrases with clipped articulation, unsettling intervals,
    # and deliberate silence.
    # =========================================================================
    {
        "id": "021",
        "name": "Bunker Transmission",
        "group": "Cold Signals",
        "filename": "021_bunker_transmission.mid",
        "bpm": 96,
        "tonal_center": "E",
        "scale": "Phrygian",
        "bars": 4,
        "chords": ["Em", "F", "Em", "Dm"],
        "romans": ["i", "bII", "i", "bvii"],
        "borrowed_chords": "none",
        "motif_desc": "Stark coldwave Morse-like motif in E Phrygian using clipped staccato eighths, wide minor-sixth leaps (E4 to C5), and tense F5 semitone stabs surrounded by multi-beat silence.",
        "sound_suggestion": "Hollow pulse-wave lead with a short release.",
        "performance_suggestion": "none",
        "legato": "no",
        "notes": [
            # Bar 1 (Em): Clipped angular call followed by 1.5 beats of silence
            n(0.0, 0.25, "E4", 112),
            n(0.5, 0.25, "E4", 104),
            n(1.0, 0.5, "C5", 120),
            n(1.75, 0.25, "B4", 110),
            # Rest from 2.0 to 3.5
            n(3.5, 0.25, "F4", 106),
            # Bar 2 (F - Phrygian bII): High F5 angular stab
            n(4.0, 0.75, "F5", 122),
            n(5.0, 0.25, "C5", 108),
            n(5.5, 0.5, "A4", 104),
            # Rest on beats 6.0 - 8.0
            # Bar 3 (Em): Displaced motif with tritone inflection Bb4
            n(8.5, 0.25, "E4", 110),
            n(9.0, 0.5, "B4", 116),
            n(9.75, 0.5, "A#4", 120),  # Intentional tritone Bb4 (A#4)
            n(10.5, 0.75, "B4", 114),
            # Bar 4 (Dm - bvii)
            n(12.0, 0.5, "D5", 116),
            n(12.75, 0.25, "A4", 106),
            n(13.5, 0.75, "F4", 112),
            n(15.0, 0.25, "F4", 104),
        ],
    },
    {
        "id": "022",
        "name": "Geiger Counter Waltz",
        "group": "Cold Signals",
        "filename": "022_geiger_counter_waltz.mid",
        "bpm": 102,
        "tonal_center": "F#",
        "scale": "Harmonic Minor",
        "bars": 4,
        "chords": ["F#m", "F#m", "D", "C#"],
        "romans": ["i", "i", "bVI", "V"],
        "borrowed_chords": "none",
        "motif_desc": "Mechanical 4/4 darkwave phrase using a cross-rhythmic dotted-quarter cold signal that fractures across the barline and exposes the D5-to-E#5 (F5) augmented second.",
        "sound_suggestion": "Thin, lightly saturated mono lead.",
        "performance_suggestion": "Bitcrush or sample-rate reduction optional for industrial texture (not encoded in MIDI).",
        "legato": "no",
        "notes": [
            # Bar 1 (F#m)
            n(0.0, 0.25, "F#4", 114),
            n(1.5, 0.25, "C#5", 118),
            n(3.0, 0.5, "D5", 120),
            # Bar 2 (F#m)
            n(4.5, 0.25, "C#5", 112),
            n(5.0, 0.5, "A4", 108),
            n(6.5, 0.5, "F5", 122),  # E#5 (harmonic minor 7th)
            n(7.25, 0.25, "F#5", 116),
            # Bar 3 (D)
            n(8.0, 0.5, "D5", 118),
            n(9.0, 0.25, "A4", 104),
            n(9.5, 0.75, "F#5", 122),
            n(11.0, 0.25, "D5", 108),
            # Bar 4 (C#)
            n(12.0, 0.75, "F5", 124),  # E#5
            n(13.0, 0.25, "C#5", 110),
            n(13.5, 0.5, "G#4", 106),
            n(15.25, 0.25, "F5", 116),
        ],
    },
    {
        "id": "023",
        "name": "Dead Channel 09",
        "group": "Cold Signals",
        "filename": "023_dead_channel_09.mid",
        "bpm": 90,
        "tonal_center": "C",
        "scale": "Phrygian",
        "bars": 2,
        "chords": ["Cm", "Db"],
        "romans": ["i", "bII"],
        "borrowed_chords": "none",
        "motif_desc": "Ultra-sparse 2-bar minimal-wave transmission with major-seventh and minor-ninth contour jumps (C4 to B4/Db5) and stark empty space.",
        "sound_suggestion": "Cold narrow-pulse lead with zero vibrato.",
        "performance_suggestion": "none",
        "legato": "no",
        "notes": [
            # Bar 1 (Cm)
            n(0.0, 0.25, "C4", 116),
            n(0.75, 0.5, "G4", 110),
            n(1.5, 0.75, "C#5", 124),  # Db5 (b2)
            n(2.5, 0.25, "C5", 112),
            # Bar 2 (Db)
            n(4.0, 0.5, "C#5", 120),
            n(5.25, 0.25, "G#4", 108),
            n(6.0, 0.75, "F4", 114),
            n(7.25, 0.25, "B4", 118),  # Intentional chromatic leading-tone sting B4
        ],
    },
    {
        "id": "024",
        "name": "Brutalist Concrete",
        "group": "Cold Signals",
        "filename": "024_brutalist_concrete.mid",
        "bpm": 105,
        "tonal_center": "G",
        "scale": "Natural Minor",
        "bars": 4,
        "chords": ["Gm", "Cm", "Eb", "D"],
        "romans": ["i", "iv", "bVI", "V"],
        "borrowed_chords": "D (V major borrowed from G harmonic minor)",
        "motif_desc": "Rigid, architectural Post-Punk/Darkwave synth line built on fourths and fifths in the low-mid register (D4-G4-C5-D5), interrupted by sharp rests.",
        "sound_suggestion": "Raw unfiltered square wave in lower-mid register.",
        "performance_suggestion": "none",
        "legato": "no",
        "notes": [
            # Bar 1 (Gm): Uses extended low range D4 (62) and G3/D4 -> keep within 55-96 (G3=55)
            n(0.0, 0.5, "G3", 118),
            n(0.75, 0.5, "D4", 114),
            n(1.5, 0.75, "A#4", 122),
            n(3.0, 0.25, "A4", 106),
            n(3.5, 0.25, "G4", 110),
            # Bar 2 (Cm)
            n(4.0, 0.5, "C4", 116),
            n(4.75, 0.5, "G4", 112),
            n(5.5, 0.75, "D#5", 124),
            n(7.0, 0.5, "C5", 110),
            # Bar 3 (Eb)
            n(8.25, 0.5, "D#4", 114),
            n(9.0, 0.5, "A#4", 118),
            n(9.75, 0.75, "G4", 112),
            n(11.0, 0.5, "F4", 106),
            # Bar 4 (D - V major with F#4 leading tone)
            n(12.0, 0.75, "F#4", 120),  # Intentional leading tone F#4
            n(13.25, 0.25, "D4", 108),
            n(13.75, 0.75, "A4", 118),
            n(15.0, 0.5, "F#4", 114),  # Intentional leading tone F#4
        ],
    },
    {
        "id": "025",
        "name": "Numbers Station",
        "group": "Cold Signals",
        "filename": "025_numbers_station.mid",
        "bpm": 110,
        "tonal_center": "A",
        "scale": "Natural Minor",
        "bars": 4,
        "chords": ["Am", "Am", "F", "E"],
        "romans": ["i", "i", "bVI", "V"],
        "borrowed_chords": "E (V major borrowed from A harmonic minor)",
        "motif_desc": "Shortwave numbers-station motif repeating a three-note cell (E5-F5-A4) at shifting metric positions before breaking into a D#5/G#5 dissonant transmission in bar 4.",
        "sound_suggestion": "Sine-triangle FM bell-lead with zero sustain tail.",
        "performance_suggestion": "Bandpass filter between 400 Hz and 3.2 kHz for radio effect (not encoded in MIDI).",
        "legato": "no",
        "notes": [
            # Bar 1 (Am): Cell at beat 0.0
            n(0.0, 0.25, "E5", 116),
            n(0.25, 0.25, "F5", 120),
            n(0.5, 0.5, "A4", 112),
            # Silence until beat 2.75
            n(2.75, 0.25, "E5", 114),
            n(3.0, 0.25, "C5", 108),
            # Bar 2 (Am): Cell displaced to beat 0.5 (4.5)
            n(4.5, 0.25, "E5", 116),
            n(4.75, 0.25, "F5", 122),
            n(5.0, 0.5, "B4", 114),
            n(6.5, 0.5, "C5", 110),
            n(7.25, 0.25, "A4", 104),
            # Bar 3 (F): Cell expanded to A5
            n(8.0, 0.25, "F5", 118),
            n(8.25, 0.25, "A5", 124),
            n(8.5, 0.75, "C5", 112),
            n(10.25, 0.25, "F5", 116),
            n(10.75, 0.5, "E5", 110),
            # Bar 4 (E): Tritone D#5 + G#5 harmonic minor signal
            n(12.0, 0.5, "D#5", 120),  # Intentional chromatic neighbor D#5
            n(12.5, 0.5, "E5", 118),
            n(13.5, 0.75, "G#5", 124),  # Intentional leading tone G#5
            n(15.0, 0.25, "B4", 108),
        ],
    },
    {
        "id": "026",
        "name": "Fluorescent Morgue",
        "group": "Cold Signals",
        "filename": "026_fluorescent_morgue.mid",
        "bpm": 88,
        "tonal_center": "C#",
        "scale": "Phrygian",
        "bars": 4,
        "chords": ["C#m", "D", "Bm", "C#m"],
        "romans": ["i", "bII", "bvii", "i"],
        "borrowed_chords": "none",
        "motif_desc": "Glacial 88 BPM darkwave lead with a twitching 30-tick legato grace-note flicker (C#5->D5) followed by cold descending sixths and stark pauses.",
        "sound_suggestion": "Thin, lightly saturated mono lead.",
        "performance_suggestion": "Short 15 ms glide for the semitone flicker (not encoded in MIDI).",
        "legato": "yes",
        "notes": [
            # Bar 1 (C#m)
            n(0.0, 0.25, "C#5", 112, extra_ticks=30),
            n(0.25, 1.0, "D5", 120),
            n(1.5, 0.5, "G#4", 106),
            # Silence 2.0 - 3.5
            n(3.5, 0.25, "E5", 114),
            # Bar 2 (D - bII)
            n(4.0, 1.0, "F#5", 122, extra_ticks=30),
            n(5.0, 0.75, "D5", 114),
            n(6.5, 0.5, "A4", 106),
            # Bar 3 (Bm - bvii)
            n(8.0, 0.25, "B4", 110, extra_ticks=30),
            n(8.25, 1.0, "F#5", 120),
            n(9.5, 0.5, "D5", 112),
            n(10.75, 0.5, "B4", 106),
            # Bar 4 (C#m)
            n(12.0, 1.25, "G#4", 114),
            n(13.75, 0.5, "D5", 118),
            n(14.5, 0.75, "C#5", 112),
        ],
    },
    {
        "id": "027",
        "name": "Subzero Conduit",
        "group": "Cold Signals",
        "filename": "027_subzero_conduit.mid",
        "bpm": 100,
        "tonal_center": "F",
        "scale": "Harmonic Minor",
        "bars": 4,
        "chords": ["Fm", "Db", "Gdim", "C"],
        "romans": ["i", "bVI", "ii°", "V"],
        "borrowed_chords": "none",
        "motif_desc": "Angular, crystalline cold-synth line tracing diminished fifths and sixths over Fm-Db-Gdim-C with clinical precision.",
        "sound_suggestion": "Glassy cold pulse-wave lead with steep high-pass filter.",
        "performance_suggestion": "none",
        "legato": "no",
        "notes": [
            # Bar 1 (Fm)
            n(0.0, 0.5, "F5", 118),
            n(0.75, 0.25, "C5", 108),
            n(1.5, 0.75, "G#5", 122),
            n(3.0, 0.25, "G5", 110),
            # Bar 2 (Db)
            n(4.0, 0.5, "F5", 116),
            n(4.75, 0.25, "C#5", 112),
            n(5.5, 0.75, "G#4", 106),
            n(7.0, 0.5, "C#5", 112),
            # Bar 3 (Gdim - ii°)
            n(8.0, 0.5, "G5", 120),
            n(8.75, 0.5, "C#5", 116),
            n(9.75, 0.5, "A#4", 110),
            n(11.0, 0.25, "G4", 104),
            # Bar 4 (C - V)
            n(12.0, 0.75, "E5", 122),
            n(13.25, 0.25, "C5", 110),
            n(14.0, 0.5, "G5", 118),
            n(15.25, 0.25, "E5", 114),
        ],
    },
    {
        "id": "028",
        "name": "Iron Curtain Echo",
        "group": "Cold Signals",
        "filename": "028_iron_curtain_echo.mid",
        "bpm": 94,
        "tonal_center": "D",
        "scale": "Natural Minor",
        "bars": 8,
        "chords": ["Dm", "Gm", "Dm", "A", "Dm", "Bb", "Gm", "A"],
        "romans": ["i", "iv", "i", "V", "i", "bVI", "iv", "V"],
        "borrowed_chords": "A (V major borrowed from D harmonic minor)",
        "motif_desc": "Stoic 8-bar East-Bloc coldwave theme: sparse staccato calls in bars 1-4 answered by a higher octave surveillance variation in bars 5-8 with C#5 leading-tone tension.",
        "sound_suggestion": "Hollow pulse-wave lead with a short release.",
        "performance_suggestion": "none",
        "legato": "no",
        "notes": [
            # Bar 1 (Dm)
            n(0.0, 0.5, "D4", 114),
            n(0.75, 0.25, "A4", 118),
            n(1.5, 0.5, "F4", 110),
            n(3.25, 0.25, "E4", 102),
            # Bar 2 (Gm)
            n(4.0, 0.5, "G4", 116),
            n(4.75, 0.25, "A#4", 120),
            n(5.5, 0.75, "D4", 108),
            # Bar 3 (Dm)
            n(8.0, 0.5, "F4", 112),
            n(8.75, 0.5, "D5", 122),
            n(10.0, 0.5, "A4", 114),
            n(11.25, 0.25, "F4", 104),
            # Bar 4 (A)
            n(12.0, 0.75, "E4", 114),
            n(13.5, 0.75, "C#4", 118),  # Intentional leading tone C#4
            n(15.0, 0.25, "A4", 110),
            # Bar 5 (Dm - Upper register development)
            n(16.0, 0.5, "D5", 118),
            n(16.75, 0.25, "A5", 124),
            n(17.5, 0.5, "F5", 116),
            n(19.25, 0.25, "E5", 110),
            # Bar 6 (Bb)
            n(20.0, 0.5, "D5", 116),
            n(20.75, 0.5, "A#5", 124),
            n(21.75, 0.75, "F5", 114),
            # Bar 7 (Gm)
            n(24.0, 0.5, "G5", 120),
            n(24.75, 0.25, "D5", 112),
            n(25.5, 0.75, "A#4", 116),
            n(27.0, 0.5, "G4", 108),
            # Bar 8 (A)
            n(28.0, 0.75, "E5", 118),
            n(29.25, 0.75, "C#5", 122),  # Intentional leading tone C#5
            n(30.5, 0.5, "A4", 112),
            n(31.25, 0.25, "E4", 106),
        ],
    },
    {
        "id": "029",
        "name": "Null Pointer Pulse",
        "group": "Cold Signals",
        "filename": "029_null_pointer_pulse.mid",
        "bpm": 116,
        "tonal_center": "B",
        "scale": "Phrygian",
        "bars": 2,
        "chords": ["Bm", "C"],
        "romans": ["i", "bII"],
        "borrowed_chords": "none",
        "motif_desc": "Jagged 2-bar cyber-minimalist loop locking onto B4, F#5, and the cold C5/G5 Phrygian bII dyad outline with off-grid sixteenth stabs.",
        "sound_suggestion": "Sharp digital square wave with instant gate release.",
        "performance_suggestion": "none",
        "legato": "no",
        "notes": [
            # Bar 1 (Bm)
            n(0.0, 0.25, "B4", 118),
            n(0.75, 0.25, "F#5", 122),
            n(1.25, 0.5, "D5", 112),
            n(2.5, 0.25, "B4", 108),
            n(3.25, 0.25, "F#4", 104),
            # Bar 2 (C - bII in B Phrygian)
            n(4.0, 0.5, "C5", 122),
            n(4.75, 0.25, "G5", 124),
            n(5.5, 0.5, "E5", 116),
            n(6.75, 0.25, "C5", 114),
            n(7.25, 0.25, "A#4", 118),  # Intentional leading tone A#4
        ],
    },
    {
        "id": "030",
        "name": "Cryogenic Sleep",
        "group": "Cold Signals",
        "filename": "030_cryogenic_sleep.mid",
        "bpm": 86,
        "tonal_center": "G#",
        "scale": "Natural Minor",
        "bars": 4,
        "chords": ["G#m", "E", "C#m", "D#"],
        "romans": ["i", "bVI", "iv", "V"],
        "borrowed_chords": "D# (V major borrowed from G# harmonic minor)",
        "motif_desc": "Slowest pattern in Cold Signals (86 BPM): isolated, high-register ice-crystal notes (G#5-D#6-B5) separated by wide gulfs of silence.",
        "sound_suggestion": "Rounded triangle-based lead for a softer phrase.",
        "performance_suggestion": "Long hall reverb optional in DAW; dry phrase relies on wide register leaps (not encoded in MIDI).",
        "legato": "yes",
        "notes": [
            # Bar 1 (G#m): Uses extended high range D#6 (87)
            n(0.0, 0.75, "G#5", 112, extra_ticks=30),
            n(0.75, 1.0, "D#6", 120),
            n(2.75, 0.5, "B5", 108),
            # Bar 2 (E)
            n(4.5, 1.0, "B5", 114, extra_ticks=30),
            n(5.5, 1.0, "G#5", 108),
            # Bar 3 (C#m)
            n(8.0, 0.5, "E5", 106),
            n(9.0, 1.0, "C#6", 118),
            n(10.5, 0.75, "G#5", 110),
            # Bar 4 (D# - V major with G5 = F##5 leading tone)
            n(12.25, 1.0, "A#5", 116),
            n(13.75, 0.75, "G5", 120),  # Intentional leading tone F##5 (G5)
            n(15.0, 0.5, "D#5", 104),
        ],
    },

    # =========================================================================
    # GROUP 4: HAUNTED MELODIES (031 - 040)
    # Expressive minor-key themes, descending figures, sustained notes,
    # and bittersweet resolutions.
    # =========================================================================
    {
        "id": "031",
        "name": "Ghost in the CRT",
        "group": "Haunted Melodies",
        "filename": "031_ghost_in_the_crt.mid",
        "bpm": 92,
        "tonal_center": "A",
        "scale": "Natural Minor",
        "bars": 4,
        "chords": ["Am", "Dm", "F", "E"],
        "romans": ["i", "iv", "bVI", "V"],
        "borrowed_chords": "E (V major borrowed from A harmonic minor)",
        "motif_desc": "Elegiac minor theme opening with a sustained F5-to-E5 sigh over Am, descending through Dm and F before a poignant G#4-B4-E5 resolution.",
        "sound_suggestion": "Sustained lead suited to subtle vibrato and spacious effects.",
        "performance_suggestion": "Delayed LFO vibrato on sustained half notes (not encoded in MIDI).",
        "legato": "yes",
        "notes": [
            # Bar 1 (Am)
            n(0.0, 1.5, "E5", 112, extra_ticks=45),
            n(1.5, 1.0, "F5", 118, extra_ticks=40),
            n(2.5, 1.25, "E5", 110),
            # Bar 2 (Dm)
            n(4.0, 1.5, "D5", 114, extra_ticks=40),
            n(5.5, 0.75, "C5", 106),
            n(6.25, 0.75, "B4", 102),
            n(7.0, 0.75, "A4", 108),
            # Bar 3 (F)
            n(8.0, 1.5, "C5", 114, extra_ticks=45),
            n(9.5, 1.0, "A5", 122, extra_ticks=35),
            n(10.5, 0.75, "G5", 112),
            n(11.25, 0.5, "F5", 108),
            # Bar 4 (E)
            n(12.0, 2.0, "E5", 116, extra_ticks=40),
            n(14.0, 1.0, "G#4", 112),  # Intentional leading tone G#4
            n(15.0, 0.75, "B4", 108),
        ],
    },
    {
        "id": "032",
        "name": "Black Velvet Rain",
        "group": "Haunted Melodies",
        "filename": "032_black_velvet_rain.mid",
        "bpm": 89,
        "tonal_center": "C",
        "scale": "Natural Minor",
        "bars": 4,
        "chords": ["Cm", "Ab", "Fm", "G"],
        "romans": ["i", "bVI", "iv", "V"],
        "borrowed_chords": "G (V major borrowed from C harmonic minor)",
        "motif_desc": "Weeping descending line in C minor that drops from G5 through Eb5 and C5, answers with an Ab-major ninth (Bb5), and sighs onto B4 in bar 4.",
        "sound_suggestion": "Rounded triangle-based lead for a softer phrase.",
        "performance_suggestion": "Soft aftertouch filter opening on long notes (not encoded in MIDI).",
        "legato": "yes",
        "notes": [
            # Bar 1 (Cm)
            n(0.0, 1.25, "G5", 116, extra_ticks=40),
            n(1.25, 0.75, "F5", 110),
            n(2.0, 1.25, "D#5", 114, extra_ticks=35),
            n(3.25, 0.5, "C5", 104),
            # Bar 2 (Ab)
            n(4.0, 1.5, "A#5", 122, extra_ticks=45),
            n(5.5, 1.0, "G#5", 116),
            n(6.5, 1.25, "D#5", 108),
            # Bar 3 (Fm)
            n(8.0, 1.0, "F5", 114, extra_ticks=35),
            n(9.0, 0.75, "G5", 116),
            n(9.75, 0.75, "G#5", 120),
            n(10.5, 1.25, "F5", 110),
            # Bar 4 (G)
            n(12.0, 1.5, "D5", 114, extra_ticks=40),
            n(13.5, 1.5, "B4", 118),  # Intentional leading tone B4
            n(15.25, 0.5, "D5", 108),
        ],
    },
    {
        "id": "033",
        "name": "Sepulcher of Glass",
        "group": "Haunted Melodies",
        "filename": "033_sepulcher_of_glass.mid",
        "bpm": 95,
        "tonal_center": "F#",
        "scale": "Harmonic Minor",
        "bars": 8,
        "chords": ["F#m", "D", "Bm", "C#", "F#m", "D", "G#dim", "C#"],
        "romans": ["i", "bVI", "iv", "V", "i", "bVI", "ii°", "V"],
        "borrowed_chords": "none",
        "motif_desc": "Gothic 8-bar darkwave elegy in F# harmonic minor: long singing phrases in bars 1-4 answered by an aching high-register variation in bars 5-8 descending from C#6 through A5, F#5, and E#5.",
        "sound_suggestion": "Sustained lead suited to subtle vibrato and spacious effects.",
        "performance_suggestion": "Portamento (~40 ms) on legato transitions (not encoded in MIDI).",
        "legato": "yes",
        "notes": [
            # Bar 1 (F#m)
            n(0.0, 1.5, "C#5", 112, extra_ticks=40),
            n(1.5, 1.0, "A4", 106),
            n(2.5, 1.25, "F#4", 102),
            # Bar 2 (D)
            n(4.0, 1.5, "D5", 116, extra_ticks=40),
            n(5.5, 1.0, "C#5", 110),
            n(6.5, 1.25, "B4", 106),
            # Bar 3 (Bm)
            n(8.0, 1.0, "B4", 110),
            n(9.0, 1.0, "D5", 116, extra_ticks=35),
            n(10.0, 1.0, "G#5", 120),
            n(11.0, 0.75, "F#5", 114),
            # Bar 4 (C#)
            n(12.0, 2.0, "F5", 118, extra_ticks=45),  # E#5
            n(14.0, 1.5, "C#5", 108),
            # Bar 5 (F#m - High second-half variation)
            n(16.0, 1.5, "F#5", 118, extra_ticks=40),
            n(17.5, 1.0, "C#6", 126, extra_ticks=40),
            n(18.5, 1.25, "A5", 118),
            # Bar 6 (D)
            n(20.0, 1.5, "A5", 122, extra_ticks=40),
            n(21.5, 1.0, "G#5", 116),
            n(22.5, 1.25, "F#5", 112),
            # Bar 7 (G#dim)
            n(24.0, 1.0, "G#5", 118),
            n(25.0, 1.0, "F5", 114),  # E#5
            n(26.0, 1.0, "D5", 112),
            n(27.0, 0.75, "B4", 106),
            # Bar 8 (C#)
            n(28.0, 1.5, "C#5", 116, extra_ticks=40),
            n(29.5, 1.25, "F5", 120),  # E#5
            n(31.0, 0.75, "G#5", 114),
        ],
    },
    {
        "id": "034",
        "name": "Last Train from Wannsee",
        "group": "Haunted Melodies",
        "filename": "034_last_train_from_wannsee.mid",
        "bpm": 98,
        "tonal_center": "E",
        "scale": "Natural Minor",
        "bars": 4,
        "chords": ["Em", "Bm", "C", "Am"],
        "romans": ["i", "v", "bVI", "iv"],
        "borrowed_chords": "none",
        "motif_desc": "Melancholic Berlin-school nocturnal melody using natural minor v (Bm) and iv (Am) to avoid dominant cliché, ending on an unresolved B4-C5-A4 suspension.",
        "sound_suggestion": "Warm analog sawtooth lead with slow filter attack.",
        "performance_suggestion": "none",
        "legato": "yes",
        "notes": [
            # Bar 1 (Em)
            n(0.0, 1.0, "B4", 108, extra_ticks=35),
            n(1.0, 1.5, "G5", 120, extra_ticks=40),
            n(2.5, 1.0, "F#5", 114),
            n(3.5, 0.5, "E5", 108),
            # Bar 2 (Bm)
            n(4.0, 1.5, "D5", 116, extra_ticks=35),
            n(5.5, 1.0, "B4", 108),
            n(6.5, 1.25, "F#4", 102),
            # Bar 3 (C)
            n(8.0, 1.0, "G4", 106),
            n(9.0, 1.5, "E5", 118, extra_ticks=40),
            n(10.5, 1.0, "D5", 112),
            n(11.5, 0.5, "C5", 108),
            # Bar 4 (Am)
            n(12.0, 1.5, "C5", 114, extra_ticks=35),
            n(13.5, 1.0, "B4", 110),
            n(14.5, 1.25, "A4", 106),
        ],
    },
    {
        "id": "035",
        "name": "Cathedral of Static",
        "group": "Haunted Melodies",
        "filename": "035_cathedral_of_static.mid",
        "bpm": 85,
        "tonal_center": "D",
        "scale": "Dorian",
        "bars": 4,
        "chords": ["Dm", "G", "Bb", "A"],
        "romans": ["i", "IV", "bVI", "V"],
        "borrowed_chords": "Bb (bVI from D natural minor), A (V major from D harmonic minor)",
        "motif_desc": "Bittersweet modal shift melody at 85 BPM: opens with the hopeful Dorian B4 natural over G major in bar 2, then darkens immediately to Bb4 in bar 3 and C#5 in bar 4.",
        "sound_suggestion": "Rounded triangle-based lead for a softer phrase.",
        "performance_suggestion": "Subtle pitch-env or vibrato on the bar-2 B4 -> bar-3 Bb4 contrast (not encoded in MIDI).",
        "legato": "yes",
        "notes": [
            # Bar 1 (Dm)
            n(0.0, 1.5, "A4", 110, extra_ticks=40),
            n(1.5, 1.0, "F5", 118, extra_ticks=35),
            n(2.5, 1.25, "E5", 112),
            # Bar 2 (G - Dorian IV with B4 natural)
            n(4.0, 1.5, "D5", 116, extra_ticks=40),
            n(5.5, 1.5, "B4", 120),
            n(7.25, 0.5, "G4", 104),
            # Bar 3 (Bb - borrowed bVI with A#4 = Bb4)
            n(8.0, 1.5, "A#4", 118, extra_ticks=40),  # Intentional modal mixture Bb4 (A#4)
            n(9.5, 1.0, "D5", 114),
            n(10.5, 1.25, "F5", 120),
            # Bar 4 (A - V major with C#5 leading tone)
            n(12.0, 1.5, "E5", 116, extra_ticks=45),
            n(13.5, 1.5, "C#5", 122),  # Intentional leading tone C#5
            n(15.25, 0.5, "E5", 110),
        ],
    },
    {
        "id": "036",
        "name": "Porcelain Mask",
        "group": "Haunted Melodies",
        "filename": "036_porcelain_mask.mid",
        "bpm": 100,
        "tonal_center": "G",
        "scale": "Natural Minor",
        "bars": 4,
        "chords": ["Gm", "Eb", "Cm", "D"],
        "romans": ["i", "bVI", "iv", "V"],
        "borrowed_chords": "D (V major borrowed from G harmonic minor)",
        "motif_desc": "Fragile music-box-meets-darkwave theme featuring an ornamental sixteenth-note turn on beat 2 of bars 1 and 3 and a wistful F#5 resolution.",
        "sound_suggestion": "Hollow pulse-wave lead with a short release.",
        "performance_suggestion": "none",
        "legato": "no",
        "notes": [
            # Bar 1 (Gm)
            n(0.0, 1.0, "D5", 112),
            n(1.0, 0.25, "D#5", 108),
            n(1.25, 0.25, "D5", 106),
            n(1.5, 0.5, "C5", 104),
            n(2.0, 1.5, "A#4", 116),
            # Bar 2 (Eb)
            n(4.0, 1.5, "G5", 120),
            n(5.5, 1.0, "F5", 112),
            n(6.5, 1.25, "D#5", 108),
            # Bar 3 (Cm)
            n(8.0, 1.0, "C5", 112),
            n(9.0, 0.25, "D5", 108),
            n(9.25, 0.25, "C5", 106),
            n(9.5, 0.5, "A#4", 104),
            n(10.0, 1.5, "G#5", 122),  # Intentional Neapolitan b2 inflection Ab5 (G#5)
            # Bar 4 (D)
            n(12.0, 1.5, "G5", 118),
            n(13.5, 1.5, "F#5", 120),  # Intentional leading tone F#5
            n(15.25, 0.5, "A4", 106),
        ],
    },
    {
        "id": "037",
        "name": "Winter on the Spree",
        "group": "Haunted Melodies",
        "filename": "037_winter_on_the_spree.mid",
        "bpm": 91,
        "tonal_center": "B",
        "scale": "Natural Minor",
        "bars": 4,
        "chords": ["Bm", "G", "Em", "F#m"],
        "romans": ["i", "bVI", "iv", "v"],
        "borrowed_chords": "none",
        "motif_desc": "Somber natural-minor theme keeping the v chord minor (F#m with A5 natural) for an understated, wintry European coldwave mood.",
        "sound_suggestion": "Sustained lead suited to subtle vibrato and spacious effects.",
        "performance_suggestion": "Slow filter LFO modulation (not encoded in MIDI).",
        "legato": "yes",
        "notes": [
            # Bar 1 (Bm)
            n(0.0, 1.5, "F#5", 116, extra_ticks=40),
            n(1.5, 1.0, "D5", 110),
            n(2.5, 1.25, "B4", 104),
            # Bar 2 (G)
            n(4.0, 1.0, "G5", 120, extra_ticks=35),
            n(5.0, 1.0, "F#5", 114),
            n(6.0, 1.5, "D5", 108),
            # Bar 3 (Em)
            n(8.0, 1.5, "E5", 116, extra_ticks=40),
            n(9.5, 1.0, "G5", 122),
            n(10.5, 1.25, "B5", 124),
            # Bar 4 (F#m - minor v)
            n(12.0, 1.5, "A5", 118, extra_ticks=40),
            n(13.5, 1.0, "F#5", 112),
            n(14.5, 1.25, "C#5", 106),
        ],
    },
    {
        "id": "038",
        "name": "Fading Polaroid",
        "group": "Haunted Melodies",
        "filename": "038_fading_polaroid.mid",
        "bpm": 96,
        "tonal_center": "F",
        "scale": "Natural Minor",
        "bars": 2,
        "chords": ["Fm", "Db"],
        "romans": ["i", "bVI"],
        "borrowed_chords": "none",
        "motif_desc": "Intimate 2-bar loop built on a major-seventh appoggiatura (C5 leaping to C6 and resolving to Db5/F5 over Db major7).",
        "sound_suggestion": "Rounded triangle-based lead for a softer phrase.",
        "performance_suggestion": "none",
        "legato": "yes",
        "notes": [
            # Bar 1 (Fm)
            n(0.0, 0.75, "C5", 108, extra_ticks=35),
            n(0.75, 1.25, "G#5", 120, extra_ticks=40),
            n(2.0, 1.0, "G5", 114),
            n(3.0, 0.75, "F5", 110),
            # Bar 2 (Db)
            n(4.0, 1.5, "C5", 116, extra_ticks=40),
            n(5.5, 1.0, "C#5", 118),
            n(6.5, 0.75, "F5", 112),
            n(7.25, 0.5, "D#5", 106),
        ],
    },
    {
        "id": "039",
        "name": "Nocturne for Androids",
        "group": "Haunted Melodies",
        "filename": "039_nocturne_for_androids.mid",
        "bpm": 87,
        "tonal_center": "C#",
        "scale": "Natural Minor",
        "bars": 8,
        "chords": ["C#m", "A", "F#m", "G#", "C#m", "A", "D", "G#"],
        "romans": ["i", "bVI", "iv", "V", "i", "bVI", "bII", "V"],
        "borrowed_chords": "G# (V major from C# harmonic minor), D (bII Neapolitan borrowed from C# Phrygian)",
        "motif_desc": "Cinematic Blade-Runner-inspired 8-bar nocturne: slow expressive leaps in C# minor that introduce a lush Neapolitan D-major bar (bar 7 with D5-F#5-A5) before resolving through B#4.",
        "sound_suggestion": "Expressive CS-style brassy mono lead with long release.",
        "performance_suggestion": "Channel aftertouch for vibrato and filter brilliance on sustained notes (not encoded in MIDI).",
        "legato": "yes",
        "notes": [
            # Bar 1 (C#m)
            n(0.0, 1.5, "G#4", 106, extra_ticks=45),
            n(1.5, 1.5, "E5", 118, extra_ticks=40),
            n(3.0, 0.75, "D#5", 112),
            # Bar 2 (A)
            n(4.0, 2.0, "C#5", 116, extra_ticks=40),
            n(6.0, 1.0, "B4", 108),
            n(7.0, 0.75, "A4", 104),
            # Bar 3 (F#m)
            n(8.0, 1.5, "A4", 110, extra_ticks=40),
            n(9.5, 1.5, "F#5", 122, extra_ticks=40),
            n(11.0, 0.75, "E5", 114),
            # Bar 4 (G#)
            n(12.0, 2.0, "D#5", 118, extra_ticks=45),
            n(14.0, 1.5, "C5", 116),  # Intentional leading tone B#4 (C5)
            # Bar 5 (C#m)
            n(16.0, 1.5, "C#5", 114, extra_ticks=40),
            n(17.5, 1.5, "G#5", 124, extra_ticks=45),
            n(19.0, 0.75, "F#5", 116),
            # Bar 6 (A)
            n(20.0, 1.5, "E5", 118, extra_ticks=40),
            n(21.5, 1.0, "C#5", 112),
            n(22.5, 1.25, "A4", 106),
            # Bar 7 (D - Borrowed Neapolitan bII featuring D5 natural)
            n(24.0, 1.5, "D5", 120, extra_ticks=45),  # Intentional Neapolitan b2 note D5
            n(25.5, 1.0, "F#5", 122),
            n(26.5, 1.25, "A5", 125),
            # Bar 8 (G# - V major)
            n(28.0, 1.5, "G#5", 120, extra_ticks=45),
            n(29.5, 1.25, "D#5", 114),
            n(31.0, 0.75, "C5", 118),  # Intentional leading tone B#4 (C5)
        ],
    },
    {
        "id": "040",
        "name": "Ashes of the Arcade",
        "group": "Haunted Melodies",
        "filename": "040_ashes_of_the_arcade.mid",
        "bpm": 93,
        "tonal_center": "E",
        "scale": "Harmonic Minor",
        "bars": 4,
        "chords": ["Em", "Am", "C", "B"],
        "romans": ["i", "iv", "bVI", "V"],
        "borrowed_chords": "none",
        "motif_desc": "Haunted closing theme of Group 4: a nostalgic high E5-B5-G5 motif that gradually collapses downward over four bars to end on an exposed D#5 leading tone.",
        "sound_suggestion": "Sustained lead suited to subtle vibrato and spacious effects.",
        "performance_suggestion": "none",
        "legato": "yes",
        "notes": [
            # Bar 1 (Em)
            n(0.0, 1.0, "E5", 112, extra_ticks=35),
            n(1.0, 1.5, "B5", 122, extra_ticks=40),
            n(2.5, 1.25, "G5", 114),
            # Bar 2 (Am)
            n(4.0, 1.0, "A5", 120, extra_ticks=35),
            n(5.0, 1.0, "G5", 114),
            n(6.0, 1.0, "F#5", 110),
            n(7.0, 0.75, "E5", 106),
            # Bar 3 (C)
            n(8.0, 1.5, "G5", 118, extra_ticks=40),
            n(9.5, 1.0, "E5", 112),
            n(10.5, 1.25, "C5", 108),
            # Bar 4 (B - V in E harmonic minor)
            n(12.0, 1.5, "B4", 112, extra_ticks=40),
            n(13.5, 1.25, "F#5", 118, extra_ticks=35),
            n(14.75, 1.0, "D#5", 122),
        ],
    },
]
