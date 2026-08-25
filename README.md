<img src="app-icon.svg" width="96" align="right" alt="Bible Point icon">

# Bible Point

**Project Bible verses onto a second screen during a church service.**

Like PowerPoint, but built for scripture: no slides to prepare, no internet
needed once a translation is installed, and nothing on the projector except the
verse itself.

Windows desktop app built with Tauri 2, React and SQLite.

---

## Why it exists

Church multimedia operators usually build slides by hand before a service, then
scramble when the preacher opens a passage that was not in the plan. Bible Point
removes the slide-making step entirely — you look a verse up and it is on screen.

The design follows five rules:

1. **Nothing but the verse reaches the projector.** No toolbars, no cursor, no
   application chrome.
2. **The preview is the output.** Both windows render the same component, so what
   the operator sees is exactly what the congregation sees.
3. **Offline first.** The internet is needed only to download a translation.
4. **Translations are extensions, not built-ins.** You choose what to install.
5. **Mistakes are cheap.** Every live action is one keystroke away from being undone.

## Features

### Projection

- Two windows: a control window for the operator, and a borderless output window
  that goes fullscreen on the display you choose.
- Automatic monitor detection — the projector is picked by default, with a manual
  override. With only one display attached the output opens as an ordinary
  movable window instead of burying the controls.
- Live controls: previous, next, **Clear** (background only), **Black** (cut to
  black), and an idle screen for before the service starts.
- Keyboard shortcuts: `←` `→` step verses, `B` black, `C` clear, `Enter` project
  the selection, `Esc` idle. Suppressed while typing, so a reference lookup never
  cuts the screen by accident.

### Finding verses

- One search box does two jobs: type `john 3:16` and press Enter to jump, or type
  words to run a full-text search (SQLite FTS5).
- Two-column canon browser — books and chapters both visible at once.
- Select a single verse, shift-click for a range, or double-click to project
  immediately. Multiple verses render as one slide with superscript numbers.
- A service order (playlist) you can build ahead of time; each entry remembers the
  look it was queued with.

### Look and feel

- **Backgrounds:** solid colour, gradient (linear or radial, with presets), or your
  own image or looping video.
- **Overlay:** dim and blur applied to the background only, never the text, so a
  busy photo can be softened without hurting readability.
- **Typography:** font, size, weight, colour, line height, letter spacing, shadow,
  outline, uppercase — plus your own font files (`.ttf`, `.otf`, `.woff`, `.woff2`).
- **Layout:** alignment, vertical position, padding, column width, and where the
  verse reference sits.
- **Transitions:** fade, slide, zoom, or none, with adjustable duration.
- Six built-in themes, plus your own saved presets. Sizes are expressed relative
  to screen height, so one theme looks identical on a laptop preview and a 4K
  projector.
- Presets export to a file so a look built on one machine can be used on another.

### Everything persists

Themes, presets, the service order, the active translation, and your display
choice all survive a restart. Settings are written atomically, so losing power
mid-save leaves either the old file or the new one — never a broken one.

What is deliberately *not* restored is the projection itself. An app reopened on
Sunday morning starts on a blank screen rather than resuming last week's verse.

## Bible translations

Bible Point ships **no scripture of its own**. Translations are downloaded as
packs and stored in a local SQLite database.

