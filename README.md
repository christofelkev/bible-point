<img src="app-icon.svg" width="96" align="right" alt="Bible Point icon">

# Bible Point

**Fast, offline church presentation software for projecting Bible verses, worship lyrics, and sermon slides to a second screen.**

Built specifically for church multimedia operators: no complex slide preparation, no internet connection required during service, and nothing on the projector display except the content itself.

Windows desktop application built with **Tauri 2**, **React 19**, **TypeScript**, and **SQLite**.

---

## Why Bible Point?

Church multimedia operators often spend hours building slides by hand before a Sunday service, and then scramble when the preacher quotes an unexpected passage or the worship leader repeats a chorus. Bible Point solves this:

1. **Pure Content Output:** Only the verse, lyric, or slide image reaches the congregation display. No toolbars, cursor, or application chrome.
2. **The Preview is the Output:** Both the operator's preview and the fullscreen projector mount the exact same rendering engine (`VerseStage`), guaranteeing 100% visual fidelity.
3. **Dual Workspace Architecture:**
   - **Bible Mode:** Instant reference jump, full-text scripture search, multi-verse selection, and offline pack management.
   - **Live Mode:** Worship lyrics, ProPresenter-style hotkeys, PDF/PowerPoint sermon slides, and on-the-fly background media bin.
4. **Offline First:** The internet is only needed when downloading translation packs from the catalogue. Everything else runs locally.
5. **Non-Destructive & Low Operator Stress:** One keystroke to cut to black, clear text, or jump to any section.

---

## Key Features

### 📖 Bible Mode

