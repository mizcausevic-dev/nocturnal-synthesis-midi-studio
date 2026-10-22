import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  BookOpen,
  CheckCircle2,
  Cpu,
  Download,
  FileSpreadsheet,
  Filter,
  GitBranch,
  Layers,
  Moon,
  Music,
  Palette,
  Pause,
  Play,
  Radio,
  Search,
  ShieldCheck,
  Sliders,
  Sparkles,
  Sun,
  Volume2,
  Zap,
} from 'lucide-react';
import patternsPayload from './data/patterns.json';
import {
  MidiPattern,
  NocturnalSynthEngine,
  SynthFxMode,
  SynthWaveType,
} from './audio/synthEngine';
import { PianoRollCanvas } from './components/PianoRollCanvas';

type ThemeId =
  | 'cosmic-cyber'
  | 'bento-grid'
  | 'swiss-architect'
  | 'aqua-web2'
  | 'pop-brutalist'
  | 'steel-tactical'
  | 'parchment';

interface ThemeTokens {
  id: ThemeId;
  label: string;
  bgDark: string;
  panelDark: string;
  textDark: string;
  bgLight: string;
  panelLight: string;
  textLight: string;
  accent: string;
  secondary: string;
  border: string;
}

const THEMES: ThemeTokens[] = [
  {
    id: 'cosmic-cyber',
    label: 'Cosmic Cyber',
    bgDark: '#0B0C10',
    panelDark: '#141923',
    textDark: '#E6EDF3',
    bgLight: '#F0F4F8',
    panelLight: '#FFFFFF',
    textLight: '#0F172A',
    accent: '#66FCF1',
    secondary: '#FF2D55',
    border: 'rgba(102, 252, 241, 0.24)',
  },
  {
    id: 'bento-grid',
    label: 'Bento Grid',
    bgDark: '#09090B',
    panelDark: '#18181B',
    textDark: '#FAFAFA',
    bgLight: '#F4F4F5',
    panelLight: '#FFFFFF',
    textLight: '#18181B',
    accent: '#8B5CFF',
    secondary: '#2FD57A',
    border: 'rgba(139, 92, 255, 0.26)',
  },
  {
    id: 'swiss-architect',
    label: 'Swiss Architect',
    bgDark: '#111111',
    panelDark: '#1C1C1C',
    textDark: '#F5F5F3',
    bgLight: '#F7F5F0',
    panelLight: '#FFFFFF',
    textLight: '#111111',
    accent: '#FF3B30',
    secondary: '#00E0FF',
    border: 'rgba(255, 59, 48, 0.28)',
  },
  {
    id: 'aqua-web2',
    label: 'Aqua Web 2.0',
    bgDark: '#07131E',
    panelDark: '#0E2235',
    textDark: '#E2F1FF',
    bgLight: '#EBF5FF',
    panelLight: '#FFFFFF',
    textLight: '#0A2540',
    accent: '#00E0FF',
    secondary: '#38BDF8',
    border: 'rgba(0, 224, 255, 0.28)',
  },
  {
    id: 'pop-brutalist',
    label: 'Pop Brutalist',
    bgDark: '#0D0B14',
    panelDark: '#191528',
    textDark: '#FDFBF7',
    bgLight: '#FFFDF5',
    panelLight: '#FFFFFF',
    textLight: '#121212',
    accent: '#D6FF3F',
    secondary: '#FF2D55',
    border: 'rgba(214, 255, 63, 0.35)',
  },
  {
    id: 'steel-tactical',
    label: 'Steel Tactical',
    bgDark: '#0C1014',
    panelDark: '#161D24',
    textDark: '#D1D9E0',
    bgLight: '#EAEEF2',
    panelLight: '#FFFFFF',
    textLight: '#1C242B',
    accent: '#2FD57A',
    secondary: '#F59E0B',
    border: 'rgba(47, 213, 122, 0.26)',
  },
  {
    id: 'parchment',
    label: 'Parchment',
    bgDark: '#181512',
    panelDark: '#24201B',
    textDark: '#EFECE6',
    bgLight: '#F6F1E7',
    panelLight: '#FCF9F2',
    textLight: '#26221E',
    accent: '#E07A5F',
    secondary: '#81B29A',
    border: 'rgba(224, 122, 95, 0.28)',
  },
];

const GROUPS = [
  'All Groups',
  'Neon Hooks',
  'Midnight Sequences',
  'Cold Signals',
  'Haunted Melodies',
  'Cinematic Flight',
];

const SCALES = ['All Scales', 'Natural Minor', 'Harmonic Minor', 'Dorian', 'Phrygian'];

type ActiveTab = 'studio' | 'architecture' | 'validation' | 'article' | 'executive';