The catalogue comes from [eBible.org](https://ebible.org) and is filtered by the
publisher's own `Redistributable` flag — not by a hand-maintained allowlist, which
would go stale the moment a publisher changed terms. Around 1,300 translations
across more than 1,000 languages qualify. Each one's copyright line is shown
verbatim in the Bible Manager.

**Indonesian:** Alkitab Yang Terbuka (AYT, complete Old and New Testament),
Terjemahan Sederhana Indonesia (TSI), and Alkitab Gratis untuk Semua (New
Testament).
**English:** King James Version, World English Bible, Berean Standard Bible,
Bible in Basic English, and others.

### Copyrighted translations

Translations such as *Terjemahan Baru* are not in the catalogue, and will not be
added. Being free and non-commercial is not a defence: reproduction and
distribution are what copyright protects, regardless of whether money changes
hands.

The legitimate route for those is **sideloading** — install from your own copy
using **Bible Manager → Pasang dari berkas**. Accepted formats are a
verse-per-line text file or a zip containing one:

```
GEN 1:1 In the beginning God created the heaven and the earth.
JHN 3:16 For God so loved the world...
```

Sideloaded packs stay on your machine. Holding a private copy is not permission to
redistribute it, so do not bundle one when sharing this app with another church.

## Install

Download the latest installer from the
[Releases](https://github.com/christofelkev/bible-point/releases) page:

- **`Bible Point_x.y.z_x64-setup.exe`** — NSIS installer, smaller download.
- **`Bible Point_x.y.z_x64_en-US.msi`** — MSI, for deployment via Group Policy.

Requires Windows 10 or 11. WebView2 ships with current Windows; the installer
fetches it if missing.

> The installer is **not code-signed**, so Windows SmartScreen will warn you.
> Choose *More info* → *Run anyway*. A signing certificate costs money and this
> project does not have one.

### First run

1. Open **Alkitab** (Bible Manager) and download a translation.
2. Click **Buka Output** to open the projection window.
3. Pick a verse and press **Tayangkan**.

The interface is in Indonesian.

## Development

```bash
npm install
```

```bash
npm run dev
```

Browser mode on port 1420. Fastest way to iterate on the interface. Uses sample
chapters compiled into the bundle; no database, no downloads.

```bash
npm run desktop
```

The real Tauri shell. Needed to test window behaviour, downloads, and storage.

```bash
npm run desktop:build
```

Produces both installers in `src-tauri/target/release/bundle/`.

### Checks

```bash
npm run build && npm run lint
```

```bash
cd src-tauri && cargo test
```

An end-to-end test that downloads a real translation and queries it back is
excluded from the default run because it needs the network:

```bash
cd src-tauri && cargo test --test pack_pipeline -- --ignored --nocapture
```

### Requirements

Node 20+, Rust 1.77+, and the MSVC build tools.

### How it is put together

```
src/
  types/       Domain shapes, independent of React and storage
  data/        Book names, built-in themes, sample chapters
  services/    Every external dependency, each behind one interface
  store/       Zustand store and debounced persistence
  components/  stage/ is shared by both windows; control/ is operator-only
  routes/      ControlWindow and OutputWindow

src-tauri/src/
  db.rs        SQLite schema and queries (FTS5)
  catalog.rs   Fetch and licence-filter the translation catalogue
  install.rs   Download, extract, parse, import
  media.rs     Store and prune operator-supplied backgrounds and fonts
  settings.rs  Atomic settings file
```

Two ideas hold the codebase together:

**One stage component, two mounts.** `VerseStage` is the only code that knows what
a projected verse looks like. It renders scaled-down in the operator's preview and
fullscreen in the output window. Because both are the same code, the preview
cannot drift from reality.

**Every external dependency sits behind an interface.** Scripture, the
window-to-window channel, settings storage, and window creation each have one
interface with two implementations — browser and Tauri — chosen by a single line
in the service's `index.ts`. That is what lets the whole interface be developed in
a browser and shipped in a desktop shell.

The app icon is generated from `app-icon.svg`; regenerate every size with
`npx tauri icon app-icon.svg` rather than editing files in `src-tauri/icons/`.

## Status

Version 0.1.0 — usable, and used. Not yet done:

- No automated UI tests. The Rust layer has unit tests plus an end-to-end pack
  test; the interface is verified by hand.
- No code signing, so SmartScreen warns on install.
- No auto-update.
- Windows only. Nothing in the code is Windows-specific, but macOS and Linux
  builds have never been produced or tested.

## Credits

Scripture texts come from [eBible.org](https://ebible.org), which publishes the
catalogue metadata this app relies on to decide what may be redistributed. Each
translation remains the property of its publisher, credited in the app.
