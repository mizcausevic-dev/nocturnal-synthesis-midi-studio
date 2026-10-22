import React, { useEffect, useRef } from 'react';
import { MidiPattern } from '../audio/synthEngine';

interface PianoRollCanvasProps {
  pattern: MidiPattern;
  currentTick: number;
  isPlaying: boolean;
  accentColor: string;
  secondaryColor: string;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function midiName(midi: number): string {
  const oct = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES[midi % 12]}${oct}`;
}

export const PianoRollCanvas: React.FC<PianoRollCanvasProps> = ({
  pattern,
  currentTick,
  isPlaying,
  accentColor,
  secondaryColor,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const leftGutter = 52;
    const topBarHeight = 32;
    const rollWidth = width - leftGutter - 12;
    const rollHeight = height - topBarHeight - 16;

    // Clear background
    ctx.fillStyle = '#090B10';
    ctx.fillRect(0, 0, width, height);

    // Determine pitch bounds with 2 semitone padding
    const minMidi = Math.max(55, pattern.minPitch - 2);
    const maxMidi = Math.min(96, pattern.maxPitch + 2);
    const pitchSpan = Math.max(12, maxMidi - minMidi + 1);
    const rowHeight = rollHeight / pitchSpan;

    // Draw horizontal pitch lanes
    ctx.font = '500 10px "JetBrains Mono", monospace';
    for (let m = minMidi; m <= maxMidi; m++) {
      const idx = maxMidi - m;
      const y = topBarHeight + idx * rowHeight;
      const isBlackKey = [1, 3, 6, 8, 10].includes(m % 12);
      const isTonic = NOTE_NAMES[m % 12] === pattern.tonalCenter;

      ctx.fillStyle = isTonic
        ? 'rgba(102, 252, 241, 0.08)'
        : isBlackKey
        ? 'rgba(255, 255, 255, 0.015)'
        : 'rgba(255, 255, 255, 0.035)';
      ctx.fillRect(leftGutter, y, rollWidth, rowHeight - 0.5);

      // Label C notes, tonic notes, or every 2nd pitch if span is compact
      if (m % 12 === 0 || isTonic || pitchSpan <= 18) {
        ctx.fillStyle = isTonic ? accentColor : 'rgba(197, 198, 199, 0.55)';
        ctx.fillText(midiName(m), 8, y + rowHeight * 0.72);
      }
    }

    // Draw vertical bar & beat grid lines + top chord progression banner
    const totalBeats = pattern.bars * 4;
    for (let b = 0; b <= totalBeats; b++) {
      const x = leftGutter + (b / totalBeats) * rollWidth;
      const isBarLine = b % 4 === 0;
      ctx.strokeStyle = isBarLine ? 'rgba(102, 252, 241, 0.26)' : 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = isBarLine ? 1.5 : 1;
      ctx.beginPath();
      ctx.moveTo(x, isBarLine ? 4 : topBarHeight);
      ctx.lineTo(x, topBarHeight + rollHeight);
      ctx.stroke();

      if (isBarLine && b < totalBeats) {
        const barIdx = b / 4;
        const chordSym = pattern.chords[barIdx] || '';
        const romanSym = pattern.romans[barIdx] || '';
        ctx.fillStyle = 'rgba(102, 252, 241, 0.12)';
        const barW = rollWidth / pattern.bars;
        ctx.fillRect(x + 2, 4, barW - 4, topBarHeight - 8);

        ctx.font = '700 11px "Space Grotesk", sans-serif';
        ctx.fillStyle = '#F4F1EA';
        ctx.fillText(`Bar ${barIdx + 1}: ${chordSym}`, x + 8, 20);

        ctx.font = '600 10px "JetBrains Mono", monospace';
        ctx.fillStyle = accentColor;
        const romanOffset = ctx.measureText(`Bar ${barIdx + 1}: ${chordSym}`).width + 16;
        if (romanOffset + 32 < barW) {
          ctx.fillText(`(${romanSym})`, x + romanOffset, 20);
        }
      }
    }

    // Parse out-of-scale MIDI numbers for visual badge
    const outSet = new Set<number>();
    if (pattern.outOfScaleNotes !== 'none') {
      const matches = pattern.outOfScaleNotes.matchAll(/MIDI (\d+)/g);
      for (const m of matches) {
        outSet.add(Number(m[1]));
      }
    }

    // Draw Notes and Legato Overlaps
    const notes = pattern.notes;
    for (let i = 0; i < notes.length; i++) {
      const n = notes[i];
      const nextNote = i + 1 < notes.length ? notes[i + 1] : null;
      const x = leftGutter + (n.startTick / pattern.loopTicks) * rollWidth;
      const w = Math.max(4, (n.durationTicks / pattern.loopTicks) * rollWidth);
      const y = topBarHeight + (maxMidi - n.midi) * rowHeight + 1.5;
      const h = Math.max(6, rowHeight - 3);

      const isActive =
        isPlaying && currentTick >= n.startTick && currentTick <= n.startTick + n.durationTicks;
      const isOut = outSet.has(n.midi);

      // Note fill
      ctx.fillStyle = isActive
        ? '#FFFFFF'
        : isOut
        ? '#FF2D55'
        : accentColor;

      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 3);
      ctx.fill();

      // Velocity bar inside note bottom
      const velRatio = n.velocity / 127;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(x + 1, y + h - 3, w * velRatio, 2);

      // Note name label inside wider notes
      if (w > 28 && rowHeight >= 11) {
        ctx.font = '600 9px "JetBrains Mono", monospace';
        ctx.fillStyle = isActive ? '#07060A' : '#07060A';
        ctx.fillText(n.name, x + 4, y + h - 4);
      }

      // Highlight intentional legato overlap zone (1..60 ticks) with next note
      if (nextNote && n.startTick + n.durationTicks > nextNote.startTick) {
        const overlapTicks = n.startTick + n.durationTicks - nextNote.startTick;
        const ox = leftGutter + (nextNote.startTick / pattern.loopTicks) * rollWidth;
        const ow = Math.max(4, (overlapTicks / pattern.loopTicks) * rollWidth);
        const ny = topBarHeight + (maxMidi - nextNote.midi) * rowHeight + 1.5;

        const topY = Math.min(y, ny);
        const botY = Math.max(y + h, ny + h);
        ctx.fillStyle = 'rgba(214, 255, 63, 0.28)';
        ctx.fillRect(ox - 1, topY, ow + 2, botY - topY);
        ctx.strokeStyle = secondaryColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(ox - 1, topY, ow + 2, botY - topY);
      }
    }

    // Draw Live Playhead
    if (isPlaying || currentTick > 0) {
      const px = leftGutter + (currentTick / pattern.loopTicks) * rollWidth;
      ctx.strokeStyle = '#FF2D55';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, topBarHeight);
      ctx.lineTo(px, topBarHeight + rollHeight);
      ctx.stroke();

      ctx.fillStyle = '#FF2D55';
      ctx.beginPath();
      ctx.arc(px, topBarHeight, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [pattern, currentTick, isPlaying, accentColor, secondaryColor]);

  return (
    <div className="relative w-full h-[310px] rounded-xl overflow-hidden border border-white/10 bg-[#090B10]">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
