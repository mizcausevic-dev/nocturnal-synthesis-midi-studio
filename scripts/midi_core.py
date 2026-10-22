#!/usr/bin/env python3
"""
Nocturnal Synthesis: 50 Production-Ready Synthwave & Darkwave Lead MIDI Patterns
Complete Composer, Format-0 SMF Binary Encoder, Independent Binary Re-Parser,
Validation Engine, Duplicate/Transposition/Sub-Loop Detector, and Packaging Script.

Conventions:
- Resolution: 480 ticks per quarter note (PPQ).
- Time Signature: 4/4 (4 quarter-note beats = 1,920 ticks per bar).
- Loop Lengths: 2 bars (3,840 ticks), 4 bars (7,680 ticks), 8 bars (15,360 ticks).
- Pitch Naming: C4 = MIDI note 60. Primary range 60-84; extended range 55-96.
- Format: Standard MIDI File Format 0, 1 track, MIDI channel 1 (0-indexed channel 0).
- Event Ordering: At any identical tick, Note-Off events precede Note-On events;
  End-of-Track (FF 2F 00) occurs at exact loop_ticks after any Note-Offs at that tick.
"""

import csv
import json
import math
import os
import shutil
import struct
import zipfile
from pathlib import Path
from typing import Dict, List, Optional, Tuple

PPQ = 480
TICKS_PER_BAR = PPQ * 4  # 1920

NOTE_NAMES_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
PITCH_CLASS_MAP = {
    "C": 0, "B#": 0,
    "C#": 1, "Db": 1,
    "D": 2,
    "D#": 3, "Eb": 3,
    "E": 4, "Fb": 4,
    "F": 5, "E#": 5,
    "F#": 6, "Gb": 6,
    "G": 7,
    "G#": 8, "Ab": 8,
    "A": 9,
    "A#": 10, "Bb": 10,
    "B": 11, "Cb": 11,
}

SCALE_INTERVALS = {
    "Natural Minor": [0, 2, 3, 5, 7, 8, 10],
    "Harmonic Minor": [0, 2, 3, 5, 7, 8, 11],
    "Dorian": [0, 2, 3, 5, 7, 9, 10],
    "Phrygian": [0, 1, 3, 5, 7, 8, 10],
}


