import { midiToFreq } from '@/lib/music'
import type { MidiNote, PatchId } from '@/lib/types'

export interface LoopSpec {
  id: string
  notes: MidiNote[]
  loopTicks: number
  ppq: number
  bpm: number
  chordTones: number[][]
}

export interface EngineSettings {
  patch: PatchId
  glide: boolean
  velocity: boolean
  pad: boolean
  drums: boolean
  space: boolean
  volume: number
}

type LeadEvent = { tick: number; kind: 'lead'; phrase: MidiNote[] }
type PadEvent = { tick: number; kind: 'pad'; bar: number }
type DrumEvent = { tick: number; kind: 'drum'; step: number }
type Event = LeadEvent | PadEvent | DrumEvent

interface LoopRun {
  spec: LoopSpec
  start: number
  secPerTick: number
  events: Event[]
  index: number
}

interface Voice {
  out: GainNode
  sources: AudioScheduledSourceNode[]
  until: number
}

const PATCH_GAIN: Record<PatchId, number> = {
  'neon-saw': 0.3,
  'hollow-pulse': 0.27,
  'glass-triangle': 0.5,
  'wide-unison': 0.22,
}

const LOOKAHEAD = 0.12
const HIDDEN_LOOKAHEAD = 1.6
const INTERVAL_MS = 25

export class LeadEngine {
  settings: EngineSettings
  playing = false
  analyser: AnalyserNode | null = null

  private ctx: AudioContext | null = null
  private master!: GainNode
  private leadBus!: GainNode
  private padBus!: GainNode
  private drumBus!: GainNode
  private send!: GainNode
  private delayL!: DelayNode
  private delayR!: DelayNode
  private noise!: AudioBuffer
  private pulse!: PeriodicWave
  private voices: Voice[] = []
  private timer: number | null = null
  private run: LoopRun | null = null
  private history: Array<{ start: number; secPerTick: number; loopTicks: number; id: string }> = []
  private spec: LoopSpec | null = null
  private bpm = 120
  private listeners = new Set<() => void>()

