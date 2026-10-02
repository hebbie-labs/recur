# Recur Showreel (15s)

Motion-Graphics-Video für Recur: 1080p, 60 fps, 128 BPM (32 Beats = exakt 15 s), loopt nahtlos.
Alles ist code-generiert: jeder Frame ist eine reine Funktion der Zeit (Canvas), der Sound wird in Python synthetisiert.

- `showreel.html` Animation. Im Browser öffnen = Live-Vorschau (Leertaste pausiert, `?t=3.2` friert eine Sekunde ein).
- `audio.py` Soundtrack (nur stdlib), liest `out/cues.json` und trifft damit exakt die Animations-Events.
- `render.cjs` rendert per Playwright Frame für Frame und muxt mit ffmpeg.
- `fonts/` Geist Mono (OFL).

## Rendern

```bash
cd promo
export NODE_PATH=$(npm root -g)   # braucht Playwright + Chromium + ffmpeg
node render.cjs --still 3          # schreibt out/cues.json (+ ein Standbild)
python3 audio.py                   # out/audio.wav
node render.cjs --fps 60 --audio out/audio.wav   # out/recur-showreel.mp4
```

Nur Standbilder zum Testen: `node render.cjs --still 1.5,6.5,13`.