def midi_to_name(midi_note: int) -> str:
    """Convert authoritative MIDI note number to note name where C4 = 60."""
    octave = (midi_note // 12) - 1
    name = NOTE_NAMES_SHARP[midi_note % 12]
    return f"{name}{octave}"


def name_to_midi(note_str: str) -> int:
    """Convert note name (e.g., 'A4', 'F#5', 'Bb3') to MIDI note where C4 = 60."""
    note_str = note_str.strip()
    if len(note_str) >= 3 and note_str[1] in ("#", "b"):
        pc_str = note_str[:2]
        oct_str = note_str[2:]
    else:
        pc_str = note_str[:1]
        oct_str = note_str[1:]
    pc = PITCH_CLASS_MAP[pc_str]
    octave = int(oct_str)
    return (octave + 1) * 12 + pc


def bpm_to_mpqn(bpm: int) -> int:
    """Nearest representable integer microseconds per quarter note for an integer BPM."""
    return int(round(60_000_000 / bpm))


def encode_vlq(value: int) -> bytes:
    """Encode non-negative integer as Standard MIDI Variable-Length Quantity."""
    if value < 0:
        raise ValueError(f"VLQ cannot encode negative delta: {value}")
    out = [value & 0x7F]
    value >>= 7
    while value > 0:
        out.append((value & 0x7F) | 0x80)
        value >>= 7
    out.reverse()
    return bytes(out)


def decode_vlq(data: bytes, idx: int) -> Tuple[int, int]:
    """Decode Standard MIDI Variable-Length Quantity starting at idx. Returns (value, next_idx)."""
    value = 0
    while True:
        if idx >= len(data):
            raise ValueError("Unexpected EOF while reading VLQ")
        b = data[idx]
        idx += 1
        value = (value << 7) | (b & 0x7F)
        if not (b & 0x80):
            break
    return value, idx


def write_format0_midi(
    filepath: Path,
    track_name: str,
    bpm: int,
    loop_ticks: int,
    notes: List[Tuple[int, int, int, int]],
) -> int:
    """
    Write a Format 0 Standard MIDI File with 1 track on channel 0 (MIDI Channel 1).
    notes: list of (start_tick, duration_ticks, midi_pitch, velocity)
    Returns encoded mpqn.
    """
    mpqn = bpm_to_mpqn(bpm)

    # Build raw track events at absolute ticks
    # Event tuple: (abs_tick, priority, raw_bytes)
    # Priorities at the same tick:
    #   0 = Meta events at tick 0 (Track Name, Tempo, Time Signature)
    #   1 = Note-Off (0x80) -> MUST precede Note-On at same tick
    #   2 = Note-On (0x90)
    #   3 = End-of-Track (FF 2F 00) -> MUST occur at loop_ticks after all Note-Offs
    events: List[Tuple[int, int, int, bytes]] = []

    name_bytes = track_name.encode("utf-8")
    events.append((0, 0, 0, b"\xFF\x03" + encode_vlq(len(name_bytes)) + name_bytes))
    events.append((0, 0, 1, b"\xFF\x51\x03" + mpqn.to_bytes(3, "big")))
    # 4/4 Time signature: nn=4, dd=2 (2^2=4), cc=24, bb=8
    events.append((0, 0, 2, b"\xFF\x58\x04\x04\x02\x18\x08"))

    for order_idx, (start_tick, dur_ticks, pitch, vel) in enumerate(notes):
        end_tick = start_tick + dur_ticks
        # Note-On on channel 0 (0x90)
        events.append((start_tick, 2, order_idx, bytes([0x90, pitch & 0x7F, vel & 0x7F])))
        # Explicit Note-Off on channel 0 (0x80, velocity 0)
        events.append((end_tick, 1, order_idx, bytes([0x80, pitch & 0x7F, 0])))

    # End of Track at exact loop boundary
    events.append((loop_ticks, 3, 999999, b"\xFF\x2F\x00"))

    events.sort(key=lambda e: (e[0], e[1], e[2]))

    track_body = bytearray()
    last_tick = 0
    for abs_tick, _prio, _ord, raw in events:
        delta = abs_tick - last_tick
        if delta < 0:
            raise ValueError(f"Negative delta tick {delta} in {track_name}")
        track_body.extend(encode_vlq(delta))
        track_body.extend(raw)
        last_tick = abs_tick

    header_chunk = b"MThd" + struct.pack(">IHHH", 6, 0, 1, PPQ)
    track_chunk = b"MTrk" + struct.pack(">I", len(track_body)) + bytes(track_body)

    filepath.parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, "wb") as f:
        f.write(header_chunk + track_chunk)

    return mpqn


