# tudus

A focused, week-centric task tracker for software architects and technical leads. No server, no install, no account — open the file and go. The feature set has grown well past "minimalist", but the zero-dependency, file-owned-data philosophy has not.

## Overview

tudus organises work by ISO week. Each week is a page of prioritised task cards. At the start of a new week you choose which open tasks to bring forward — nothing moves without your say-so, so the list stays intentional rather than auto-cluttered.

Built as a single self-contained HTML file with no external dependencies. Data lives in a JSON file on disk (server mode) or the browser's `localStorage` (standalone mode).

## Getting started

### Standalone mode (zero setup)

Open `index.html` directly in any modern browser:

```
file:///path/to/tudus/index.html
```

Data is stored in the browser's `localStorage`. It works immediately — seed data from a real August 2026 workload is pre-loaded on first open — but data is tied to that browser on that machine.

### Server mode (recommended)

Run the companion server so data is saved to a plain JSON file you own and can move anywhere:

```
node server.js
```

Then open **http://localhost:3003** in your browser. The app detects server mode and saves Work data to `data/tudus-work.json` and Lab data to `data/tudus-lab.json`. A brief toast confirms the connection and active context on startup.

**To stop the server:** press `Ctrl+C` in the terminal. To restart, run `node server.js` again.

**To move to another machine:** copy the entire folder (`index.html`, `server.js`, and the `data/` directory). Run `node server.js` there and all your data is present.

> Node.js is the only prerequisite to run the app — no npm install required.

## Features

**Work / Lab contexts**
- Toggle between **Work** and **Lab** using the segment control in the header — the accent colour shifts to emerald green in Lab so context is always obvious at a glance
- Work is week-centric with week-level carry-forward; Lab is month-centric — always shows the month view, the week view toggle is hidden, and `←`/`→` navigate months instead of weeks
- Lab tasks expand by default and adding a task immediately opens the notes editor so you can capture your thinking right away; new tasks always land in today's week regardless of the displayed month
- Each context has its own data store; switching is instant and data is never mixed
- In server mode, Work saves to `tudus-work.json` and Lab saves to `tudus-lab.json`; in standalone mode two separate localStorage keys are used

**Week view**
- One page per ISO work week (Mon – Fri), navigate with `←` `→` or the arrow buttons
- Navigate forward as far as you like — weeks are created on demand; empty navigated-to weeks are automatically removed when you move away
- Jump back instantly with the **Current Week** button (shows `✓` when already on the current week)
- **Go to any week directly:** type `W33` or `2026-W33` in the jump input next to the Current Week button and press Enter
- Drag cards up or down by their grip handle to reprioritise; rank persists across reloads

**Task cards**
- Status pill cycles through **Todo → In Progress → Done** on click
- Expandable subtask list with clickable links (Jira, Confluence, Google Docs, GitHub, etc.)
- **Next action** date-time field with urgency badges: *overdue*, *today*, *tomorrow*, *n days*
- Kebab menu (`···`) per card for **Edit**, **Add / Edit Notes**, and **Delete**
- If a task has linked memos, a memo strip appears at the bottom of the card — click the memo title to open it in full-view, or `+N more` to pick from a dropdown when multiple memos are linked

**Subtasks and links**
- One subtask per line in the edit modal; any line containing a URL becomes a clickable link automatically
- **Indent subtasks** to show hierarchy: press `Tab` to indent a line one level, `Shift+Tab` to dedent
- Select multiple lines and `Tab` / `Shift+Tab` to indent or dedent them all at once
- Indentation is preserved when you re-open a task for editing

**Task notes**
- Add freeform, date-stamped notes to any task via the kebab menu (`···` → Add notes)
- Each note entry is automatically prefixed with today's date (e.g. `Aug 24:`) so you have a running log of when updates were added
- Three ways to add lines inside the notes editor:

  | Key | What it does |
  |-----|--------------|
  | `Enter` | New dated entry — `Aug 24: ` prepended |
  | `Ctrl+Enter` | Continuation sub-note — tab-indented, no date repeated |
  | `Shift+Enter` | Plain new line — no date, no indent (soft wrap) |

- A compact notes strip on the right side of the card shows a preview (wider and taller in Lab context); hover for a full-text tooltip up to 500px wide with clickable URLs and highlighted date prefixes, click to open the editor
- Notes editor shows a live character count; a **Clear** button removes notes entirely
- Notes are locked in view-only mode

