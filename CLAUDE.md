# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Working conventions

- **Never commit or push** unless the user explicitly asks. Make the code change and stop — the user reviews before committing.
- **No Co-Authored-By trailer** in commit messages. This is a public repo and the user does not want Claude attribution visible on GitHub.

## What this is

**tudus** is a personal minimalist task-tracking tool for a software architect. `index.html` is the single-file production app — **built** from modular sources in `src/` via `node build.js`. `server.js` is an optional companion server (Node.js, no npm) that persists data to `tudus-work.json` and `tudus-lab.json` instead of `localStorage`. Two contexts exist — **Work** (weekly tasks) and **Lab** (side projects / experiments) — each with its own data store.

`index.html.backup` is the pre-split regression baseline.

## Source layout & build

```
src/
├── shell.html          ← HTML skeleton; contains <!--CSS--> and <!--JS--> markers
├── css/
│   ├── 1-tokens.css    ← design tokens, reset
│   ├── 2-layout.css    ← header, nav, main
│   ├── 3-cards.css     ← task cards, quick-date popover, status pills, drag
│   ├── 4-month.css     ← month view accordion
│   ├── 5-modal.css     ← add/edit modal, notes modal, tooltip
│   ├── 6-misc.css      ← toast, .hidden, reduced-motion
│   └── 7-notes.css     ← standalone Notes view: masonry layout, collage cards, full-view modal
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
    ├── 17-events.js    ← navigation, event wiring, init IIFE
    └── 18-notes-view.js ← standalone Notes view: render, add/edit/delete, full-view modal
```

**To rebuild `index.html` after editing any source file:**

```
node build.js
```

`build.js` reads `src/css/*.css` and `src/js/*.js` in filename order, concatenates them, then reads `src/shell.html` as a template, replaces its `<!--CSS-->` and `<!--JS-->` markers with the concatenated content, and writes the result to `index.html`. No npm, no watch mode — just re-run after editing.

ES modules (`<script type="module">`) are intentionally not used — they are blocked on `file://` URLs, and the app must work in both standalone and server modes.

## Running the app

**Standalone** — open `index.html` directly in any browser (`file://`). Data goes to `localStorage`. Good for quick use; not portable across browsers or machines.

**Server mode (recommended)** — run `node server.js`, then open `http://localhost:3003`. Work data saves to `data/tudus-work.json`, Lab data to `data/tudus-lab.json`. Copy the folder to move data anywhere. The app detects the HTTP origin via `SERVER_MODE = location.protocol === 'http:'` and shows a toast on startup confirming the connection and active context.

## Architecture

`index.html` is assembled by concatenating `src/css/*.css`, `src/js/*.js`, and the HTML in `src/shell.html`. Sections 1–2 below correspond to `src/css/` and `src/shell.html`; sections 3–18 correspond to `src/js/01-date-engine.js` through `src/js/18-notes-view.js`. Everything runs as plain globals — no module system.

