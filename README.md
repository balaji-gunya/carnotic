# Carnotic — Carnatic Notation Editor

A single-page web app for notating Carnatic songs with lyrics and sargam. Clean, printable, no account needed.

**Live:** https://balaji-gunya.github.io/carnotic/

---

## Features

- Lyrics + sargam notation side by side in a beat grid
- Raga & tala metadata (arohanam, avarohanam)
- Swara chip palette with direction arrows (ārōha/avarōha)
- Gamaka markers (slide, etc.) and speed levels
- Heading rows, remarks rows
- Per-row actions: insert above/below, copy, cut, paste, delete
- Export as self-contained HTML (reopenable, editable)
- Print to PDF with clean layout

> **Laptop/PC only** — not supported on mobile browsers.

---

## Note System

| Swara | Variants |
|-------|----------|
| S     | S (only one) |
| R     | R1 · R2 · R3 |
| G     | G0 · G1 · G2 |
| M     | M1 · M2 |
| P     | P (only one) |
| D     | D1 · D2 · D3 |
| N     | N0 · N1 · N2 |

Note: R3 = G1 and R2 = G0 are enharmonic equivalents.

**Octave prefix/suffix:**
- Mandra (lower octave): prefix `,` — e.g. `,S`
- Taar (upper octave): suffix `'` — e.g. `S'`

**Beat input format:** Enter beats as `4` (simple) or `3+3` (groups) or `3+3/4` (segments/lines).

---

## Song Library

Songs are stored under `songs/<song-name>/`:

```
songs/
  manifest.json           ← index of all songs
  rasathi-unna/
    notation.html         ← editable notation file
    sheet.pdf             ← printable PDF
```

### Adding a new song

1. Notate the song in the editor and click **Download HTML** — save it to `songs/<song-name>/notation.html`
2. Print from the editor (Ctrl/Cmd+P) → Save as PDF → save it to `songs/<song-name>/sheet.pdf`
3. Add an entry to `songs/manifest.json`:
   ```json
   {
     "title": "Song Name",
     "composer": "Composer Name",
     "folder": "song-name",
     "html": "notation.html",
     "pdf": "sheet.pdf"
   }
   ```
4. Commit and push — the home page picks it up automatically.

---

## Repository Structure

```
carnotic/
  index.html        ← home / song library
  editor.html       ← the notation editor
  songs/
    manifest.json
    <song-name>/
      notation.html
      sheet.pdf
```

---

## Running Locally

Just open `index.html` in a browser. No build step, no dependencies.

> Note: the song library uses `fetch('songs/manifest.json')`, which requires a local server (not `file://`).  
> Quick way: `python3 -m http.server` in the repo root, then open `http://localhost:8000`.