def parse_midi_file(filepath: Path) -> Dict:
    """
    Independently reopen and parse a binary Standard MIDI File from disk.
    Verifies header, track chunk, meta events, channel messages, event ordering,
    and reconstructs authoritative note list.
    """
    data = filepath.read_bytes()
    if len(data) < 22:
        raise ValueError(f"{filepath.name}: File too short ({len(data)} bytes)")

    if data[0:4] != b"MThd":
        raise ValueError(f"{filepath.name}: Missing MThd header")
    hdr_len, fmt, ntrks, division = struct.unpack(">IHHH", data[4:14])
    if hdr_len != 6:
        raise ValueError(f"{filepath.name}: Unexpected MThd length {hdr_len}")

    if data[14:18] != b"MTrk":
        raise ValueError(f"{filepath.name}: Missing MTrk chunk header")
    trk_len = struct.unpack(">I", data[18:22])[0]
    trk_end = 22 + trk_len
    if trk_end != len(data):
        raise ValueError(f"{filepath.name}: Track length mismatch ({trk_end} vs {len(data)})")

    idx = 22
    abs_tick = 0
    track_name = None
    mpqn = None
    time_sig = None
    eot_tick = None
    eot_count = 0
    prohibited_messages = []
    channels_used = set()

    # Track ordering at each tick to confirm Note-Offs always precede Note-Ons at same tick
    last_event_tick = -1
    seen_note_on_at_current_tick = False
    same_tick_ordering_violations = []

    active_notes: Dict[int, List[Tuple[int, int]]] = {}  # pitch -> list of (start_tick, vel)
    parsed_notes: List[Tuple[int, int, int, int]] = []  # (start_tick, dur_ticks, pitch, vel)
    orphan_note_offs = []
    events_after_eot = 0

    while idx < trk_end:
        delta, idx = decode_vlq(data, idx)
        abs_tick += delta
        if abs_tick != last_event_tick:
            last_event_tick = abs_tick
            seen_note_on_at_current_tick = False

        if eot_count > 0:
            events_after_eot += 1

        status = data[idx]
        idx += 1

        if status == 0xFF:
            meta_type = data[idx]
            idx += 1
            meta_len, idx = decode_vlq(data, idx)
            meta_bytes = data[idx : idx + meta_len]
            idx += meta_len

            if meta_type == 0x03:
                track_name = meta_bytes.decode("utf-8", errors="replace")
            elif meta_type == 0x51:
                if len(meta_bytes) != 3 or abs_tick != 0:
                    raise ValueError(f"{filepath.name}: Invalid tempo meta event at tick {abs_tick}")
                mpqn = int.from_bytes(meta_bytes, "big")
            elif meta_type == 0x58:
                if len(meta_bytes) != 4 or abs_tick != 0:
                    raise ValueError(f"{filepath.name}: Invalid time signature event at tick {abs_tick}")
                time_sig = (meta_bytes[0], 2 ** meta_bytes[1], meta_bytes[2], meta_bytes[3])
            elif meta_type == 0x2F:
                eot_count += 1
                eot_tick = abs_tick
        elif (status & 0xF0) == 0x80:
            ch = status & 0x0F
            channels_used.add(ch)
            pitch = data[idx]
            vel = data[idx + 1]
            idx += 2
            if seen_note_on_at_current_tick:
                same_tick_ordering_violations.append((abs_tick, pitch))
            if pitch not in active_notes or not active_notes[pitch]:
                orphan_note_offs.append((abs_tick, pitch, vel))
            else:
                start_tick, on_vel = active_notes[pitch].pop(0)
                parsed_notes.append((start_tick, abs_tick - start_tick, pitch, on_vel))
        elif (status & 0xF0) == 0x90:
            ch = status & 0x0F
            channels_used.add(ch)
            pitch = data[idx]
            vel = data[idx + 1]
            idx += 2
            if vel == 0:
                # We require explicit 0x80 note-off events, not 0x90 vel 0
                prohibited_messages.append(f"Implicit note-off (0x90 vel=0) at tick {abs_tick}")
            seen_note_on_at_current_tick = True
            active_notes.setdefault(pitch, []).append((abs_tick, vel))
        elif (status & 0xF0) in (0xA0, 0xB0, 0xE0):
            prohibited_messages.append(f"Status 0x{status:02X} at tick {abs_tick}")
            idx += 2
        elif (status & 0xF0) in (0xC0, 0xD0):
            prohibited_messages.append(f"Status 0x{status:02X} at tick {abs_tick}")
            idx += 1
        else:
            prohibited_messages.append(f"Unhandled status 0x{status:02X} at tick {abs_tick}")
            break

    unclosed = {p: v for p, v in active_notes.items() if v}
    parsed_notes.sort(key=lambda n: (n[0], n[2]))

    return {
        "format": fmt,
        "ntrks": ntrks,
        "division": division,
        "track_name": track_name,
        "mpqn": mpqn,
        "time_sig": time_sig,
        "eot_tick": eot_tick,
        "eot_count": eot_count,
        "events_after_eot": events_after_eot,
        "prohibited_messages": prohibited_messages,
        "channels_used": channels_used,
        "same_tick_ordering_violations": same_tick_ordering_violations,
        "orphan_note_offs": orphan_note_offs,
        "unclosed_notes": unclosed,
        "notes": parsed_notes,
    }


def n(beat: float, dur_beats: float, note_str: str, vel: int, shift_ticks: int = 0, extra_ticks: int = 0) -> Tuple[int, int, int, int]:
    """
    Helper to construct a note tuple (start_tick, duration_ticks, midi_pitch, velocity)
    from zero-based quarter-note beats, with optional tick micro-offset (shift_ticks)
    and tick duration extension/trim (extra_ticks, e.g. +30 ticks for intentional legato overlap).
    """
    start_tick = int(round(beat * PPQ)) + shift_ticks
    dur_ticks = int(round(dur_beats * PPQ)) + extra_ticks
    pitch = name_to_midi(note_str)
    return (start_tick, dur_ticks, pitch, vel)
