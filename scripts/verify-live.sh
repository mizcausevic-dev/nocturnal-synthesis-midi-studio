#!/usr/bin/env bash
# Confirm the GitHub Pages site is serving the lab, the article, and the pack.
set -euo pipefail
base="${1:-https://mizcausevic-dev.github.io/nocturnal-synthesis-midi-studio}"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

fetch() {
  local path="$1" dest="$2" code="" attempt
  for attempt in 1 2 3 4 5 6 7 8; do
    code="$(curl -sS -L -o "$dest" -w '%{http_code}' "$base$path" || true)"
    if [ "$code" = "200" ]; then
      echo "200  $path"
      return 0
    fi
    echo "wait $path HTTP ${code:-none} (try $attempt)" >&2
    sleep 8
  done
  echo "FAIL $path HTTP ${code:-none}" >&2
  exit 1
}

fetch "/" "$tmp/index.html"
fetch "/article.html" "$tmp/article.html"
fetch "/data/patterns.json" "$tmp/patterns.json"
fetch "/data/validation_report.json" "$tmp/report.json"
fetch "/synthwave_darkwave_50_midi_leads.zip" "$tmp/pack.zip"
fetch "/midi/001_chrome_horizon.mid" "$tmp/001.mid"
fetch "/sitemap.xml" "$tmp/sitemap.xml"
fetch "/favicon.svg" "$tmp/favicon.svg"

python3 - "$tmp" <<'PY'
import json, sys, zipfile
from pathlib import Path
root = Path(sys.argv[1])
index = (root / "index.html").read_text()
article = (root / "article.html").read_text()
assert "Fifty leads" not in index or "Nocturnal Synthesis" in index
assert "Nocturnal Synthesis: 50 Free Synthwave and Darkwave Lead MIDI Files" in index
assert "50 Free Synthwave and Darkwave MIDI Leads, Built Like Software" in article
assert "bvii" in article
assert "__SEO_TITLE__" not in article
patterns = json.loads((root / "patterns.json").read_text())
assert patterns["meta"]["patterns"] == 50
assert patterns["meta"]["notes"] == 1024
assert patterns["patterns"][0]["name"] == "Chrome Horizon"
report = json.loads((root / "report.json").read_text())
assert report["summary"]["checks_passed"] == 19
assert report["summary"]["checks_total"] == 19
assert report["summary"]["failed"] == 0
midi = (root / "001.mid").read_bytes()
assert midi[:4] == b"MThd", midi[:4]
with zipfile.ZipFile(root / "pack.zip") as zf:
    bad = zf.testzip()
    assert bad is None, bad
    names = zf.namelist()
assert "midi/001_chrome_horizon.mid" in names
assert any(name.endswith("manifest.json") for name in names)
print("live content checks passed")
PY
