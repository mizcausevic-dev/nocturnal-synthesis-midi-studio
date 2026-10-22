export type SynthWaveType = 'sawtooth' | 'pulse' | 'triangle' | 'supersaw';
export type SynthFxMode = 'dry' | 'nocturnal_fx';

export interface NoteEvent {
  midi: number;
  name: string;
  startTick: number;
  durationTicks: number;
  startBeat: number;
  durationBeats: number;
  velocity: number;
}

export interface MidiPattern {
  id: string;
  name: string;
  group: string;
  filename: string;
  bpm: number;
  mpqn: number;
  tonalCenter: string;
  scale: string;
  outOfScaleNotes: string;
  bars: number;
  loopTicks: number;
  chords: string[];
  romans: string[];
  borrowedChords: string;
  motifDesc: string;
  soundSuggestion: string;
  performanceSuggestion: string;
  legato: boolean;
  noteCount: number;
  minPitch: number;
  maxPitch: number;
  notes: NoteEvent[];
}

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export class NocturnalSynthEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private currentPattern: MidiPattern | null = null;
  private waveType: SynthWaveType = 'sawtooth';
  private fxMode: SynthFxMode = 'dry';
  private bpmOverride: number | null = null;
  private portamentoMs = 28;
  private filterCutoffHz = 3400;
  private masterVolume = 0.7;

  private startTimeSec = 0;
  private rafId: number | null = null;
  private scheduledOscs: Array<{ stop: () => void }> = [];
  private loopTimerId: number | null = null;
  private onTickCallback: ((tick: number, playing: boolean, activeMidis: number[]) => void) | null = null;

  public setOnTick(cb: (tick: number, playing: boolean, activeMidis: number[]) => void) {
    this.onTickCallback = cb;
  }

  public setConfig(opts: {
    waveType?: SynthWaveType;
    fxMode?: SynthFxMode;
    bpmOverride?: number | null;
    portamentoMs?: number;
    filterCutoffHz?: number;
    masterVolume?: number;
  }) {
    if (opts.waveType !== undefined) this.waveType = opts.waveType;
    if (opts.fxMode !== undefined) this.fxMode = opts.fxMode;
    if (opts.bpmOverride !== undefined) this.bpmOverride = opts.bpmOverride;
    if (opts.portamentoMs !== undefined) this.portamentoMs = opts.portamentoMs;
    if (opts.filterCutoffHz !== undefined) this.filterCutoffHz = opts.filterCutoffHz;
    if (opts.masterVolume !== undefined) this.masterVolume = opts.masterVolume;

    if (this.isPlaying && this.currentPattern) {
      // Restart loop seamlessly with updated parameters
      const pat = this.currentPattern;
      this.stop();
      this.play(pat);
    }
  }

  public inferWaveFromSuggestion(suggestion: string): SynthWaveType {
    const s = suggestion.toLowerCase();
    if (s.includes('triangle')) return 'triangle';
    if (s.includes('pulse') || s.includes('square')) return 'pulse';
    if (s.includes('dual') || s.includes('stadium') || s.includes('flagship')) return 'supersaw';
    return 'sawtooth';
  }

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public play(pattern: MidiPattern) {
    this.stop();
    const ctx = this.ensureContext();
    this.currentPattern = pattern;
    this.isPlaying = true;
    this.scheduleLoopIteration(ctx, pattern);
  }

  private scheduleLoopIteration(ctx: AudioContext, pattern: MidiPattern) {
    if (!this.isPlaying) return;

    const bpm = this.bpmOverride || pattern.bpm;
    const secPerBeat = 60 / bpm;
    const secPerTick = secPerBeat / 480;
    const loopDurationSec = pattern.loopTicks * secPerTick;

    const now = ctx.currentTime + 0.03;
    this.startTimeSec = now;

    // Master bus
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(this.masterVolume * 0.42, now);
    masterGain.connect(ctx.destination);

    // Optional FX send (Stereo Ping-Pong Delay + Chorus/Space) ONLY when fxMode === 'nocturnal_fx'
    let fxInput: AudioNode | null = null;
    if (this.fxMode === 'nocturnal_fx') {
      const delayL = ctx.createDelay(2.0);
      const delayR = ctx.createDelay(2.0);
      delayL.delayTime.setValueAtTime(secPerBeat * 0.75, now); // dotted eighth
      delayR.delayTime.setValueAtTime(secPerBeat * 0.5, now);  // eighth

      const fbL = ctx.createGain();
      const fbR = ctx.createGain();
      fbL.gain.setValueAtTime(0.32, now);
      fbR.gain.setValueAtTime(0.28, now);

      const delayFilter = ctx.createBiquadFilter();
      delayFilter.type = 'lowpass';
      delayFilter.frequency.setValueAtTime(2400, now);

      const wetGain = ctx.createGain();
      wetGain.gain.setValueAtTime(0.28, now);

      delayL.connect(fbL);
      fbL.connect(delayR);
      delayR.connect(fbR);
      fbR.connect(delayL);

      delayL.connect(delayFilter);
      delayR.connect(delayFilter);
      delayFilter.connect(wetGain);
      wetGain.connect(masterGain);

      fxInput = delayL;
    }

    const notes = pattern.notes;
    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      const prevNote = i > 0 ? notes[i - 1] : null;
      const isLegatoFromPrev =
        prevNote !== null && prevNote.startTick + prevNote.durationTicks > note.startTick;

      const noteStartSec = now + note.startTick * secPerTick;
      const noteDurSec = Math.max(0.03, note.durationTicks * secPerTick);
      const noteEndSec = noteStartSec + noteDurSec;

      const targetFreq = midiToFreq(note.midi);
      const startFreq =
        isLegatoFromPrev && prevNote && pattern.legato
          ? midiToFreq(prevNote.midi)
          : targetFreq;

      const velNorm = note.velocity / 127;

      const voiceFilter = ctx.createBiquadFilter();
      voiceFilter.type = 'lowpass';
      const baseCutoff = this.filterCutoffHz * (0.65 + velNorm * 0.55);
      voiceFilter.Q.setValueAtTime(this.fxMode === 'nocturnal_fx' ? 3.2 : 1.8, noteStartSec);
      voiceFilter.frequency.setValueAtTime(Math.min(12000, baseCutoff * 1.6), noteStartSec);
      voiceFilter.frequency.exponentialRampToValueAtTime(
        Math.max(400, baseCutoff * 0.72),
        noteStartSec + Math.min(0.28, noteDurSec * 0.8)
      );

      const voiceGain = ctx.createGain();
      const peakGain = 0.25 + velNorm * 0.45;
      const attackSec = isLegatoFromPrev ? 0.004 : 0.008;
      const releaseSec = this.fxMode === 'nocturnal_fx' ? 0.065 : 0.022;

      voiceGain.gain.setValueAtTime(0.0001, noteStartSec);
      voiceGain.gain.linearRampToValueAtTime(peakGain, noteStartSec + attackSec);
      voiceGain.gain.exponentialRampToValueAtTime(
        peakGain * 0.72,
        noteStartSec + Math.min(0.14, noteDurSec * 0.5)
      );
      voiceGain.gain.setValueAtTime(peakGain * 0.7, Math.max(noteStartSec + attackSec, noteEndSec - 0.01));
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, noteEndSec + releaseSec);

      voiceFilter.connect(voiceGain);
      voiceGain.connect(masterGain);
      if (fxInput) {
        voiceGain.connect(fxInput);
      }

      const oscsToStop: OscillatorNode[] = [];
      const glideSec =
        isLegatoFromPrev && pattern.legato ? Math.min(0.06, this.portamentoMs / 1000) : 0;

      const createOsc = (type: OscillatorType, detuneCents: number, gainScale: number, octaveShift = 0) => {
        const osc = ctx.createOscillator();
        const oGain = ctx.createGain();
        osc.type = type;
        osc.detune.setValueAtTime(detuneCents, noteStartSec);
        const mult = Math.pow(2, octaveShift);
        osc.frequency.setValueAtTime(startFreq * mult, noteStartSec);
        if (glideSec > 0 && startFreq !== targetFreq) {
          osc.frequency.exponentialRampToValueAtTime(targetFreq * mult, noteStartSec + glideSec);
        }
        oGain.gain.setValueAtTime(gainScale, noteStartSec);
        osc.connect(oGain);
        oGain.connect(voiceFilter);
        osc.start(noteStartSec);
        osc.stop(noteEndSec + releaseSec + 0.01);
        oscsToStop.push(osc);
      };

      if (this.waveType === 'sawtooth') {
        createOsc('sawtooth', 0, 0.9);
      } else if (this.waveType === 'pulse') {
        createOsc('square', -4, 0.75);
        createOsc('sawtooth', 4, 0.25);
      } else if (this.waveType === 'triangle') {
        createOsc('triangle', 0, 0.95);
        createOsc('sine', 0, 0.35, -1);
      } else if (this.waveType === 'supersaw') {
        createOsc('sawtooth', -11, 0.45);
        createOsc('sawtooth', 0, 0.55);
        createOsc('sawtooth', 11, 0.45);
        if (this.fxMode === 'nocturnal_fx') {
          createOsc('square', 0, 0.22, -1);
        }
      }

      this.scheduledOscs.push({
        stop: () => {
          oscsToStop.forEach((o) => {
            try {
              o.stop();
              o.disconnect();
            } catch {
              // ignore already stopped
            }
          });
        },
      });
    }

    // Animation loop for playhead tick tracking
    const updatePlayhead = () => {
      if (!this.isPlaying || !this.ctx || !this.currentPattern) return;
      const elapsed = this.ctx.currentTime - this.startTimeSec;
      if (elapsed >= 0) {
        const currentTick = Math.min(
          this.currentPattern.loopTicks,
          Math.floor(elapsed / secPerTick)
        );
        const activeMidis = this.currentPattern.notes
          .filter((n) => currentTick >= n.startTick && currentTick <= n.startTick + n.durationTicks)
          .map((n) => n.midi);
        this.onTickCallback?.(currentTick, true, activeMidis);
      }
      this.rafId = requestAnimationFrame(updatePlayhead);
    };
    this.rafId = requestAnimationFrame(updatePlayhead);

    this.loopTimerId = window.setTimeout(() => {
      if (this.isPlaying && this.currentPattern) {
        this.scheduledOscs = [];
        this.scheduleLoopIteration(ctx, this.currentPattern);
      }
    }, Math.max(100, loopDurationSec * 1000));
  }

  public stop() {
    this.isPlaying = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.loopTimerId !== null) {
      clearTimeout(this.loopTimerId);
      this.loopTimerId = null;
    }
    this.scheduledOscs.forEach((item) => item.stop());
    this.scheduledOscs = [];
    this.onTickCallback?.(0, false, []);
  }
}