1. **CSS tokens + reset** — CSS custom properties for the full design system (light + dark + system themes using the three-state token pattern).
2. **HTML shell** — fixed header with adaptive nav, main content area, modal overlay, hidden file-input for import, toast element.
3. **Date engine** (`getISOWeekData`, `offsetWeekData`, `weekLabelFull`, `weekLabelShort`, `monthLabel`) — pure ISO 8601 week math using `Date.UTC`; no libraries. Week refs are `"2026-W34"` internally, `"W34"` for display.
4. **Seed data** (`SEED` constant) — real tasks from `My_Tasks_August_26.txt`, weeks W33–W36. Loaded on first run when localStorage is empty.
5. **Storage layer** (`load`, `save`, `exportData`, `importData`, `switchContext`) — Two localStorage keys: `LS_WORK = 'tudus-work-v1'` and `LS_LAB = 'tudus-lab-v1'`; `lsKey()` returns the right one based on `S.context`. `load(ctx)` is async: fetches `GET /data?ctx=<ctx>` in server mode (server reads from `data/`), falls back to the appropriate localStorage key. Lab returns an empty store on first run (no seed). `save()` writes to `lsKey()` and fire-and-forgets `POST /data?ctx=<S.context>`. `exportData()` downloads `tudus-{context}-YYYY-MM-DD.json`. `switchContext(ctx)` saves the current store, loads the new one, resets view state, and sets `document.documentElement.dataset.ctx` to drive CSS accent overrides.
6. **State object** (`S`) — `{ view, weekRef, currRef, viewOnly, editId, monthContext, context }`. `currRef` is always today's ISO week and never changes. `context` is `'work'` or `'lab'`, persisted in `localStorage` key `'tudus-ctx'` and read by the init IIFE on startup.
7. **Week management** (`getWeek`, `ensureWeek`, `allWeeks`) — `ensureWeek` creates a week entry on demand (called before navigating).
8. **Carry-forward** — manual, not automatic; two independent mechanisms for Work and Lab.
   - **Work** (`maybeCarryForward`): `renderCarryBanner` runs on each week view render. When the immediately preceding stored week has open tasks not yet in the current week, it shows a banner ("N open tasks from Wxx — not yet brought in") with **Bring in** and **Skip** buttons. **Bring in** calls `maybeCarryForward(prevRef, S.weekRef)`, which copies all `status !== 'done'` tasks with new IDs and sets `to.carriedFrom = fromRef`. **Skip** hides the banner in DOM only (reappears on reload). `maybeCarryForward` is idempotent via title-based dedup. Navigation (`navigateWeek`) does NOT trigger carry-forward automatically. `renderCarryBanner` returns immediately (no banner) when `S.context === 'lab'`.
   - **Lab** (`maybeCarryForwardFromMonth`): `renderLabCarryBanner` runs at the top of the Lab month view. When the preceding calendar month has open tasks not yet in the current displayed month (title-based dedup against all tasks across all weeks in the current month), it shows a banner ("N open tasks from [Month Name] — not yet brought in") with **Bring in** and **Skip** buttons. **Bring in** calls `maybeCarryForwardFromMonth(prevYear, prevMonth)`, which copies unbrought open tasks into today's week (`_cwd`), deduped against all weeks in `S.monthContext`. The view stays on the current month after carrying. **Skip** hides the banner in DOM only (reappears on reload). Both source and target use `weeksInMonth(..., byEndDate=true)` so boundary weeks belong to exactly one month.
9. **Render — week view** — split into three focused functions plus the orchestrator. Note: `renderWeek()` is never called in Lab context (Lab is always month view); the Lab-specific empty state in `renderWeek` is unreachable dead code.
   - `renderCarryBanner(week)` — returns immediately in Lab context. Otherwise handles both banner states: done banner (tasks already carried, with Dismiss) and offer banner (unbrought open tasks, with Bring in / Skip).
   - `buildSubtasksHtml(subtasks)` — returns the subtask list HTML; applies per-item `margin-left` for indent levels.
   - `buildCardHtml(t)` — returns the full card `innerHTML` string: grip/rank, head (expand toggle, title, carried tag, kebab menu/dropdown), optional subtask block, footer (next action date + urgency badge, status pill), optional notes panel (preview strip shown directly on the card when `t.notes` exists). Shared by both week and Lab month view.
   - `renderWeek()` — orchestrator: calls `renderCarryBanner`, handles empty-state (Work uses `◦` glyph), then creates each card element, sets its `innerHTML` via `buildCardHtml`, wires `[data-a]` click delegation, notes tooltip, and drag init before appending. Ghost card pattern for drag feedback lives in `initDrag`.
10. **Mouse drag-and-drop** (`initDrag`, `dropTask`) — `mousedown` on grip column → ghost clone at `position:fixed` → `mousemove` moves ghost + shows drop indicator → `mouseup` calls `dropTask` which splices the array and re-ranks.
11. **Actions dispatcher** (`doAction`) — handles `expand`, `status`, `edit`, `delete`, `menu` via `data-a` attributes on card elements. `edit` and `delete` are both guarded by `S.viewOnly`; delete also shows a `confirm()` dialog with the task title before proceeding.
12. **Render — month view** (`renderMonth`, `renderLabMonth`) — two separate rendering paths in `11-month-view.js`, dispatched by `renderMonth()` based on context.
   - **Work** (`renderMonth`): accordion of all weeks overlapping `S.monthContext.{year, month}` (overlap predicate: `startDate <= monthEnd && endDate >= monthStart`). Each week block has a progress bar and done/total count; task rows carry `data-ref` and `data-tid`; click listeners call `jumpToTask(weekRef, taskId)` which sets `S.weekRef`, switches to week view, and applies a `.card-highlight` pulse animation via `requestAnimationFrame`. `jumpToTask` takes a string ref and a number id — never an object.
   - **Lab** (`renderLabMonth`): flat card list — no week accordion. All tasks across weeks whose `endDate` falls in the current month (`weeksInMonth(..., byEndDate=true)`) are rendered as full task cards via `buildCardHtml`. Before each `[data-a]` action dispatch, `S.weekRef` is set from `card.dataset.wref` so `doAction` targets the correct week. Notes tooltip is wired inline. Empty state uses `⚗` glyph and a "+ Start something" button (calls `ensureWeek(_cwd)` then `openModal()`). `renderLabCarryBanner()` is called first (see §8).
   - `weeksInMonth(year, month, byEndDate=false)` in `01-date-engine.js`: the optional `byEndDate` flag assigns each boundary week to the month its `endDate` falls in, preventing cross-month overlap. Lab views always pass `byEndDate=true`; Work views use the default overlap predicate.