- **Unified Omnibox:** Type a reference like `john 3:16` and press Enter to navigate directly, or type keywords to run high-speed full-text search (SQLite FTS5).
- **Two-Column Canon Browser:** Rapidly pick any book and chapter across the 66 books of the Bible.
- **Multi-Verse Selection:** Select individual verses or range-click (`Shift`+click) to project contiguous passages as a unified slide with superscript verse markers.
- **Offline Translations Catalogue:** Download over 1,300 redistributable translations across 1,000+ languages from [eBible.org](https://ebible.org).
- **Custom Sideloading:** Install copyrighted or local translations (e.g. *Terjemahan Baru* / TB) directly from verse-per-line `.txt` or `.zip` files.

---

### 🎵 Worship Songs & Lyrics (Live Mode)

- **Smart Song Creation:** Paste lyrics with blank lines or section tags (`[Verse 1]`, `[Chorus]`, `[Bridge]`). Clean, minimal editor asking only for title and lyric text.
- **Interactive Slide Matrix:** Visual card grid for each lyric slide with clean typography and real-time live status.
- **Cascading Section Tagging:**
  - Right-click any slide card to assign or change its section group (`Verse 1`, `Verse 2`, `Chorus 1`, `Chorus 2`, `Bridge`, `Pre-Chorus`, `Tag`, `Intro`, `Ending`).
  - Automatically cascades the section forward across subsequent slides until the next section start boundary.
  - Option to merge back into the preceding section with one click.
- **ProPresenter-Style Letter Hotkeys:**
  - In Live mode, press a single key to jump instantly to the first slide of that section:
    - `A` → Verse 1
    - `S` → Verse 2
    - `D` → Verse 3
    - `C` → Chorus 1
    - `X` → Chorus 2
    - `B` → Bridge
    - `P` → Pre-Chorus
    - `T` → Tag
    - `I` → Intro
    - `E` → Ending / Outro
  - Customize any section hotkey via the **Settings (Pengaturan)** dialog in the top bar.

---

### 📑 PDF & PowerPoint Presentations (Live Mode)

- **Native PDF & PPTX Import:** Directly import sermon slideshows and sermon notes.
- **Intelligent Portrait Handling:**
  - **Split Mode:** Automatically splits tall portrait pages into two widescreen 16:9 landscape slides (top and bottom halves) so text remains large and readable.
  - **Fit 16:9 Mode:** Centers and fits pages cleanly without cropping.
- **100% Full-Bleed Projection:** High-resolution edge-to-edge slide projection without padding, overlays, or distracting metadata strips.

---

### 🎨 Live Media Bin & Theme Engine

- **On-the-Fly Media Bin:** Instantly switch projector backgrounds during worship using stock gradients, looping motion videos, or operator-uploaded photos and videos (`.jpg`, `.png`, `.mp4`, `.webm`) without modifying preset themes.
- **Adaptive Auto-Fit:** Binary-search layout measuring guarantees text never overflows the screen regardless of lyric or verse length.
- **Resolution Independence:** Type sizes and layouts are measured in container query units (`cqh`/`cqw`), looking identical on a 320px laptop preview and a 4K church projector.
- **Deep Styling Customization:**
  - Fonts (including custom `.ttf`, `.otf`, `.woff2` files)
  - Colors, outlines, drop shadows, uppercase transformations
  - Background scrim dimming and selective blur (applied to background media only, never obscuring text)
  - Transitions: Fade, Slide Up, Zoom, or Instant Cut.

---

### 📋 Unified Service Playlist

- Build service orders in advance by interleaving scriptures, songs, and presentation decks into a single rundown.
- Reorder items effortlessly and double-click to load any setlist element into the live workspace.

---

## Download & Installation

Get the latest release for Windows from the [GitHub Releases](https://github.com/christofelkev/bible-point/releases) page:

| Package | Format | Description |
| --- | --- | --- |
| **`Bible.Point_x.y.z_x64-setup.exe`** | NSIS Installer | Recommended lightweight installer with desktop shortcut and uninstaller. |
| **`Bible.Point_x.y.z_x64_en-US.msi`** | MSI Installer | Standard Windows Installer package for corporate or enterprise deployment. |
| **`bible-point.exe`** | Portable Executable | Standalone executable that runs without installation. |

> **Note on Windows SmartScreen:**  
> The installer is not digitally code-signed with an expensive commercial certificate. If Windows SmartScreen appears on first launch, click **More info** → **Run anyway**.

---

## Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl` + `1` | Switch to **Bible Mode** |
| `Ctrl` + `2` | Switch to **Live Mode** (Songs & Presentations) |
| `Space` / `→` / `PageDown` | Advance to next verse or slide |
| `←` / `PageUp` | Return to previous verse or slide |
| `1` – `9` | Jump directly to slide index 1 through 9 |
| `A`, `S`, `D` | Jump to **Verse 1**, **Verse 2**, **Verse 3** |
| `C`, `X` | Jump to **Chorus 1**, **Chorus 2** |
| `B` | Jump to **Bridge** |
| `P` | Jump to **Pre-Chorus** |
| `T` | Jump to **Tag** |
| `F1` | Cut projection to **Black** |
| `F2` | **Clear** text (display background only) |
| `F3` / `Escape` | Display **Logo / Idle** screen |
| `Home` / `End` | Jump to first / last slide |

*(Shortcuts are automatically suppressed while typing in input fields to prevent accidental projection cutaways).*

---

## Development

### Prerequisites

- Node.js 20+
- Rust 1.77+ and MSVC C++ Build Tools
- Windows 10 or 11 (64-bit)

### Getting Started

```bash
# Clone the repository
git clone https://github.com/christofelkev/bible-point.git
cd bible-point

# Install dependencies
npm install

# Run frontend in browser mode (Fast UI iteration on port 1420)
npm run dev

# Run desktop app in Tauri development mode
npm run desktop

# Run tests and type-checks
npm run build && npm run lint
cd src-tauri && cargo test

# Build production installers (EXE & MSI)
npm run desktop:build
```

---

## Codebase Architecture

```
src/
  types/          TypeScript domain models (Bible, Theme, Projection, Song, Presentation)
  data/           Static data: 66 books canon, preset themes, stock media, hotkey mappings
  services/       Pluggable services with Browser and Tauri implementations:
    bible/          SQLite FTS5 querying and pack installation
    projection/     Dual-window IPC transport and display detection
    settings/       Atomic JSON persistence store
    songs/          Lyric parser, cascading section manager, and song storage
    presentation/   PDF/PPTX client-side rendering and storage
    media/          Background import and font rehydration
  store/          Zustand state store and debounced persistence
  components/
    stage/        VerseStage and StageBackground (shared by preview & projector)
    control/      Operator control panels, TopBar, and Settings modal
    live/         LiveWorkspace, SongEditorModal, SectionContextMenu, MediaBinPanel
  routes/         ControlWindow (operator) and OutputWindow (projector)

src-tauri/src/
  lib.rs          Tauri builder, command handlers, and window event listeners
  db.rs           SQLite schema and FTS5 full-text indexing
  catalog.rs      eBible.org license filtering and download catalogue
  install.rs      Pack verification, VPL text parsing, and database import
  media.rs        Sanitized file persistence for custom media and fonts
  settings.rs     Atomic crash-safe settings persistence
  songs.rs        Isolated JSON persistence for songs
  presentations.rs Storage and management for presentation decks
```

---

## License & Credits

- Scripture catalogue metadata provided by [eBible.org](https://ebible.org). Each translation remains the copyright of its respective publisher.
- Developed by **christofelkev** (*made with love by chrivin*).