export function App() {
  const patterns = patternsPayload.patterns as MidiPattern[];
  const summary = patternsPayload.summary;

  const [themeId, setThemeId] = useState<ThemeId>(() => {
    const saved = localStorage.getItem('kg_nocturnal_theme') as ThemeId | null;
    return saved && THEMES.some((t) => t.id === saved) ? saved : 'cosmic-cyber';
  });
  const [colorMode, setColorMode] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('kg_nocturnal_mode');
    return saved === 'light' ? 'light' : 'dark';
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('studio');
  const [selectedId, setSelectedId] = useState<string>('001');
  const [selectedGroup, setSelectedGroup] = useState<string>('All Groups');
  const [selectedScale, setSelectedScale] = useState<string>('All Scales');
  const [legatoFilter, setLegatoFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Synth engine controls
  const synthRef = useRef<NocturnalSynthEngine | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTick, setCurrentTick] = useState<number>(0);
  const [activeMidis, setActiveMidis] = useState<number[]>([]);
  const [waveType, setWaveType] = useState<SynthWaveType>('sawtooth');
  const [fxMode, setFxMode] = useState<SynthFxMode>('dry');
  const [portamentoMs, setPortamentoMs] = useState<number>(28);
  const [filterCutoffHz, setFilterCutoffHz] = useState<number>(3400);
  const [bpmOverride, setBpmOverride] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem('kg_nocturnal_theme', themeId);
  }, [themeId]);

  useEffect(() => {
    localStorage.setItem('kg_nocturnal_mode', colorMode);
  }, [colorMode]);

  useEffect(() => {
    const engine = new NocturnalSynthEngine();
    engine.setOnTick((tick, playing, midis) => {
      setCurrentTick(tick);
      setIsPlaying(playing);
      setActiveMidis(midis);
    });
    synthRef.current = engine;
    return () => {
      engine.stop();
    };
  }, []);

  const currentTheme = useMemo(
    () => THEMES.find((t) => t.id === themeId) || THEMES[0],
    [themeId]
  );

  const selectedPattern = useMemo(
    () => patterns.find((p) => p.id === selectedId) || patterns[0],
    [patterns, selectedId]
  );

  const filteredPatterns = useMemo(() => {
    return patterns.filter((p) => {
      if (selectedGroup !== 'All Groups' && p.group !== selectedGroup) return false;
      if (selectedScale !== 'All Scales' && p.scale !== selectedScale) return false;
      if (legatoFilter === 'yes' && !p.legato) return false;
      if (legatoFilter === 'no' && p.legato) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const hay = `${p.id} ${p.name} ${p.group} ${p.tonalCenter} ${p.scale} ${p.motifDesc} ${p.chords.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [patterns, selectedGroup, selectedScale, legatoFilter, searchQuery]);

  const handleSelectPattern = (pat: MidiPattern, autoPlay = false) => {
    setSelectedId(pat.id);
    setBpmOverride(null);
    if (synthRef.current) {
      const suggestedWave = synthRef.current.inferWaveFromSuggestion(pat.soundSuggestion);
      setWaveType(suggestedWave);
      synthRef.current.setConfig({
        waveType: suggestedWave,
        fxMode,
        bpmOverride: null,
        portamentoMs,
        filterCutoffHz,
      });
      if (autoPlay || isPlaying) {
        synthRef.current.play(pat);
      }
    }
  };

  const togglePlay = () => {
    if (!synthRef.current) return;
    if (isPlaying) {
      synthRef.current.stop();
    } else {
      synthRef.current.setConfig({
        waveType,
        fxMode,
        bpmOverride,
        portamentoMs,
        filterCutoffHz,
      });
      synthRef.current.play(selectedPattern);
    }
  };

  const handleWaveChange = (w: SynthWaveType) => {
    setWaveType(w);
    synthRef.current?.setConfig({ waveType: w });
  };

  const handleFxModeChange = (mode: SynthFxMode) => {
    setFxMode(mode);
    synthRef.current?.setConfig({ fxMode: mode });
  };

  const handleCutoffChange = (hz: number) => {
    setFilterCutoffHz(hz);
    synthRef.current?.setConfig({ filterCutoffHz: hz });
  };

  const handlePortamentoChange = (ms: number) => {
    setPortamentoMs(ms);
    synthRef.current?.setConfig({ portamentoMs: ms });
  };

  const isDark = colorMode === 'dark';
  const bgColor = isDark ? currentTheme.bgDark : currentTheme.bgLight;
  const panelColor = isDark ? currentTheme.panelDark : currentTheme.panelLight;
  const textColor = isDark ? currentTheme.textDark : currentTheme.textLight;

  return (
    <div
      style={{
        backgroundColor: bgColor,
        color: textColor,
        fontFamily: '"Space Grotesk", sans-serif',
      }}
      className="min-h-screen transition-colors duration-200"
    >
      {/* Top Marquee Telemetry Bar */}
      <div
        style={{
          borderBottom: `1px solid ${currentTheme.border}`,
          backgroundColor: isDark ? '#07080C' : '#E2E8F0',
        }}
        className="w-full py-1.5 px-4 overflow-hidden text-xs font-mono flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3 truncate">
          <span
            style={{ backgroundColor: currentTheme.accent, color: '#07060A' }}
            className="px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px]"
          >
            VERIFIED SMF FORMAT 0
          </span>
          <span className="opacity-85 truncate">
            50 ORIGINAL COMPOSITIONS • 1,024 NOTE EVENTS • 218 BARS • 480 PPQ • 0 DUPLICATES / 0 TRANSPOSITION CLONES
          </span>
        </div>
        <div className="hidden md:flex items-center gap-4 shrink-0">
          <a
            href="./synthwave_darkwave_50_midi_leads.zip"
            download
            style={{ color: currentTheme.accent }}
            className="hover:underline flex items-center gap-1 font-semibold"
          >
            <Download className="w-3.5 h-3.5" /> Download Complete 50-MIDI Bundle (.ZIP)
          </a>
        </div>
      </div>

      {/* Main Executive Header */}
      <header
        style={{
          borderBottom: `1px solid ${currentTheme.border}`,
          backgroundColor: panelColor,
        }}
        className="sticky top-0 z-30 backdrop-blur-md bg-opacity-90 px-4 lg:px-8 py-3.5"
      >
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              style={{
                borderColor: currentTheme.accent,
                backgroundColor: 'rgba(102, 252, 241, 0.1)',
              }}
              className="w-10 h-10 rounded-xl border flex items-center justify-center"
            >
              <Radio style={{ color: currentTheme.accent }} className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-bold tracking-tight">
                  NOCTURNAL SYNTHESIS
                </h1>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/10 opacity-80">
                  v1.0 // 480 PPQ
                </span>
              </div>
              <p className="text-xs opacity-70">
                50 Production-Ready Synthwave &amp; Darkwave Lead MIDI Patterns • Dry-Patch Audited
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'studio', label: 'Interactive MIDI Studio', icon: Music },
              { id: 'architecture', label: 'Diagrams & Mindmap', icon: GitBranch },
              { id: 'validation', label: 'Binary QA Report', icon: ShieldCheck },
              { id: 'article', label: 'Medium Editorial Article', icon: BookOpen },
              { id: 'executive', label: 'Executive Spec (10-Dim)', icon: Layers },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ActiveTab)}
                  style={{
                    backgroundColor: active ? currentTheme.accent : 'transparent',
                    color: active ? '#07060A' : textColor,
                    borderColor: active ? currentTheme.accent : 'rgba(150,150,150,0.25)',
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* 7-Theme Picker + Light/Dark Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs border border-white/15 rounded-lg px-2.5 py-1.5">
              <Palette className="w-3.5 h-3.5 opacity-75" />
              <select
                aria-label="Select visual theme"
                value={themeId}
                onChange={(e) => setThemeId(e.target.value as ThemeId)}
                style={{ backgroundColor: 'transparent', color: textColor }}
                className="text-xs font-mono focus:outline-none cursor-pointer"
              >
                {THEMES.map((t) => (
                  <option
                    key={t.id}
                    value={t.id}
                    style={{ backgroundColor: '#141923', color: '#E6EDF3' }}
                  >
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setColorMode(isDark ? 'light' : 'dark')}
              title="Toggle Light/Dark Mode"
              className="p-2 rounded-lg border border-white/15 hover:bg-white/5 cursor-pointer"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Hero Banner Card */}
        <section
          style={{
            backgroundColor: panelColor,
            borderColor: currentTheme.border,
          }}
          className="rounded-2xl border overflow-hidden grid grid-cols-1 lg:grid-cols-12"
        >
          <div className="lg:col-span-7 p-6 md:p-8 flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                <span
                  style={{ color: currentTheme.accent, borderColor: currentTheme.accent }}
                  className="px-2.5 py-0.5 rounded-full border bg-white/5"
                >
                  5 GROUPS × 10 PATTERNS
                </span>
                <span className="px-2.5 py-0.5 rounded-full border border-white/15 opacity-80">
                  85–130 BPM
                </span>
                <span className="px-2.5 py-0.5 rounded-full border border-white/15 opacity-80">
                  2, 4 &amp; 8 BAR LOOPS
                </span>
                <span className="px-2.5 py-0.5 rounded-full border border-white/15 opacity-80">
                  DRY-PATCH VERIFIED
                </span>
              </div>
              <h2 className="text-2xl md:text-4xl font-bold tracking-tight leading-tight">
                Melodic, Moody, Retro Lead Hooks Built to Survive With the Delay Off.
              </h2>
              <p className="text-sm md:text-base opacity-80 leading-relaxed max-w-2xl">
                Every lead line in this 50-pattern collection is composed around a recognizable
                intervallic motif, purposeful development, and deliberate breathing room. Audition any
                hook below on a plain dry Web Audio mono patch or switch to nocturnal stereo delay,
                inspect 1–60 tick legato gates, and download the complete Standard MIDI File Format-0
                archive.
              </p>
            </div>

            {/* Download Deliverables Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="./synthwave_darkwave_50_midi_leads.zip"
                download
                style={{ backgroundColor: currentTheme.accent, color: '#07060A' }}
                className="px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 shadow-lg hover:opacity-90 transition-opacity"
              >
                <Download className="w-4 h-4" />
                Download All 50 MIDI + CSVs + README (.ZIP)
              </a>
              <a
                href="./data/midi_patterns_index.csv"
                download="midi_patterns_index.csv"
                className="px-3.5 py-2.5 rounded-xl border border-white/20 text-xs font-mono flex items-center gap-1.5 hover:bg-white/5"
              >
                <FileSpreadsheet className="w-4 h-4" />
                midi_patterns_index.csv
              </a>
              <a
                href="./data/midi_note_events.csv"
                download="midi_note_events.csv"
                className="px-3.5 py-2.5 rounded-xl border border-white/20 text-xs font-mono flex items-center gap-1.5 hover:bg-white/5"
              >
                <FileSpreadsheet className="w-4 h-4" />
                midi_note_events.csv (1,024 rows)
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 relative min-h-[240px] bg-black/40 flex items-center justify-center overflow-hidden">
            <img
              src="./images/hero_nocturnal_synthesis.jpg"
              alt="Nocturnal Synthesis Analog Synthesizer Studio"
              className="w-full h-full object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-5">
              <div className="w-full flex items-center justify-between text-white text-xs font-mono">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-cyan-300">
                    NOW LOADED IN DECK
                  </div>
                  <div className="font-bold text-sm">
                    #{selectedPattern.id} — {selectedPattern.name} ({selectedPattern.tonalCenter}{' '}
                    {selectedPattern.scale})
                  </div>
                </div>
                <button
                  onClick={togglePlay}
                  style={{ backgroundColor: currentTheme.accent, color: '#07060A' }}
                  className="px-3.5 py-2 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isPlaying ? 'Stop' : 'Audition'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* TAB 1: INTERACTIVE MIDI STUDIO */}
        {activeTab === 'studio' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Active Pattern Inspector + Piano Roll + Synth Controls */}
            <div className="lg:col-span-8 space-y-6">
              <div
                style={{ backgroundColor: panelColor, borderColor: currentTheme.border }}
                className="rounded-2xl border p-5 md:p-6 space-y-5"
              >
                {/* Top Deck Transport & Metadata Badges */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        style={{ backgroundColor: currentTheme.accent, color: '#07060A' }}
                        className="font-mono font-bold text-xs px-2.5 py-0.5 rounded"
                      >
                        PATTERN #{selectedPattern.id}
                      </span>
                      <span className="text-xs font-mono px-2.5 py-0.5 rounded border border-white/15">
                        {selectedPattern.group}
                      </span>
                      <span className="text-xs font-mono px-2.5 py-0.5 rounded border border-white/15">
                        {selectedPattern.tonalCenter} {selectedPattern.scale}
                      </span>
                      <span className="text-xs font-mono px-2.5 py-0.5 rounded border border-white/15">
                        {selectedPattern.bars} Bars ({selectedPattern.loopTicks} Ticks)
                      </span>
                      <span
                        style={{
                          borderColor: selectedPattern.legato ? '#D6FF3F' : 'rgba(255,255,255,0.2)',
                          color: selectedPattern.legato ? '#D6FF3F' : undefined,
                        }}
                        className="text-xs font-mono px-2.5 py-0.5 rounded border"
                      >
                        legato: {selectedPattern.legato ? 'yes (1–60t)' : 'no'}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold pt-1">{selectedPattern.name}</h3>
                    <p className="text-xs md:text-sm opacity-80 leading-relaxed">
                      {selectedPattern.motifDesc}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={togglePlay}
                      style={{
                        backgroundColor: isPlaying ? currentTheme.secondary : currentTheme.accent,
                        color: isPlaying ? '#FFFFFF' : '#07060A',
                      }}
                      className="px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow cursor-pointer"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      {isPlaying ? 'Stop Loop' : 'Play Lead Loop'}
                    </button>
                    <a
                      href={`./midi/${selectedPattern.filename}`}
                      download={selectedPattern.filename}
                      className="px-3.5 py-2.5 rounded-xl border border-white/20 text-xs font-mono flex items-center gap-1.5 hover:bg-white/5"
                    >
                      <Download className="w-4 h-4" />
                      .MID
                    </a>
                  </div>
                </div>

                {/* Dry vs FX Patch Litmus Strip */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3.5 rounded-xl bg-black/25 border border-white/10 text-xs">
                  <div className="space-y-1">
                    <label className="font-mono text-[11px] opacity-70 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" /> PATCH LITMUS MODE
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                      <button
                        onClick={() => handleFxModeChange('dry')}
                        style={{
                          backgroundColor: fxMode === 'dry' ? currentTheme.accent : 'transparent',
                          color: fxMode === 'dry' ? '#07060A' : textColor,
                        }}
                        className="py-1.5 px-2 rounded font-mono font-semibold border border-white/15 cursor-pointer"
                      >
                        100% Dry Mono
                      </button>
                      <button
                        onClick={() => handleFxModeChange('nocturnal_fx')}
                        style={{
                          backgroundColor:
                            fxMode === 'nocturnal_fx' ? currentTheme.secondary : 'transparent',
                          color: fxMode === 'nocturnal_fx' ? '#FFFFFF' : textColor,
                        }}
                        className="py-1.5 px-2 rounded font-mono font-semibold border border-white/15 cursor-pointer"
                      >
                        Nocturnal FX
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-mono text-[11px] opacity-70 flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5" /> OSCILLATOR WAVEFORM
                    </label>
                    <select
                      value={waveType}
                      onChange={(e) => handleWaveChange(e.target.value as SynthWaveType)}
                      style={{ backgroundColor: '#10141D', color: '#E6EDF3' }}
                      className="w-full py-1.5 px-2.5 rounded border border-white/15 font-mono text-xs"
                    >
                      <option value="sawtooth">Bright Mono Sawtooth</option>
                      <option value="pulse">Hollow Pulse / Square</option>
                      <option value="triangle">Rounded Triangle + Sub</option>
                      <option value="supersaw">Dual Detuned Stadium Saw</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-mono text-[11px] opacity-70 flex items-center justify-between">
                      <span>FILTER CUTOFF</span>
                      <span>{filterCutoffHz} Hz</span>
                    </label>
                    <input
                      type="range"
                      min={600}
                      max={8500}
                      step={100}
                      value={filterCutoffHz}
                      onChange={(e) => handleCutoffChange(Number(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-mono text-[11px] opacity-70 flex items-center justify-between">
                      <span>LEGATO GLIDE</span>
                      <span>{portamentoMs} ms</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={65}
                      step={5}
                      value={portamentoMs}
                      onChange={(e) => handlePortamentoChange(Number(e.target.value))}
                      className="w-full accent-pink-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Live 60fps Canvas Piano Roll */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between text-xs font-mono opacity-80">
                    <div className="flex items-center gap-4">
                      <span>
                        TICK: <strong>{currentTick}</strong> / {selectedPattern.loopTicks}
                      </span>
                      <span>
                        BEAT: <strong>{(currentTick / 480).toFixed(2)}</strong> /{' '}
                        {selectedPattern.bars * 4}.00
                      </span>
                      <span>
                        BPM: <strong>{bpmOverride || selectedPattern.bpm}</strong> (
                        {selectedPattern.mpqn} µs/qn)
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <span
                          style={{ backgroundColor: currentTheme.accent }}
                          className="w-2.5 h-2.5 rounded-sm inline-block"
                        />{' '}
                        In-Scale Note
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-sm bg-[#FF2D55] inline-block" />{' '}
                        Intentional Out-of-Scale Tension
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-sm bg-[#D6FF3F]/50 border border-[#D6FF3F] inline-block" />{' '}
                        1–60t Legato Overlap
                      </span>
                    </div>
                  </div>

                  <PianoRollCanvas
                    pattern={selectedPattern}
                    currentTick={currentTick}
                    isPlaying={isPlaying}
                    accentColor={currentTheme.accent}
                    secondaryColor={currentTheme.secondary}
                  />
                </div>

                {/* Harmonic Context & Sound-Design Metadata Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="p-4 rounded-xl border border-white/10 bg-black/20 space-y-2.5">
                    <div className="text-xs font-mono uppercase tracking-wider opacity-70 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Harmonic Context (1 Chord Per Bar, Metadata Only)
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedPattern.chords.map((chord, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 text-xs font-mono"
                        >
                          <span className="opacity-60 mr-1.5">Bar {idx + 1}:</span>
                          <strong className="text-sm">{chord}</strong>{' '}
                          <span style={{ color: currentTheme.accent }}>
                            ({selectedPattern.romans[idx]})
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="text-xs space-y-1 pt-1 font-mono">
                      <div>
                        <span className="opacity-65">Borrowed / Out-of-Scale Chords: </span>
                        <span className="font-semibold">{selectedPattern.borrowedChords}</span>
                      </div>
                      <div>
                        <span className="opacity-65">Intentional Out-of-Scale Melody Notes: </span>
                        <span
                          style={{
                            color:
                              selectedPattern.outOfScaleNotes !== 'none'
                                ? '#FF2D55'
                                : currentTheme.accent,
                          }}
                          className="font-semibold"
                        >
                          {selectedPattern.outOfScaleNotes}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-white/10 bg-black/20 space-y-2.5">
                    <div className="text-xs font-mono uppercase tracking-wider opacity-70 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5" /> Playback &amp; Performance Suggestions (Non-Embedded)
                    </div>
                    <div className="text-xs space-y-2">
                      <div>
                        <span className="opacity-65 font-mono block">Suggested Dry Synth Patch:</span>
                        <p className="font-semibold text-sm">{selectedPattern.soundSuggestion}</p>
                      </div>
                      <div>
                        <span className="opacity-65 font-mono block">
                          Optional Expressive Treatment (Not Encoded in MIDI):
                        </span>
                        <p className="opacity-90">{selectedPattern.performanceSuggestion}</p>
                      </div>
                      <div className="pt-1 font-mono text-[11px] opacity-75">
                        Register Window: MIDI {selectedPattern.minPitch}–{selectedPattern.maxPitch} •{' '}
                        {selectedPattern.noteCount} Note Events
                      </div>
                    </div>
                  </div>
                </div>

                {/* Authoritative Tick & Beat Note Event Table for Selected Pattern */}
                <details className="rounded-xl border border-white/10 bg-black/15 p-4">
                  <summary className="text-xs font-mono font-semibold cursor-pointer flex items-center justify-between">
                    <span>
                      INSPECT AUTHORITATIVE NOTE-EVENT STREAM ({selectedPattern.notes.length} EVENTS AT 480 PPQ)
                    </span>
                    <span style={{ color: currentTheme.accent }}>Click to expand table</span>
                  </summary>
                  <div className="mt-3 max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs font-mono border-collapse">
                      <thead>
                        <tr className="border-b border-white/15 opacity-70">
                          <th className="py-1.5 px-2">#</th>
                          <th className="py-1.5 px-2">Note Name</th>
                          <th className="py-1.5 px-2">MIDI Pitch</th>
                          <th className="py-1.5 px-2">Start Tick</th>
                          <th className="py-1.5 px-2">Dur Ticks</th>
                          <th className="py-1.5 px-2">Start Beat</th>
                          <th className="py-1.5 px-2">Dur Beats</th>
                          <th className="py-1.5 px-2">Velocity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPattern.notes.map((ev, idx) => (
                          <tr
                            key={idx}
                            className="border-b border-white/5 hover:bg-white/5"
                          >
                            <td className="py-1 px-2 opacity-60">{idx + 1}</td>
                            <td className="py-1 px-2 font-bold">{ev.name}</td>
                            <td className="py-1 px-2">{ev.midi}</td>
                            <td className="py-1 px-2">{ev.startTick}</td>
                            <td className="py-1 px-2">{ev.durationTicks}</td>
                            <td className="py-1 px-2">{ev.startBeat}</td>
                            <td className="py-1 px-2">{ev.durationBeats}</td>
                            <td className="py-1 px-2">{ev.velocity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </div>
            </div>

            {/* Right Column: Filterable 50-Pattern Browser */}
            <div className="lg:col-span-4 space-y-4">
              <div
                style={{ backgroundColor: panelColor, borderColor: currentTheme.border }}
                className="rounded-2xl border p-4 space-y-3.5"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Filter className="w-4 h-4" /> Browse 50 Patterns ({filteredPatterns.length})
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedGroup('All Groups');
                      setSelectedScale('All Scales');
                      setLegatoFilter('all');
                      setSearchQuery('');
                    }}
                    className="text-xs font-mono opacity-70 hover:opacity-100 underline cursor-pointer"
                  >
                    Reset
                  </button>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 opacity-50" />
                  <input
                    type="text"
                    placeholder="Search title, key, chord, or motif..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-white/15 bg-black/20 text-xs font-mono focus:outline-none"
                  />
                </div>

                {/* Group Pills */}
                <div className="flex flex-wrap gap-1.5">
                  {GROUPS.map((g) => {
                    const active = selectedGroup === g;
                    return (
                      <button
                        key={g}
                        onClick={() => setSelectedGroup(g)}
                        style={{
                          backgroundColor: active ? currentTheme.accent : 'transparent',
                          color: active ? '#07060A' : textColor,
                        }}
                        className="px-2.5 py-1 rounded-lg border border-white/15 text-[11px] font-mono font-semibold cursor-pointer"
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>

                {/* Scale & Legato Selectors */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <select
                    value={selectedScale}
                    onChange={(e) => setSelectedScale(e.target.value)}
                    style={{ backgroundColor: '#10141D', color: '#E6EDF3' }}
                    className="p-2 rounded-lg border border-white/15"
                  >
                    {SCALES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <select
                    value={legatoFilter}
                    onChange={(e) => setLegatoFilter(e.target.value as 'all' | 'yes' | 'no')}
                    style={{ backgroundColor: '#10141D', color: '#E6EDF3' }}
                    className="p-2 rounded-lg border border-white/15"
                  >
                    <option value="all">Legato: All (50)</option>
                    <option value="yes">Legato: Yes (29)</option>
                    <option value="no">Legato: No (21)</option>
                  </select>
                </div>

                {/* Scrollable Pattern List */}
                <div className="max-h-[590px] overflow-y-auto space-y-2 pr-1">
                  {filteredPatterns.map((pat) => {
                    const isSelected = pat.id === selectedPattern.id;
                    return (
                      <div
                        key={pat.id}
                        onClick={() => handleSelectPattern(pat, false)}
                        style={{
                          borderColor: isSelected
                            ? currentTheme.accent
                            : 'rgba(255,255,255,0.08)',
                          backgroundColor: isSelected
                            ? 'rgba(102, 252, 241, 0.08)'
                            : 'rgba(0,0,0,0.18)',
                        }}
                        className="p-3 rounded-xl border transition-all cursor-pointer hover:border-white/30 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold opacity-80">
                              #{pat.id}
                            </span>
                            <span className="font-bold text-sm truncate">{pat.name}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono opacity-75">
                            <span>{pat.group}</span>
                            <span>•</span>
                            <span>
                              {pat.tonalCenter} {pat.scale}
                            </span>
                            <span>•</span>
                            <span>{pat.bpm} BPM</span>
                            <span>•</span>
                            <span>{pat.bars}b</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isSelected && isPlaying) {
                                synthRef.current?.stop();
                              } else {
                                handleSelectPattern(pat, true);
                              }
                            }}
                            style={{
                              backgroundColor:
                                isSelected && isPlaying
                                  ? currentTheme.secondary
                                  : currentTheme.accent,
                              color: isSelected && isPlaying ? '#FFFFFF' : '#07060A',
                            }}
                            className="p-2 rounded-lg font-bold cursor-pointer"
                            title="Play pattern"
                          >
                            {isSelected && isPlaying ? (
                              <Pause className="w-3.5 h-3.5" />
                            ) : (
                              <Play className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ARCHITECTURE DIAGRAMS & INTERACTIVE MINDMAP */}
        {activeTab === 'architecture' && (
          <div className="space-y-6">
            <div
              style={{ backgroundColor: panelColor, borderColor: currentTheme.border }}
              className="rounded-2xl border p-6 space-y-4"
            >
              <h3 className="text-xl font-bold">
                1. Taxonomy Mindmap: 5 Creative Groups, Modal Distribution &amp; Melodic Mechanics
              </h3>
              <p className="text-sm opacity-80">
                Visualizes how the 50 compositions partition across Synthwave and Darkwave directions,
                tempo windows, modal frameworks, and signature interval structures.
              </p>
              <div className="rounded-xl overflow-hidden border border-white/10 bg-[#07060A] p-2">
                <img
                  src="./images/collection_mindmap.svg"
                  alt="Taxonomy Mindmap of 50 Synthwave and Darkwave Lead Patterns"
                  className="w-full h-auto"
                />
              </div>
            </div>

            <div
              style={{ backgroundColor: panelColor, borderColor: currentTheme.border }}
              className="rounded-2xl border p-6 space-y-4"
            >
              <h3 className="text-xl font-bold">
                2. Deterministic SMF Format-0 Compiler &amp; Legato Micro-Timing Architecture
              </h3>
              <p className="text-sm opacity-80">
                Illustrates the four-stage build pipeline from musical specification to binary VLQ
                encoding, same-tick Note-Off-first priority ordering, and 1–60 tick legato overlap
                verification.
              </p>
              <div className="rounded-xl overflow-hidden border border-white/10 bg-[#07060A] p-2">
                <img
                  src="./images/architecture_diagram.svg"
                  alt="System Architecture Diagram"
                  className="w-full h-auto"
                />
              </div>
            </div>

            <div
              style={{ backgroundColor: panelColor, borderColor: currentTheme.border }}
              className="rounded-2xl border p-6 space-y-4"
            >
              <h3 className="text-xl font-bold">
                3. Aesthetic Duality: Outrun Synthwave Horizon vs. Brutalist Darkwave Telemetry
              </h3>
              <div className="rounded-xl overflow-hidden border border-white/10 bg-[#07060A]">
                <img
                  src="./images/synthwave_vs_darkwave_duality.jpg"
                  alt="Synthwave vs Darkwave Duality Illustration"
                  className="w-full max-h-[460px] object-cover"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BINARY QA & VALIDATION REPORT */}
        {activeTab === 'validation' && (
          <div
            style={{ backgroundColor: panelColor, borderColor: currentTheme.border }}
            className="rounded-2xl border p-6 md:p-8 space-y-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <span
                  style={{ color: currentTheme.accent }}
                  className="font-mono text-xs uppercase tracking-widest"
                >
                  ZERO-TRUST DISK RE-PARSE VERIFICATION
                </span>
                <h3 className="text-2xl font-bold">
                  Automated Binary Validation, Duplicate Audit &amp; Musical Review Report
                </h3>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 font-mono text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" /> STATUS: {summary.status} (0 ERRORS)
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Verified SMF Format-0 Files', val: '50 / 50' },
                { label: 'Total Verified Note Events', val: `${summary.total_notes}` },
                { label: 'Primary Range (MIDI 60–84)', val: `${summary.primary_range_ratio}%` },
                { label: 'Pairwise Clones / Duplicates', val: '0 / 1,225 pairs' },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-white/10 bg-black/20 space-y-1"
                >
                  <div className="text-xs font-mono opacity-70">{stat.label}</div>
                  <div
                    style={{ color: currentTheme.accent }}
                    className="text-2xl font-bold font-mono"
                  >
                    {stat.val}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="p-5 rounded-xl border border-white/10 bg-black/20 space-y-3">
                <h4 className="font-bold text-base flex items-center gap-2">
                  <Cpu className="w-4 h-4" /> 1. Completed Binary &amp; CSV Checks (Executed on Disk)
                </h4>
                <ul className="space-y-2 text-xs font-mono opacity-90">
                  <li>✓ Reopened all 50 .mid files from disk via custom byte-stream parser</li>
                  <li>✓ Verified MThd Format 0, 1 track, 480 PPQ division on all 50 files</li>
                  <li>✓ Verified MIDI Channel 1 (channel 0) assignment for all 1,024 notes</li>
                  <li>✓ Verified Track Name, Set Tempo (FF 51 03), and 4/4 Time Sig at tick 0</li>
                  <li>✓ Confirmed 0 Program Change, Pitch Bend, or CC messages</li>
                  <li>✓ Verified explicit 0x80 Note-Off pairing and Note-Off-first ordering at same tick</li>
                  <li>✓ Verified End-of-Track (FF 2F 00) at exact declared loop boundary (3840, 7680, 15360)</li>
                  <li>✓ Verified all pitches within 55–96 ({summary.min_pitch} to {summary.max_pitch})</li>
                  <li>✓ Verified 29 legato:yes patterns (overlaps 1..60 ticks, adjacent different pitches) and 21 legato:no patterns (0 overlaps)</li>
                  <li>✓ Verified 100% bit-exact match between parsed MIDI notes and midi_note_events.csv</li>
                </ul>
              </div>

              <div className="p-5 rounded-xl border border-white/10 bg-black/20 space-y-3">
                <h4 className="font-bold text-base flex items-center gap-2">
                  <Activity className="w-4 h-4" /> 2. Duplicate, Transposition &amp; Musical Review Scope
                </h4>
                <ul className="space-y-2 text-xs font-mono opacity-90">
                  <li>✓ Exact pitch + rhythm duplicate check across 1,225 pairs: 0 duplicates</li>
                  <li>✓ Identical rhythm + constant pitch transposition check: 0 clones</li>
                  <li>✓ Unchanged shorter-loop repetition check (first half vs second half): 0 repeats</li>
                  <li>✓ Opening 6-interval contour similarity screen: 0 collisions</li>
                  <li>✓ Harmonic verification across all 218 bars: 100% chord-symbol to Roman-numeral match</li>
                  <li>✓ Honest Verification Distinction: Binary parsing, duplicate checks, and score-level harmonic audits were executed programmatically via Python; real-time audio auditioning is provided interactively in this browser studio via the Web Audio API synthesizer.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: FULL SEO/AEO MEDIUM ARTICLE */}
        {activeTab === 'article' && (
          <article
            style={{ backgroundColor: panelColor, borderColor: currentTheme.border }}
            className="rounded-2xl border p-6 md:p-10 max-w-4xl mx-auto space-y-6"
          >
            <div className="space-y-3 border-b border-white/10 pb-6">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                <span
                  style={{ backgroundColor: currentTheme.accent, color: '#07060A' }}
                  className="px-2.5 py-0.5 rounded font-bold"
                >
                  MEDIUM EDITORIAL FEATURE
                </span>
                <span className="opacity-75">By Miz Causevic • Kinetic Gain LLC</span>
                <span>•</span>
                <span className="opacity-75">SEO / GEO / AEO Optimized Technical Blueprint</span>
              </div>
              <h2 className="text-2xl md:text-4xl font-bold leading-tight">
                Why Most Synthwave Lead Melodies Fail With the Delay Turned Off (And How We
                Engineered 50 Production-Ready MIDI Hooks)
              </h2>
              <p className="text-base opacity-80">
                A technical blueprint for composing, encoding, and binary-verifying 50 monophonic
                Synthwave and Darkwave lead patterns at 480 PPQ.
              </p>
            </div>

            <img
              src="./images/hero_nocturnal_synthesis.jpg"
              alt="Nocturnal Synthesis Hero"
              className="w-full rounded-xl border border-white/10"
            />

            <div className="space-y-4 text-sm md:text-base leading-relaxed opacity-90">
              <p>
                <strong>BLUF:</strong> If a synthesizer melody loses its identity the moment you
                bypass the stereo ping-pong delay and hall reverb, you do not have a lead hook. You
                have a timbre demo. To solve this across both nostalgic outrun synthwave and austere
                coldwave/darkwave production, we engineered <strong>Nocturnal Synthesis</strong>: a
                zero-placeholder collection of <strong>50 original Standard MIDI File (SMF) Format-0 lead patterns</strong>{' '}
                (1,024 note events across 218 bars at 480 PPQ), paired with an independent Python
                byte-level re-parser that verifies every delta-time VLQ, tick-boundary event order,
                legato gate window, and Roman-numeral harmonic relationship.
              </p>

              <h3 className="text-xl font-bold pt-2">
                1. The Dry-Patch Litmus Test: Why FX Tails Mask Weak Composition
              </h3>
              <p>
                Open any commercial synthwave preset pack and play a single middle C. Between the
                dual-oscillator unison detune, chorus ensemble, dotted-eighth stereo delay, and
                six-second shimmer reverb, that single note fills the stereo field. When you mute
                the effects bus and route the MIDI clip into a raw, dry single-oscillator sawtooth
                or square wave, three structural flaws immediately surface: absence of intervallic
                identity, continuous rhythmic exhaustion without rests, and sloppy gate/overlap
                discipline that misfires mono-synth envelopes.
              </p>

              <img
                src="./images/synthwave_vs_darkwave_duality.jpg"
                alt="Synthwave vs Darkwave Duality"
                className="w-full rounded-xl border border-white/10 my-4"
              />

              <h3 className="text-xl font-bold pt-2">
                2. Five Creative Archetypes Across Synthwave &amp; Darkwave
              </h3>
              <p>
                Rather than treating retro electronic music as a single homogeneous aesthetic, the
                50 patterns partition into five 10-pattern groups: <strong>Neon Hooks</strong>{' '}
                (001–010), <strong>Midnight Sequences</strong> (011–020),{' '}
                <strong>Cold Signals</strong> (021–030), <strong>Haunted Melodies</strong>{' '}
                (031–040), and <strong>Cinematic Flight</strong> (041–050).
              </p>

              <img
                src="./images/collection_mindmap.svg"
                alt="Collection Mindmap"
                className="w-full rounded-xl border border-white/10 bg-[#07060A] p-2 my-4"
              />

              <h3 className="text-xl font-bold pt-2">
                3. Binary MIDI Engineering: Note-Off Priority &amp; 1–60 Tick Legato Math
              </h3>
              <p>
                Standard MIDI Files encode time as Variable-Length Quantity (VLQ) delta ticks. When
                Note A ends at tick 480 and Note B starts at tick 480, writing Note-On(B) before
                Note-Off(A) causes monophonic voice-stealing glitches. Our Format-0 encoder enforces
                strict priority sorting at every tick T: Meta events (0) → Explicit 0x80 Note-Off
                (1) → 0x90 Note-On (2) → End-of-Track FF 2F 00 (3) at the exact loop boundary
                (3,840, 7,680, or 15,360 ticks).
              </p>

              <img
                src="./images/architecture_diagram.svg"
                alt="Architecture Diagram"
                className="w-full rounded-xl border border-white/10 bg-[#07060A] p-2 my-4"
              />
            </div>
          </article>
        )}

        {/* TAB 5: EXECUTIVE 10-POINT PRODUCT ARCHITECTURE */}
        {activeTab === 'executive' && (
          <div
            style={{ backgroundColor: panelColor, borderColor: currentTheme.border }}
            className="rounded-2xl border p-6 md:p-8 space-y-6"
          >
            <div className="border-b border-white/10 pb-4">
              <span
                style={{ color: currentTheme.accent }}
                className="font-mono text-xs uppercase tracking-widest"
              >
                KINETIC GAIN PRODUCT DEFINITION &amp; CROSS-VERTICAL REPURPOSING
              </span>
              <h3 className="text-2xl font-bold">
                10-Point Executive Product Definition &amp; Governance Matrix
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs md:text-sm">
              {[
                {
                  num: '01',
                  title: 'What the product is',
                  desc: 'Nocturnal Synthesis: a zero-placeholder collection of 50 Format-0 Standard MIDI lead patterns (1,024 note events) paired with a browser-based Web Audio synthesizer studio and deterministic Python binary validator.',
                },
                {
                  num: '02',
                  title: 'Who it is for',
                  desc: 'Electronic music producers, synthwave/darkwave composers, game soundtrack directors, and audio software engineers who need dry-patch-resilient melodic hooks and clean symbolic MIDI datasets.',
                },
                {
                  num: '03',
                  title: 'Why it wins',
                  desc: 'Every hook passes the Dry-Patch Litmus Test (zero reliance on delay/reverb tails) and is byte-verified for exact loop boundaries, Note-Off-first tick ordering, and 1–60 tick fingered-legato gates.',
                },
                {
                  num: '04',
                  title: 'How it is structured',
                  desc: '5 creative groups × 10 patterns (Neon Hooks, Midnight Sequences, Cold Signals, Haunted Melodies, Cinematic Flight) backed by midi_patterns_index.csv, midi_note_events.csv, README, and a single-click ZIP bundle.',
                },
                {
                  num: '05',
                  title: 'How users discover it',
                  desc: 'Technical SEO/AEO editorial blueprint ("Why Most Synthwave Lead Melodies Fail With the Delay Turned Off"), GitHub open-source repository, and interactive GitHub Pages Web Audio preview.',
                },
                {
                  num: '06',
                  title: 'How users engage with it',
                  desc: 'Real-time 60fps Canvas Piano Roll auditioning with instant A/B toggling between 100% Dry Mono and Nocturnal FX synth patches, filter cutoff/glide controls, and bar-by-bar Roman numeral inspection.',
                },
                {
                  num: '07',
                  title: 'How users convert',
                  desc: 'Direct one-click download of individual .mid files, the 50-pattern ZIP archive, or full CSV note/harmonic tables for immediate DAW or hardware sequencer import.',
                },
                {
                  num: '08',
                  title: 'How it makes money / commercial leverage',
                  desc: 'Demonstrates flagship creative-technology & deterministic audio pipeline engineering; extensible into commercial expansion packs, DAW MIDI plugins, or licensed adaptive game-audio libraries.',
                },
                {
                  num: '09',
                  title: 'How it launches',
                  desc: 'Published to GitHub with live static deployment on GitHub Pages (gh-pages branch), paired with the Medium technical article and standalone single-file HTML executive dashboard.',
                },
                {
                  num: '10',
                  title: 'How it improves after launch & repurposes',
                  desc: 'Repurposes directly to Adaptive Game Middleware (Wwise/FMOD tension loops), Music-Theory EdTech auto-graders, and Symbolic Music ML pre-training deduplication pipelines.',
                },
              ].map((item) => (
                <div
                  key={item.num}
                  className="p-4 rounded-xl border border-white/10 bg-black/20 space-y-1.5"
                >
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span
                      style={{ backgroundColor: currentTheme.accent, color: '#07060A' }}
                      className="px-2 py-0.5 rounded font-bold"
                    >
                      {item.num}
                    </span>
                    <strong className="text-sm">{item.title}</strong>
                  </div>
                  <p className="opacity-80 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        style={{ borderTop: `1px solid ${currentTheme.border}`, backgroundColor: panelColor }}
        className="mt-12 py-6 px-4 lg:px-8 text-xs font-mono opacity-75"
      >
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            NOCTURNAL SYNTHESIS // 50 SYNTHWAVE &amp; DARKWAVE MIDI LEAD PATTERNS • 480 PPQ SMF FORMAT 0
          </div>
          <div className="flex items-center gap-4">
            <a href="./dashboard-Claude.html" className="hover:underline">
              Standalone Dashboard (HTML)
            </a>
            <a href="./synthwave_darkwave_50_midi_leads.zip" download className="hover:underline">
              Download ZIP Archive
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
export default App;