13. **Modal** (`openModal`, `closeModal`, `saveTask`) — reused for add (when `S.editId === null`) and edit. `parseSubs` / `subsToText` serialise subtask lines with optional embedded URLs. In Lab context, new tasks default to `expanded: true`; after `saveTask()` adds a new task in Lab, `S.monthContext` is snapped to the week the task landed in before `renderCurrent()` is called, then the notes editor is automatically opened for that task (80ms delay to allow re-render).
14. **Header sync** (`syncHeader`) — called after every state change; updates nav labels, prev/next disabled state (Prev only — Next is never disabled; forward nav creates weeks on demand), **Current Week** two-state style (✓ when on `S.currRef`), **Current Month** two-state style (✓ when `S.monthContext` matches today's month), view toggle active state, context button active states, theme button glyph. Active state logic for the three ctx buttons: Work active when `S.context !== 'lab' && S.view !== 'notes'`; Lab active when `S.context === 'lab'`; Notes active when `S.view === 'notes'`. The view toggle (`.view-seg`) is hidden in Lab, in Notes view, and in any state where week/month sub-toggle is irrelevant. Week nav (`#nav-week`) hidden unless `S.view === 'week'`; month nav (`#nav-month`) hidden unless Lab or `S.view === 'month'`.
15. **Theme** (`applyTheme`, `cycleTheme`) — sets/removes `data-theme` attribute on `<html>`; cycles `system → light → dark`.
16. **View & Navigation** (`setView`, `navigateWeek`, `goToCurrentWeek`, `goToCurrentMonth`, `navigateMonth`) — `setView(v)` forces `v = 'month'` when `S.context === 'lab'`; Lab is always in month view and cannot enter week view. `navigateWeek(+1)` calls `ensureWeek(offsetWeekData(ref, 1))` to create the target week on demand; no automatic carry-forward. Backward navigation stops at the earliest stored week. `navigateWeek` also cleans up the week being left: if it has no tasks, no `carriedFrom`, and is not `S.currRef`, it is removed from `store.weeks` before the ref changes (eliminates forward-navigation artifacts). `goToCurrentMonth` snaps `S.monthContext` to today's month. The **Week** view-toggle button syncs `S.weekRef` to the first week of the displayed month when switching from month view, if the current week is not in that month. A `<input class="week-jump-input">` in the nav header accepts `W33` (current year assumed) or `2026-W33` format on Enter; uses `offsetWeekData(ref, 0)` to compute week dates and `ensureWeek` to create the entry, then navigates directly.
17. **Events & Init** — all event wiring plus the async init IIFE. Keyboard shortcuts: `←/→` navigate weeks (Work) or months (Lab), guarded by `!inInput` so the week-jump input is not affected; `Esc` closes all modals including the Notes full-view overlay; `⌘K`/`Ctrl+K` open add modal. `btn-add` click in Lab calls `ensureWeek(_cwd); S.weekRef = _cwd.ref` before `openModal()` so new tasks always land in today's week. Context buttons: `btn-ctx-work` — if in Notes view, calls `setView('week')` instead of `switchContext`; `btn-ctx-lab` — calls `switchContext('lab')`; `btn-ctx-notes` — if in Lab, awaits `switchContext('work')` first, then calls `setView('notes')`. Init IIFE reads `localStorage.getItem('tudus-ctx')` to restore the last active context, sets `S.context` and `document.documentElement.dataset.ctx`, calls `load(ctx)`, ensures `store.notes = store.notes || []`, filters malformed week entries, then renders. Toast on startup in server mode includes the active context and data file name.
18. **Notes view** (`renderNotes`, `openNoteView`, `closeNoteView`, `openNoteModal`, `closeNoteModal`, `saveNoteModal`) — standalone memo-style notes; Work-only (Notes tab always operates on the Work store regardless of how the user arrived). Notes live in `store.notes[]` — a top-level array parallel to `store.weeks[]`.
   - **Layout:** 3-column JS masonry (shortest-column assignment). Each card gets a seeded rotation (−3° to +3°) and one of 4 organic `border-radius` patterns derived deterministically from `note.id` via `_noteRng(id, salt)` — layout is stable across re-renders. Hover lifts the card: rotation resets to 0°, slight scale, deeper shadow, accent border.
   - **Card content:** title (bold, 2-line clamp) + content preview (4-line clamp) + creation date. Click anywhere on the card body opens the **full-view modal** (`#note-view-overlay`), which shows full title, date, and full formatted content (date prefixes highlighted via `formatNotes()`). The full-view modal has a **Edit** button that closes it and opens the edit modal.
   - **Add/edit modal** (`#note-edit-overlay`): title `<input>` (required) + content `<textarea>` (same smart Enter behaviour as task notes: plain Enter prepends `notesDatePrefix()`, Shift+Enter plain newline, Ctrl/Cmd+Enter tab-indented continuation). Saving requires both title and non-empty content.
   - **Backward compat:** existing notes without a `title` field render as "Untitled" and save correctly with a title on first edit — no data loss.
   - **Phase 2 (not yet built):** task linking via `linkedTaskIds[]` on notes + `carriedFromId` on tasks for carry-forward lineage. Spec in `docs/enhancement-notes-view.md`.

## Data schema

Each context has its own store in the same shape — Work in `localStorage` key `tudus-work-v1` / `data/tudus-work.json`, Lab in `tudus-lab-v1` / `data/tudus-lab.json`.

```json
{
  "version": 1,
  "nextId": 300,
  "settings": { "theme": "system", "dismissedCarry": {} },
  "weeks": [
    {
      "ref": "2026-W34",
      "wref": "W34",
      "startDate": "2026-08-17",
      "endDate": "2026-08-21",
      "carriedFrom": null,
      "tasks": [
        {
          "id": 1, "rank": 1, "title": "...", "status": "todo",
          "nextMeeting": "2026-08-21T14:00", "carried": false, "expanded": false,
          "subtasks": [{ "text": "Label", "link": "https://..." }],
          "notes": "Aug 26: first update\nAug 27: follow-up"
        }
      ]
    }
  ],
  "notes": [
    {
      "id": 201,
      "title": "Auth refactor decisions",
      "content": "Sep 4: Agreed on JWT approach.\nSep 5: Documented in Confluence.",
      "createdAt": "2026-09-04"
    }
  ]
}
```

Valid `status` values: `"todo"`, `"in-prog"`, `"done"`. `task.notes` is a plain string or `null`. `store.notes[]` is a top-level array present in the Work store; Lab stores also carry it as `[]` for forward compat. Old stores without a `notes` key are backfilled with `[]` on load (`store.notes = store.notes || []`). Note `id` values use the same global `nextId` counter as task IDs, so they are unique across the entire store.

## Design system

CSS token names follow the pattern `--surface`, `--surface-2`, `--text-1`, `--text-2`, `--s-todo-bg`, `--dr-over-bg`, etc. All component colours reference tokens — never raw hex inside component rules. Dark mode uses the three-state pattern: bare `:root` = light defaults; `@media (prefers-color-scheme:dark)` guarded as `:root:not([data-theme="light"])` = dark; `:root[data-theme="dark"]` = dark (explicit override wins both ways).

**Lab accent** — when `document.documentElement.dataset.ctx === 'lab'`, three CSS rules override `--accent`, `--accent-lt`, and `--accent-dim` with emerald green (`#059669` light / `#34D399` dark). The same three-state pattern is repeated for the Lab overrides so they work correctly in all theme combinations. The notes preview strip is also wider in Lab (`210px` vs `172px`) and shows 6 lines instead of 3, via `[data-ctx="lab"] .card-notes-panel` and `[data-ctx="lab"] .cnp-preview` rules.