**Memos view**
- A standalone **Notes** tab in the context bar (amber accent, distinct from Work blue and Lab green) — top-level, not a sub-view
- Each memo is a card with a **title** and freeform dated content (same date-prefix format as task notes: `Sep 4: …`)
- Cards are laid out in a **masonry** grid — 3 columns, each card has organic rounded corners that are stable across reloads and unique per memo
- **Hover** to lift a card (shadow deepens, accent border); **click** to open a full-view read-only modal showing the complete formatted content with highlighted date prefixes and clickable URLs
- From the full-view modal, click **✏** to edit inline, or use the kebab menu on each card for Edit and Delete
- The memo editor uses the same smart Enter behaviour as task notes: plain `Enter` = new dated line, `Shift+Enter` = plain newline, `Ctrl/Cmd+Enter` = indented continuation

**Memo–task linking**
- In the full-view modal, click **Link task** to open a task picker — select any combination of **Work** tasks (blue checkboxes) and **Lab** tasks (green section, loaded on demand)
- Linked memos show coloured indicators at the bottom of their masonry card: `↗ N work tasks` in blue, `⚗ N lab tasks` in green
- In the full-view modal, linked tasks appear as chips showing title and status — click a chip to jump directly to that task (switching context automatically if needed)
- On task cards in week view and Lab month view, a memo strip appears when tasks have linked memos — click to open the memo directly
- Memos always live in the Work store; Lab task links are stored as IDs inside the Work memo — switching to Lab context never loses memo data
- Memos are Work-only — clicking the Notes tab from Lab silently switches to the Work context first

**Carry-forward**
- **Work (week-level):** when you open a week whose previous week has open tasks not yet brought in, a banner prompts: **"N open tasks from W34 — not yet brought in"**. Click **Bring in** to copy those tasks into the current week with a `↺ carried` tag. After bringing in, a dismissible confirmation banner shows how many tasks were carried and from which week.
- **Lab (month-level):** when the previous calendar month has open tasks not yet in the current month, a banner prompts at the top of the month view. Click **Bring in** to copy those tasks into today's week. Lab carry-forward deduplicates against all tasks in the current displayed month.
- **Skip** dismisses the banner until the next reload — it reappears as a reminder. Carry-forward is idempotent in both contexts — bringing in multiple times never duplicates tasks (title-based dedup).

**Month view**
- Accordion listing every week that overlaps the selected calendar month
- Progress bar and done/total count per week
- Navigate months with `←` `→` in the header; jump back with the **Current Month** button
- Click any task row to switch to week view and highlight that card briefly
- Switching to week view snaps to the first week of the displayed month if the current week is elsewhere

**View-only mode**
- Toggle **View Only** in the header to lock all editing — status, drag, notes, edit, and delete are all disabled; the kebab menu shows "View-only mode" in place of actions
- Useful for presenting or reviewing without accidental edits

**Theme**
- Cycles between System / Light / Dark via the `◑` button; preference is saved

**Backup**
- **⬇ Export** downloads a timestamped file named `tudus-work-YYYY-MM-DD.json` or `tudus-lab-YYYY-MM-DD.json` depending on the active context
- **⬆ Import** restores from any previously exported file into the active context — a confirmation dialog shows how many tasks will be overwritten before proceeding
- In server mode, `data/tudus-work.json` and `data/tudus-lab.json` are themselves portable backups

## Keyboard shortcuts

| Shortcut | Where | Action |
|----------|-------|--------|
| `⌘K` / `Ctrl+K` | Anywhere | Open Add Task modal |
| `Esc` | Anywhere | Close modal / dropdown / clear week-jump input |
| `←` / `→` | Outside inputs | Navigate weeks (Work) or months (Lab) |
| `Enter` | Week-jump input | Jump to typed week (`W33` or `2026-W33`) |
| `Tab` | Subtask textarea | Indent selected line(s) |
| `Shift+Tab` | Subtask textarea | Dedent selected line(s) |
| `Enter` | Notes textarea | New line with today's date prefix |
| `Ctrl+Enter` | Notes textarea | New indented continuation line (no date) |
| `Shift+Enter` | Notes textarea | Plain new line (no date, no indent) |

## Storage modes at a glance

| | Standalone (`file://`) | Server (`localhost:3003`) |
|---|---|---|
| Data location | Browser localStorage (two keys) | `data/tudus-work.json` + `data/tudus-lab.json` |
| Portable | Export/Import only | Copy the folder |
| Multi-browser | No (each browser is separate) | Yes (all browsers hit the same files) |
| Requires | Nothing | Node.js |

## Compatibility

Works in any modern browser (Chrome, Edge, Firefox, Safari) on Windows, macOS, and Linux. No build step, no npm, no internet connection required.

## Modifying the source

`index.html` is assembled from modular source files — edit those rather than the built output directly:

```
src/shell.html      ← HTML skeleton
src/css/1-tokens.css … 7-notes.css
src/js/01-date-engine.js … 18-notes-view.js
```

After editing any source file, regenerate `index.html`:

```
node build.js
```

No npm, no watch mode. `index.html.backup` is the pre-split baseline for regression comparison.