  constructor(settings: EngineSettings) {
    this.settings = { ...settings }
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private emit() {
    this.listeners.forEach((fn) => fn())
  }

  private ensureContext(): AudioContext {
    if (this.ctx) return this.ctx
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx({ latencyHint: 'interactive' })
    this.ctx = ctx

    this.master = ctx.createGain()
    this.master.gain.value = this.settings.volume
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -14
    comp.ratio.value = 3
    comp.attack.value = 0.004
    comp.release.value = 0.18
    this.analyser = ctx.createAnalyser()
    this.analyser.fftSize = 1024
    this.master.connect(comp).connect(this.analyser).connect(ctx.destination)

    this.leadBus = ctx.createGain()
    this.padBus = ctx.createGain()
    this.padBus.gain.value = 0.9
    this.drumBus = ctx.createGain()
    this.drumBus.gain.value = 0.55
    this.leadBus.connect(this.master)
    this.padBus.connect(this.master)
    this.drumBus.connect(this.master)

    this.send = ctx.createGain()
    this.send.gain.value = this.settings.space ? 0.26 : 0
    this.delayL = ctx.createDelay(2)
    this.delayR = ctx.createDelay(2)
    const feedback = ctx.createGain()
    feedback.gain.value = 0.32
    const tone = ctx.createBiquadFilter()
    tone.type = 'lowpass'
    tone.frequency.value = 3200
    const merger = ctx.createChannelMerger(2)
    this.send.connect(this.delayL)
    this.delayL.connect(this.delayR)
    this.delayR.connect(tone).connect(feedback).connect(this.delayL)
    this.delayL.connect(merger, 0, 0)
    this.delayR.connect(merger, 0, 1)
    const wet = ctx.createGain()
    wet.gain.value = 0.55
    merger.connect(wet).connect(this.master)

    const len = ctx.sampleRate
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = this.noise.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1

    const harmonics = 48
    const real = new Float32Array(harmonics)
    const imag = new Float32Array(harmonics)
    for (let n = 1; n < harmonics; n++) real[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * 0.25)
    this.pulse = ctx.createPeriodicWave(real, imag)

    document.addEventListener('visibilitychange', () => this.pump())
    return ctx
  }

  setSettings(next: Partial<EngineSettings>) {
    this.settings = { ...this.settings, ...next }
    if (!this.ctx) return
    const now = this.ctx.currentTime
    if (next.volume !== undefined) this.master.gain.setTargetAtTime(next.volume, now, 0.03)
    if (next.space !== undefined) this.send.gain.setTargetAtTime(next.space ? 0.26 : 0, now, 0.05)
  }

  setTempo(bpm: number) {
    this.bpm = bpm
  }

  get tempo() {
    return this.bpm
  }

  get currentId() {
    return this.spec?.id ?? null
  }

  async play(spec: LoopSpec, bpm?: number) {
    const ctx = this.ensureContext()
    if (ctx.state !== 'running') await ctx.resume()
    this.silence(0.015)
    this.spec = spec
    if (bpm) this.bpm = bpm
    this.history = []
    this.run = this.startLoop(ctx.currentTime + 0.06)
    if (this.timer === null) this.timer = window.setInterval(() => this.pump(), INTERVAL_MS)
    this.playing = true
    this.pump()
    this.emit()
  }

  stop() {
    if (this.timer !== null) {
      window.clearInterval(this.timer)
      this.timer = null
    }
    this.silence(0.02)
    this.run = null
    this.history = []
    this.playing = false
    this.emit()
  }

  position(): { id: string; tick: number; loopTicks: number } | null {
    if (!this.ctx || !this.playing) return null
    const now = this.ctx.currentTime
    for (let i = this.history.length - 1; i >= 0; i--) {
      const h = this.history[i]
      if (h.start <= now) {
        return { id: h.id, tick: Math.min(h.loopTicks, (now - h.start) / h.secPerTick), loopTicks: h.loopTicks }
      }
    }
    return null
  }

  private startLoop(start: number): LoopRun {
    const spec = this.spec!
    const secPerTick = 60 / (this.bpm * spec.ppq)
    const configureDelay = () => {
      const beat = 60 / this.bpm
      this.delayL.delayTime.setTargetAtTime(beat * 0.75, start, 0.05)
      this.delayR.delayTime.setTargetAtTime(beat * 0.5, start, 0.05)
    }
    configureDelay()
    this.history.push({ start, secPerTick, loopTicks: spec.loopTicks, id: spec.id })
    if (this.history.length > 4) this.history.shift()
    return { spec, start, secPerTick, events: this.buildEvents(spec), index: 0 }
  }

  private buildEvents(spec: LoopSpec): Event[] {
    const events: Event[] = []
    const notes = spec.notes
    let i = 0
    while (i < notes.length) {
      const phrase = [notes[i]]
      if (this.settings.glide) {
        while (i + phrase.length < notes.length) {
          const last = phrase[phrase.length - 1]
          const next = notes[i + phrase.length]
          if (next.ticks < last.ticks + last.durationTicks) phrase.push(next)
          else break
        }
      }
      events.push({ tick: phrase[0].ticks, kind: 'lead', phrase })
      i += phrase.length
    }
    const barTicks = spec.ppq * 4
    for (let b = 0; b * barTicks < spec.loopTicks; b++) events.push({ tick: b * barTicks, kind: 'pad', bar: b })
    const eighth = spec.ppq / 2
    for (let t = 0, s = 0; t < spec.loopTicks; t += eighth, s++) events.push({ tick: t, kind: 'drum', step: s })
    return events.sort((a, b) => a.tick - b.tick)
  }

  private pump() {
    const ctx = this.ctx
    if (!ctx || !this.run || !this.playing) return
    const horizon = ctx.currentTime + (document.hidden ? HIDDEN_LOOKAHEAD : LOOKAHEAD)
    let run = this.run
    for (let guard = 0; guard < 4096; guard++) {
      if (run.index >= run.events.length) {
        const nextStart = run.start + run.spec.loopTicks * run.secPerTick
        if (nextStart >= horizon) break
        run = this.run = this.startLoop(nextStart)
        continue
      }
      const ev = run.events[run.index]
      const when = run.start + ev.tick * run.secPerTick
      if (when >= horizon) break
      run.index++
      if (ev.kind === 'lead') this.playPhrase(ev.phrase, run)
      else if (ev.kind === 'pad' && this.settings.pad) this.playPad(ev.bar, when, run)
      else if (ev.kind === 'drum' && this.settings.drums) this.playDrum(ev.step, when)
    }
    const now = ctx.currentTime
    this.voices = this.voices.filter((v) => v.until > now)
  }

  private level(velocity: number): number {
    return this.settings.velocity ? 0.3 + 0.7 * (velocity / 127) : 0.78
  }

  private playPhrase(phrase: MidiNote[], run: LoopRun) {
    const ctx = this.ctx!
    const patch = this.settings.patch
    const spt = run.secPerTick
    const first = phrase[0]
    const last = phrase[phrase.length - 1]
    const start = Math.max(ctx.currentTime, run.start + first.ticks * spt)
    const end = run.start + (last.ticks + last.durationTicks) * spt
    const base = PATCH_GAIN[patch]

    const out = ctx.createGain()
    out.gain.value = 0
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    const sources: AudioScheduledSourceNode[] = []
    const oscs: OscillatorNode[] = []

    const addOsc = (type: OscillatorType | 'pulse', detune: number, gain: number, mult = 1, pan = 0) => {
      const o = ctx.createOscillator()
      if (type === 'pulse') o.setPeriodicWave(this.pulse)
      else o.type = type
      o.detune.value = detune
      o.frequency.value = midiToFreq(first.midi) * mult
      const g = ctx.createGain()
      g.gain.value = gain
      if (pan && ctx.createStereoPanner) {
        const p = ctx.createStereoPanner()
        p.pan.value = pan
        o.connect(g).connect(p).connect(filter)
      } else o.connect(g).connect(filter)
      ;(o as OscillatorNode & { mult?: number }).mult = mult
      oscs.push(o)
      sources.push(o)
    }

    let attack = 0.006
    let release = 0.1
    let sustain = 0.72
    const velAmt = this.level(first.velocity)

    if (patch === 'neon-saw') {
      addOsc('sawtooth', 0, 1)
      filter.Q.value = 5
      const lo = 700
      const peak = lo + 3600 * velAmt
      filter.frequency.setValueAtTime(lo, start)
      filter.frequency.linearRampToValueAtTime(peak, start + 0.012)
      filter.frequency.setTargetAtTime(lo + 900, start + 0.012, 0.09)
    } else if (patch === 'hollow-pulse') {
      addOsc('pulse', 0, 1)
      filter.Q.value = 0.9
      filter.frequency.value = 3200
      attack = 0.003
      release = 0.05
      sustain = 0.8
    } else if (patch === 'glass-triangle') {
      addOsc('triangle', 0, 1)
      addOsc('sine', 0, 0.22, 2)
      filter.Q.value = 0.4
      filter.frequency.value = 2600
      attack = 0.028
      release = 0.22
      sustain = 0.85
    } else {
      addOsc('sawtooth', -7, 0.75, 1, -0.35)
      addOsc('sawtooth', 7, 0.75, 1, 0.35)
      filter.Q.value = 1.6
      filter.frequency.setValueAtTime(1100, start)
      filter.frequency.linearRampToValueAtTime(1100 + 2600 * velAmt, start + 0.06)
      filter.frequency.setTargetAtTime(2200, start + 0.06, 0.3)
      attack = 0.012
      release = 0.34
      sustain = 0.8
      if (end - start > 0.5) {
        const lfo = ctx.createOscillator()
        lfo.frequency.value = 5.5
        const depth = ctx.createGain()
        depth.gain.setValueAtTime(0, start)
        depth.gain.setValueAtTime(0, start + 0.35)
        depth.gain.linearRampToValueAtTime(9, start + 0.7)
        lfo.connect(depth)
        oscs.forEach((o) => depth.connect(o.detune))
        sources.push(lfo)
      }
    }

    let chain: AudioNode = filter
    if (patch === 'hollow-pulse') {
      const hp = ctx.createBiquadFilter()
      hp.type = 'highpass'
      hp.frequency.value = 180
      filter.connect(hp)
      chain = hp
    }
    chain.connect(out)
    out.connect(this.leadBus)
    out.connect(this.send)

    const peak = base * velAmt
    out.gain.setValueAtTime(0, start)
    out.gain.linearRampToValueAtTime(peak, start + attack)
    out.gain.setTargetAtTime(peak * sustain, start + attack, 0.08)

    for (let k = 1; k < phrase.length; k++) {
      const n = phrase[k]
      const t = run.start + n.ticks * spt
      oscs.forEach((o) => {
        const mult = (o as OscillatorNode & { mult?: number }).mult ?? 1
        o.frequency.setTargetAtTime(midiToFreq(n.midi) * mult, t, 0.022)
      })
      out.gain.setTargetAtTime(base * this.level(n.velocity) * sustain, t, 0.03)
    }

    out.gain.setTargetAtTime(0, end, release / 4)
    const stopAt = end + release + 0.08
    sources.forEach((s) => {
      s.start(start)
      s.stop(stopAt)
    })
    sources[0].onended = () => out.disconnect()
    this.voices.push({ out, sources, until: stopAt })
  }

  private playPad(bar: number, when: number, run: LoopRun) {
    const ctx = this.ctx!
    const tones = run.spec.chordTones[bar] ?? run.spec.chordTones[0]
    if (!tones) return
    const dur = run.spec.ppq * 4 * run.secPerTick
    const end = when + dur
    const out = ctx.createGain()
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 900
    lp.Q.value = 0.6
    lp.connect(out).connect(this.padBus)
    out.gain.setValueAtTime(0, when)
    out.gain.linearRampToValueAtTime(0.05, when + 0.22)
    out.gain.setTargetAtTime(0, end - 0.12, 0.09)
    const rootMidi = 48 + tones[0]
    const sources: AudioScheduledSourceNode[] = []
    for (const pc of tones) {
      const midi = rootMidi + ((pc - tones[0] + 12) % 12)
      for (const det of [-6, 6]) {
        const o = ctx.createOscillator()
        o.type = 'sawtooth'
        o.detune.value = det
        o.frequency.value = midiToFreq(midi)
        o.connect(lp)
        o.start(when)
        o.stop(end + 0.4)
        sources.push(o)
      }
    }
    sources[0].onended = () => out.disconnect()
    this.voices.push({ out, sources, until: end + 0.4 })
  }

  private playDrum(step: number, when: number) {
    const ctx = this.ctx!
    const out = ctx.createGain()
    out.connect(this.drumBus)
    const sources: AudioScheduledSourceNode[] = []
    if (step % 2 === 0) {
      const o = ctx.createOscillator()
      o.frequency.setValueAtTime(150, when)
      o.frequency.exponentialRampToValueAtTime(46, when + 0.12)
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.95, when)
      g.gain.exponentialRampToValueAtTime(0.001, when + 0.3)
      o.connect(g).connect(out)
      o.start(when)
      o.stop(when + 0.32)
      sources.push(o)
    }
    if (step % 8 === 2 || step % 8 === 6) {
      const n = ctx.createBufferSource()
      n.buffer = this.noise
      const bp = ctx.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = 1900
      bp.Q.value = 0.8
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.42, when)
      g.gain.exponentialRampToValueAtTime(0.001, when + 0.17)
      n.connect(bp).connect(g).connect(out)
      n.start(when)
      n.stop(when + 0.2)
      sources.push(n)
    }
    if (step % 2 === 1) {
      const n = ctx.createBufferSource()
      n.buffer = this.noise
      const hp = ctx.createBiquadFilter()
      hp.type = 'highpass'
      hp.frequency.value = 7500
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.14, when)
      g.gain.exponentialRampToValueAtTime(0.001, when + 0.04)
      n.connect(hp).connect(g).connect(out)
      n.start(when)
      n.stop(when + 0.06)
      sources.push(n)
    }
    if (!sources.length) {
      out.disconnect()
      return
    }
    sources[0].onended = () => out.disconnect()
    this.voices.push({ out, sources, until: when + 0.35 })
  }

  private silence(fade: number) {
    if (!this.ctx) return
    const now = this.ctx.currentTime
    for (const v of this.voices) {
      v.out.gain.cancelScheduledValues(now)
      v.out.gain.setTargetAtTime(0, now, fade)
      v.sources.forEach((s) => {
        try {
          s.stop(now + fade * 6)
        } catch {
          /* already stopped */
        }
      })
    }
    this.voices = []
  }
}
