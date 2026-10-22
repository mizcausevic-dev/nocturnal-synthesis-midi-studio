#!/usr/bin/env python3
"""
Generates standalone, zero-dependency single-file HTML executive dashboards:
- /workspace/dashboard-Claude.html
- /workspace/dashboard-Cursor.html
- /workspace/public/dashboard-Claude.html
- /workspace/public/dashboard-Cursor.html

Includes all 50 MIDI patterns embedded in JSON, inline SVG architecture diagram & mindmap,
Web Audio API dry/FX synth audition engine, interactive Canvas piano roll, 10-point product
definition, and 7-theme picker (with light/dark mode and localStorage persistence).
"""

import csv
import json
from pathlib import Path


def build_standalone_dashboard():
    base = Path(__file__).resolve().parent.parent
    payload = json.loads((base / "public" / "data" / "patterns.json").read_text(encoding="utf-8"))
    notes_by_id = {}
    with open(base / "midi_note_events.csv", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            notes_by_id.setdefault(r["pattern_id"], []).append({
                "midi": int(r["midi_note_number"]),
                "startTick": int(r["start_tick"]),
                "durationTicks": int(r["duration_ticks"]),
                "velocity": int(r["velocity"]),
            })
    for p in payload["patterns"]:
        p["notes"] = notes_by_id[p["id"]]
    arch_svg = (base / "public" / "images" / "architecture_diagram.svg").read_text(encoding="utf-8")
    mindmap_svg = (base / "public" / "images" / "collection_mindmap.svg").read_text(encoding="utf-8")

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Nocturnal Synthesis // Standalone Executive MIDI Studio &amp; Dashboard</title>
<style>
  :root {{
    --bg: #0B0C10;
    --panel: #141923;
    --text: #E6EDF3;
    --muted: #9BA3B0;
    --accent: #66FCF1;
    --secondary: #FF2D55;
    --border: rgba(102, 252, 241, 0.24);
  }}
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    background: var(--bg);
    color: var(--text);
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    line-height: 1.5;
    padding-bottom: 60px;
  }}
  .mono {{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }}
  header {{
    background: var(--panel);
    border-bottom: 1px solid var(--border);
    padding: 16px 24px;
    position: sticky;
    top: 0;
    z-index: 20;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }}
  .container {{ max-width: 1400px; margin: 0 auto; padding: 24px; }}
  .grid-main {{ display: grid; grid-template-columns: 1fr 380px; gap: 20px; }}
  @media (max-width: 1024px) {{ .grid-main {{ grid-template-columns: 1fr; }} }}
  .card {{
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 20px;
    margin-bottom: 20px;
  }}
  .badge {{
    display: inline-block;
    padding: 3px 10px;
    border-radius: 99px;
    font-size: 11px;
    font-weight: 700;
    border: 1px solid var(--border);
    margin-right: 6px;
    margin-bottom: 6px;
  }}
  .badge-accent {{ background: var(--accent); color: #07060A; border-color: var(--accent); }}
  .btn {{
    padding: 8px 16px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text);
    font-weight: 600;
    font-size: 12px;
    cursor: pointer;
  }}
  .btn-primary {{ background: var(--accent); color: #07060A; border-color: var(--accent); }}
  select, input[type="text"] {{
    background: rgba(0,0,0,0.28);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 6px 10px;
    font-size: 12px;
  }}
  .pattern-item {{
    padding: 10px 12px;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    margin-bottom: 8px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }}
  .pattern-item.active {{
    border-color: var(--accent);
    background: rgba(102, 252, 241, 0.08);
  }}
  canvas {{
    width: 100%;
    height: 280px;
    background: #07080D;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.12);
    display: block;
    margin: 12px 0;
  }}
  .exec-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }}
  .svg-wrap svg {{ width: 100%; height: auto; border-radius: 12px; display: block; }}
  @media (prefers-reduced-motion: reduce) {{
    *, ::before, ::after {{
      animation-duration: 0.001ms !important;
      transition-duration: 0.001ms !important;
    }}
  }}
</style>
</head>
<body>
<header>
  <div>
    <span class="badge badge-accent mono">STANDALONE ZERO-DEP HTML</span>
    <strong style="font-size:18px;">NOCTURNAL SYNTHESIS // 50 SYNTHWAVE &amp; DARKWAVE MIDI STUDIO</strong>
  </div>
  <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
    <label class="mono" style="font-size:12px;">Theme:</label>
    <select id="themeSelect" class="mono">
      <option value="cosmic-cyber">Cosmic Cyber</option>
      <option value="bento-grid">Bento Grid</option>
      <option value="swiss-architect">Swiss Architect</option>
      <option value="aqua-web2">Aqua Web 2.0</option>
      <option value="pop-brutalist">Pop Brutalist</option>
      <option value="steel-tactical">Steel Tactical</option>
      <option value="parchment">Parchment</option>
    </select>
    <button id="modeBtn" class="btn mono">Toggle Light/Dark</button>
  </div>
</header>

<div class="container">
  <div class="grid-main">
    <div>
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; flex-wrap:wrap;">
          <div>
            <div id="patBadges"></div>
            <h2 id="patTitle" style="font-size:24px; margin:4px 0;"></h2>
            <p id="patDesc" style="font-size:13px; opacity:0.85;"></p>
          </div>
          <div style="display:flex; gap:8px;">
            <button id="playBtn" class="btn btn-primary mono">▶ Play Dry/FX Loop</button>
            <select id="fxSelect" class="mono">
              <option value="dry">100% Dry Mono Patch</option>
              <option value="fx">Nocturnal Stereo Delay FX</option>
            </select>
          </div>
        </div>

        <canvas id="rollCanvas" width="900" height="280"></canvas>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; font-size:12px; margin-top:10px;" class="mono">
          <div style="padding:12px; border:1px solid rgba(255,255,255,0.1); border-radius:8px;">
            <div style="opacity:0.65;">CHORD PROGRESSION &amp; ROMAN NUMERALS (1 PER BAR)</div>
            <div id="patChords" style="font-weight:700; margin-top:4px; font-size:13px;"></div>
            <div id="patBorrowed" style="margin-top:4px; opacity:0.85;"></div>
          </div>
          <div style="padding:12px; border:1px solid rgba(255,255,255,0.1); border-radius:8px;">
            <div style="opacity:0.65;">OUT-OF-SCALE MELODY NOTES &amp; SOUND SUGGESTION</div>
            <div id="patOutNotes" style="font-weight:700; margin-top:4px; color:#FF2D55;"></div>
            <div id="patSound" style="margin-top:4px; opacity:0.9;"></div>
          </div>
        </div>
      </div>

      <div class="card svg-wrap">
        <h3 style="margin-bottom:10px;">System Architecture &amp; 480 PPQ Legato Gate Diagram</h3>
        {arch_svg}
      </div>

      <div class="card svg-wrap">
        <h3 style="margin-bottom:10px;">Collection Taxonomy Mindmap (5 Groups × 10 Patterns)</h3>
        {mindmap_svg}
      </div>
    </div>

    <div>
      <div class="card">
        <h3 class="mono" style="font-size:14px; margin-bottom:10px;">BROWSE ALL 50 PATTERNS</h3>
        <input id="searchBox" type="text" placeholder="Filter by title, group, scale..." style="width:100%; margin-bottom:12px;" />
        <div id="patternList" style="max-height:760px; overflow-y:auto;"></div>
      </div>
    </div>
  </div>

  <div class="card">
    <h3 style="margin-bottom:12px;">10-Point Executive Product Definition</h3>
    <div class="exec-grid" style="font-size:13px;">
      <div><strong>1. What the product is:</strong> 50 Format-0 Synthwave &amp; Darkwave MIDI lead compositions (1,024 notes at 480 PPQ) + Web Audio Studio + Python Binary Auditor.</div>
      <div><strong>2. Who it is for:</strong> Electronic producers, soundtrack composers, game audio designers, and symbolic music ML engineers.</div>
      <div><strong>3. Why it wins:</strong> Passes the Dry-Patch Litmus Test without reverb/delay crutches; verified 0 duplicates across 1,225 pairs.</div>
      <div><strong>4. How it is structured:</strong> 5 groups × 10 patterns (Neon Hooks, Midnight Sequences, Cold Signals, Haunted Melodies, Cinematic Flight).</div>
      <div><strong>5. How users discover it:</strong> SEO/AEO Medium technical blueprint, GitHub repository, and live GitHub Pages interactive studio.</div>
      <div><strong>6. How users engage with it:</strong> Live 60fps piano roll with instant Dry vs. FX synth toggling and bar-by-bar Roman numeral inspection.</div>
      <div><strong>7. How users convert:</strong> One-click download of individual .mid files, CSV tables, or the complete 50-pattern ZIP archive.</div>
      <div><strong>8. How it makes money:</strong> Flagship portfolio proof and foundation for commercial MIDI expansion packs and DAW plugins.</div>
      <div><strong>9. How it launches:</strong> GitHub Pages live deployment + Medium feature article + standalone zero-dependency HTML studio.</div>
      <div><strong>10. How it improves &amp; repurposes:</strong> Repurposes to Wwise/FMOD adaptive game audio, EdTech theory graders, and ML dataset hygiene gates.</div>
    </div>
  </div>
</div>

<script>
const PAYLOAD = {json.dumps(payload)};
const THEMES = {{
  'cosmic-cyber': {{ bgDark:'#0B0C10', panelDark:'#141923', textDark:'#E6EDF3', bgLight:'#F0F4F8', panelLight:'#FFFFFF', textLight:'#0F172A', accent:'#66FCF1', secondary:'#FF2D55', border:'rgba(102,252,241,0.24)' }},
  'bento-grid': {{ bgDark:'#09090B', panelDark:'#18181B', textDark:'#FAFAFA', bgLight:'#F4F4F5', panelLight:'#FFFFFF', textLight:'#18181B', accent:'#8B5CFF', secondary:'#2FD57A', border:'rgba(139,92,255,0.26)' }},
  'swiss-architect': {{ bgDark:'#111111', panelDark:'#1C1C1C', textDark:'#F5F5F3', bgLight:'#F7F5F0', panelLight:'#FFFFFF', textLight:'#111111', accent:'#FF3B30', secondary:'#00E0FF', border:'rgba(255,59,48,0.28)' }},
  'aqua-web2': {{ bgDark:'#07131E', panelDark:'#0E2235', textDark:'#E2F1FF', bgLight:'#EBF5FF', panelLight:'#FFFFFF', textLight:'#0A2540', accent:'#00E0FF', secondary:'#38BDF8', border:'rgba(0,224,255,0.28)' }},
  'pop-brutalist': {{ bgDark:'#0D0B14', panelDark:'#191528', textDark:'#FDFBF7', bgLight:'#FFFDF5', panelLight:'#FFFFFF', textLight:'#121212', accent:'#D6FF3F', secondary:'#FF2D55', border:'rgba(214,255,63,0.35)' }},
  'steel-tactical': {{ bgDark:'#0C1014', panelDark:'#161D24', textDark:'#D1D9E0', bgLight:'#EAEEF2', panelLight:'#FFFFFF', textLight:'#1C242B', accent:'#2FD57A', secondary:'#F59E0B', border:'rgba(47,213,122,0.26)' }},
  'parchment': {{ bgDark:'#181512', panelDark:'#24201B', textDark:'#EFECE6', bgLight:'#F6F1E7', panelLight:'#FCF9F2', textLight:'#26221E', accent:'#E07A5F', secondary:'#81B29A', border:'rgba(224,122,95,0.28)' }}
}};

let currentTheme = localStorage.getItem('kg_nocturnal_theme') || 'cosmic-cyber';
let currentMode = localStorage.getItem('kg_nocturnal_mode') || 'dark';
let selectedPattern = PAYLOAD.patterns[0];
let audioCtx = null;
let isPlaying = false;
let activeOscs = [];

function applyTheme() {{
  const t = THEMES[currentTheme] || THEMES['cosmic-cyber'];
  const dark = currentMode === 'dark';
  document.documentElement.style.setProperty('--bg', dark ? t.bgDark : t.bgLight);
  document.documentElement.style.setProperty('--panel', dark ? t.panelDark : t.panelLight);
  document.documentElement.style.setProperty('--text', dark ? t.textDark : t.textLight);
  document.documentElement.style.setProperty('--accent', t.accent);
  document.documentElement.style.setProperty('--secondary', t.secondary);
  document.documentElement.style.setProperty('--border', t.border);
  drawRoll();
}}

function drawRoll() {{
  const c = document.getElementById('rollCanvas');
  const ctx = c.getContext('2d');
  const w = c.width, h = c.height;
  ctx.fillStyle = '#07080D';
  ctx.fillRect(0, 0, w, h);
  const p = selectedPattern;
  const minM = Math.max(55, p.minPitch - 2);
  const maxM = Math.min(96, p.maxPitch + 2);
  const span = Math.max(12, maxM - minM + 1);
  const rowH = (h - 30) / span;
  const t = THEMES[currentTheme] || THEMES['cosmic-cyber'];

  for (let b = 0; b <= p.bars * 4; b++) {{
    const x = 40 + (b / (p.bars * 4)) * (w - 50);
    ctx.strokeStyle = b % 4 === 0 ? 'rgba(102,252,241,0.25)' : 'rgba(255,255,255,0.06)';
    ctx.beginPath(); ctx.moveTo(x, 20); ctx.lineTo(x, h - 10); ctx.stroke();
  }}
  p.notes.forEach(n => {{
    const x = 40 + (n.startTick / p.loopTicks) * (w - 50);
    const nw = Math.max(4, (n.durationTicks / p.loopTicks) * (w - 50));
    const y = 22 + (maxM - n.midi) * rowH;
    ctx.fillStyle = t.accent;
    ctx.fillRect(x, y, nw, Math.max(5, rowH - 2));
  }});
}}

function selectPat(id) {{
  stopAudio();
  selectedPattern = PAYLOAD.patterns.find(p => p.id === id) || PAYLOAD.patterns[0];
  document.getElementById('patBadges').innerHTML =
    `<span class="badge badge-accent mono">#${{selectedPattern.id}}</span>` +
    `<span class="badge mono">${{selectedPattern.group}}</span>` +
    `<span class="badge mono">${{selectedPattern.tonalCenter}} ${{selectedPattern.scale}}</span>` +
    `<span class="badge mono">${{selectedPattern.bpm}} BPM • ${{selectedPattern.bars}} Bars</span>` +
    `<span class="badge mono">legato: ${{selectedPattern.legato ? 'yes' : 'no'}}</span>`;
  document.getElementById('patTitle').textContent = selectedPattern.name;
  document.getElementById('patDesc').textContent = selectedPattern.motifDesc;
  document.getElementById('patChords').textContent = selectedPattern.chords.map((c, i) => `${{c}} (${{selectedPattern.romans[i]}})`).join('  |  ');
  document.getElementById('patBorrowed').textContent = 'Borrowed Chords: ' + selectedPattern.borrowedChords;
  document.getElementById('patOutNotes').textContent = 'Out-of-Scale Notes: ' + selectedPattern.outOfScaleNotes;
  document.getElementById('patSound').textContent = 'Patch: ' + selectedPattern.soundSuggestion;
  renderList(document.getElementById('searchBox').value);
  drawRoll();
}}

function stopAudio() {{
  isPlaying = false;
  document.getElementById('playBtn').textContent = '▶ Play Dry/FX Loop';
  activeOscs.forEach(o => {{ try {{ o.stop(); }} catch(e){{}} }});
  activeOscs = [];
}}

function playAudio() {{
  if (isPlaying) {{ stopAudio(); return; }}
  isPlaying = true;
  document.getElementById('playBtn').textContent = '■ Stop Loop';
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const p = selectedPattern;
  const secPerTick = (60 / p.bpm) / 480;
  const now = audioCtx.currentTime + 0.03;
  const useFx = document.getElementById('fxSelect').value === 'fx';

  const master = audioCtx.createGain();
  master.gain.value = 0.28;
  master.connect(audioCtx.destination);

  let delayNode = null;
  if (useFx) {{
    delayNode = audioCtx.createDelay(1.0);
    delayNode.delayTime.value = (60 / p.bpm) * 0.75;
    const fb = audioCtx.createGain(); fb.gain.value = 0.3;
    const wet = audioCtx.createGain(); wet.gain.value = 0.25;
    delayNode.connect(fb); fb.connect(delayNode);
    delayNode.connect(wet); wet.connect(master);
  }}

  p.notes.forEach(n => {{
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 440 * Math.pow(2, (n.midi - 69) / 12);
    const st = now + n.startTick * secPerTick;
    const dur = Math.max(0.04, n.durationTicks * secPerTick);
    g.gain.setValueAtTime(0.001, st);
    g.gain.linearRampToValueAtTime((n.velocity / 127) * 0.5, st + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, st + dur + 0.02);
    osc.connect(g); g.connect(master);
    if (delayNode) g.connect(delayNode);
    osc.start(st); osc.stop(st + dur + 0.03);
    activeOscs.push(osc);
  }});
}}

function renderList(q = '') {{
  const listEl = document.getElementById('patternList');
  const ql = q.toLowerCase();
  listEl.innerHTML = PAYLOAD.patterns
    .filter(p => `${{p.id}} ${{p.name}} ${{p.group}} ${{p.tonalCenter}} ${{p.scale}}`.toLowerCase().includes(ql))
    .map(p => `<div class="pattern-item ${{p.id === selectedPattern.id ? 'active' : ''}}" onclick="selectPat('${{p.id}}')">
      <div>
        <div style="font-weight:700; font-size:13px;">#${{p.id}} — ${{p.name}}</div>
        <div class="mono" style="font-size:11px; opacity:0.75;">${{p.group}} • ${{p.tonalCenter}} ${{p.scale}} • ${{p.bpm}} BPM</div>
      </div>
      <span class="badge mono">${{p.bars}}b</span>
    </div>`).join('');
}}

document.getElementById('themeSelect').value = currentTheme;
document.getElementById('themeSelect').addEventListener('change', e => {{
  currentTheme = e.target.value;
  localStorage.setItem('kg_nocturnal_theme', currentTheme);
  applyTheme();
}});
document.getElementById('modeBtn').addEventListener('click', () => {{
  currentMode = currentMode === 'dark' ? 'light' : 'dark';
  localStorage.setItem('kg_nocturnal_mode', currentMode);
  applyTheme();
}});
document.getElementById('playBtn').addEventListener('click', playAudio);
document.getElementById('searchBox').addEventListener('input', e => renderList(e.target.value));

applyTheme();
selectPat('001');
</script>
</body>
</html>
"""
    for target in [
        base / "dashboard-Claude.html",
        base / "dashboard-Cursor.html",
        base / "public" / "dashboard-Claude.html",
        base / "public" / "dashboard-Cursor.html",
    ]:
        target.write_text(html, encoding="utf-8")


if __name__ == "__main__":
    build_standalone_dashboard()
    print("Standalone dashboards generated successfully.")
