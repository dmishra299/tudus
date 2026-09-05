# tudus — Architecture Evolution

A living record of how the architecture has changed over time — from the simplest possible implementation toward more structured approaches. Each phase captures what existed, what changed, and why. Kept as a learning reference and a trail of decisions.

---

## Phase 1 — Single file (original)

### Architecture

Everything inline in `index.html`.

```
index.html
│
├── <style>          ← all CSS (~265 lines)
├── <div id="app">   ← all HTML shell (~70 lines)
└── <script>         ← all JS (~1300 lines, 17 numbered sections)
```

One file = one editing surface. Open, change, save, reload. No steps in between.
The 17 internal sections are in strict dependency order, separated by banner comments —
they impose discipline, but navigation is by scrolling rather than the filesystem.

### Section map (JS)

| # | Section | Responsibility |
|---|---------|---------------|
| 1 | Date engine | ISO week math, labels, week offsets |
| 2 | Seed data | First-run tasks (real W33–W36 data) |
| 3 | Storage | load, save, export, import, switchContext |
| 4 | State | `S` object, `store` variable |
| 5 | Week management | getWeek, ensureWeek, allWeeks |
| 6 | Carry-forward | maybeCarryForward |
| 7 | Helpers | date format, days/biz-days, toast, status cycle |
| 8 | Drag & drop | initDrag, dropTask, ghost card |
| 9 | Week view | renderCarryBanner, buildCardHtml, renderWeek |
| 10 | Actions | doAction, quick-date picker, dropdowns |
| 11 | Month view | renderMonth, jumpToTask |
| 12 | Modal | parseSubs, openModal, saveTask |
| 13 | Notes tooltip | showNotesTooltip, hideNotesTooltip |
| 14 | Notes modal | openNotes, saveNotes, clearNotes |
| 15 | Header sync | syncHeader |
| 16 | Theme | applyTheme, cycleTheme |
| 17 | Events | navigation, event wiring, init IIFE |

---

## Phase 2 — Modular source + build step ✓ Done (Aug 2026)

### What changed

Source files split into `src/`; `build.js` concatenates them back into `index.html`. The distributable (`index.html`) is identical in structure and behaviour to Phase 1 — the build step only affects the development workflow.

### Architecture

```
src/
├── shell.html              ← HTML skeleton with <!--CSS--> and <!--JS--> markers
├── css/
│   ├── 1-tokens.css        ← design tokens, reset
│   ├── 2-layout.css        ← header, nav, main
│   ├── 3-cards.css         ← task cards, quick-date popover, status pills, drag
│   ├── 4-month.css         ← month view accordion
│   ├── 5-modal.css         ← add/edit modal, notes modal, tooltip
│   └── 6-misc.css          ← toast, .hidden, reduced-motion
└── js/
    ├── 01-date-engine.js
    ├── 02-seed.js
    ├── 03-storage.js
    ├── 04-state.js
    ├── 05-week-management.js
    ├── 06-carry-forward.js
    ├── 07-helpers.js
    ├── 08-drag-drop.js
    ├── 09-week-view.js
    ├── 10-actions.js
    ├── 11-month-view.js
    ├── 12-modal.js
    ├── 13-notes-tooltip.js
    ├── 14-notes-modal.js
    ├── 15-header.js
    ├── 16-theme.js
    └── 17-events.js

build.js        ← ~30 lines, only uses Node built-ins (fs, path)
server.js       ← unchanged
index.html      ← built output; distribute this, do not edit directly
```

### Why not ES modules?

`<script type="module">` is blocked by browser security on `file://` URLs, which would break
standalone mode. Plain `<script>` concatenation via `build.js` preserves both standalone and
server modes without any compromise.

### Trade-off comparison

| | Phase 1 | Phase 2 |
|---|---|---|
| Edit flow | open file → change → reload | change source → `node build.js` → reload |
| Finding code | scroll + section banners | open the right file |
| Git diffs | one large file | one file per concern |
| Works on `file://` | yes | yes (built output still works) |
| Works via `node server.js` | yes | yes |
| New tool dependency | none | none (Node already required for server mode) |
| Distributable | `index.html` itself | `index.html` (built output) |

### Decision rationale

The build step costs almost nothing — Node is already required for server mode.
The gain (opening `09-week-view.js` instead of scrolling a 1600-line file) compounds
with every future change. The distributable stays identical.

---

## Phase 3 — (future)

_Record the next architectural shift here when it happens._
