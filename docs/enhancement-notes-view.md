# Enhancement: Memos View

## Naming

The standalone view is called **Memos** in all user-facing UI (tab button, view heading, picker labels).
Internally the data key remains `store.notes[]` — no migration required.
The per-task freeform log (kebab menu → "Add / Edit Notes") is unchanged — it is a different concept and keeps its name.

---

## Status

| Phase | Scope | Status |
|---|---|---|
| 1 | Standalone memos — add / edit / delete, collage/masonry layout, full-view overlay, title field | **Done** |
| 2 | Task linking, task back-reference (`card-memo-ref`), jump navigation | **In progress** |
| 3 | Migrate `task.notes` → Memos; retire inline notes panel; promote `card-memo-ref` to content preview | **Planned** |

---

## Phase 1 — what was built

- **Memos tab** in ctx-seg alongside Work / Lab (renamed from "Notes" per Phase 2 decision — apply label change with Phase 2)
- Each memo: `{ id, title, content, createdAt }` in `store.notes[]`
- Collage/masonry layout: 3 columns, shortest-column balancing, seeded ±3° rotation and organic `border-radius` via `_noteRng(id, salt)` (Knuth multiplicative hash) — stable across re-renders
- Hover: rotation resets to 0°, card scales up, shadow deepens, accent border
- Click card body → full-view read-only overlay (`#note-view-overlay`) with formatted content, date, Edit button
- Add/edit modal (`#note-edit-overlay`): title input (required) + content textarea; same smart Enter behaviour as task notes
- Delete via kebab menu — custom branded `showConfirm()` dialog (no native browser confirm)
- `store.notes = store.notes || []` on load for backward compat; old notes without `title` render as "Untitled"
- Memos are Work-only — clicking the tab from Lab silently switches context first

---

## Phase 2 — requirements and design

### 2.1 Rename Notes tab → Memos

UI label change only. Affects:
- `btn-ctx-notes` button label: `Notes` → `Memos`
- Notes view heading
- Toast messages referencing "Notes view"

`store.notes[]`, `S.view === 'notes'`, `renderNotes()`, `openNoteModal()` etc. stay as-is in code.

### 2.2 Data model changes

**Memo schema** — add `linkedTaskIds`:
```json
{
  "id": 201,
  "title": "Auth refactor decisions",
  "content": "Sep 4: Agreed on JWT approach.\nSep 5: Documented in Confluence.",
  "createdAt": "2026-09-04",
  "linkedTaskIds": [42, 87]
}
```

`linkedTaskIds` defaults to `[]` on new memos; absent on old memos → treated as `[]` (backward compat).

**Task schema** — add `carriedFromId` for carry-forward link resolution:
```json
{
  "id": 45, "rank": 1, "title": "Auth refactor",
  "carriedFromId": 42,
  "carried": true, ...
}
```

`carriedFromId` is `null` on tasks that were not carried. Set during `maybeCarryForward` when a new task is created from an existing one.

**Link resolution** — when rendering a linked task from a memo:
1. Find task with `id === linkedId` across all weeks
2. Walk the carry chain *forward*: find any task whose `carriedFromId === currentId`; if found, that becomes `currentId`; repeat until no task points back — that final task is the live instance. Note: `carriedFromId` points *backward* (newer task → older source), so resolution searches *forward* by following what points *to* the current ID.
3. Existing tasks without `carriedFromId` treat it as `null` — no chaining, they are their own live instance.
4. If no task found at all at step 1 → orphaned link (task was deleted, never carried) → render strikethrough

**Link cleanup on task deletion** — when `doAction('delete', id)` runs, scan `store.notes` and remove `id` from `linkedTaskIds` of any memo that references it. Keeps data clean rather than accumulating permanent orphaned entries.

### 2.3 Masonry card — linked task indicator

When a memo has `linkedTaskIds.length > 0`, show a subtle indicator below the date on the masonry card:

```
↗ 2 tasks
```

Small, muted (`var(--text-3)`), no task names — card face stays clean. Full linked task list lives in the full-view overlay only.

### 2.4 Memo full-view overlay — task linking UI

Add a **Link Task** button to `#note-view-overlay` (alongside Close and Edit).

Clicking it opens a **task picker** (`#task-picker-overlay`) — a small modal with:
- A search/filter input
- Scrollable list of **all** Work tasks across all weeks regardless of status, grouped by week ref (e.g. `W34 — Aug 18–22`)
- Each row: task title + current status pill; checkbox for selection
- Pre-checks tasks whose resolved live instance is already in `linkedTaskIds`
- Unchecking an already-linked task removes it from `linkedTaskIds` (unlink)
- Confirm button saves the full updated `linkedTaskIds` array back to the memo

**IDs stored in `linkedTaskIds`** are the live instance IDs at the time of linking — whatever ID the task has when it appears in the picker. Since link resolution walks the carry chain forward at render time, storing the current live ID is always correct.

After confirming, the full-view overlay refreshes to show the updated linked task chips, and `renderNotes()` runs if `S.view === 'notes'` (updates the `↗ N tasks` indicator on the masonry card).

**`#note-view-overlay` footer button order** (left → right): Close | Link Task | Edit. The Link Task button uses ID `note-view-link-task` and `.btn-ghost` class (matching `btn-viewonly`/`btn-theme` in the header — no new CSS class needed).

**Linked task chips** render in a `#note-view-linked-tasks` div, added as a new section in `#note-view-overlay` between `#note-view-body` and `.modal-foot`. In the full-view overlay:
- Each chip: task title + status pill + `→` jump icon
- Clicking the chip: switches to Work context if needed → locates the live instance's week → sets `S.weekRef` → `setView('week')` → applies `.card-highlight` pulse on the card → closes the memo overlay

Orphaned chips (task deleted — cleaned up at delete time per §2.2, so this is only a safety fallback for data imported from before Phase 2): render as `~~task title~~ (removed)`, no jump icon, no click.

### 2.5 Task card — back-reference to linked memo

At the start of `renderWeek()` (and `renderLabMonth()` for shared `buildCardHtml` usage), build a reverse index as a **module-level variable** — consistent with the app's globals architecture; do not change `buildCardHtml`'s signature:

```js
let _memoIndex = {}; // { taskId: [note, ...] } — rebuilt each render, declared in 18-notes-view.js
```

`_memoIndex` is declared at module level in `src/js/18-notes-view.js` (alongside `_editNoteId`, `_viewNoteId`, `_noteOpenedFromTask`) and reset at the start of *both* `renderWeek()` and `renderLabMonth()`. Both functions already call `buildCardHtml`, which reads `_memoIndex` as a global.

Scan `store.notes` once, resolve each `linkedTaskId` to its live instance, and add the *original* note to the index under that live instance's ID. In Lab context `store.notes` is always `[]` so the index is always empty — no memo links appear in Lab cards (correct by design).

When `buildCardHtml(t)` runs and `_memoIndex[t.id]` has entries, render a **`card-memo-ref`** section — a separate div, rendered *independently* of `card-notes-panel`, not nested inside it:

```html
<div class="card-memo-ref">
  <span class="cmr-label">↗</span>
  <button class="cmr-link" data-a="openmemo" data-mid="[memoId]">[Memo title]</button>
  <!-- if multiple: -->
  <button class="cmr-more">+N more</button>
</div>
```

- **Placement:** after `card-notes-panel` in the card HTML (or in its place when `task.notes` is null)
- **Single memo:** shows `↗ [Memo title]` — clicking opens `openNoteView(memoId)` as overlay
- **Multiple memos:** shows `↗ [First title]  +N more`; clicking `+N more` opens a small positioned dropdown (same pattern as `card-dropdown` — a `position:fixed` div appended to `document.body`, positioned below the button) listing remaining memo titles, each calling `openNoteView(memoId)`
- **Tooltip:** the same first memo title link appears in the hover tooltip (`#notes-tooltip`) when `task.notes` exists; when `task.notes` is null (Phase 3), the tooltip shows the memo content preview instead

**Why a separate section (Phase 3 compatibility):** in Phase 3, `task.notes` is migrated away and `card-notes-panel` is retired. `card-memo-ref` must already stand alone so it survives without rework. In Phase 2, both sections coexist on a card that has inline notes and a linked memo.

Clicking `→ Memo: [title]` from the task notes strip:
1. Calls `openNoteView(memoId)` — the `#note-view-overlay` appears as a `position:fixed` overlay on top of the current week view
2. Context and view state are **not changed** — user stays in Work week view

### 2.6 Edit flow from the task strip path

The overlay's Edit button follows the same path as editing from the Memos tab:
1. `closeNoteView()` + `openNoteModal(id)` — edit modal appears
2. User edits title and/or content, clicks Save
3. `saveNoteModal()` saves to `store.notes`, then:
   - **Re-opens** `openNoteView(id)` so the user sees the updated memo (does not drop straight back to week view)
   - `renderNotes()` is called only if `S.view === 'notes'` (skipped when in week view — no point re-rendering a hidden masonry)
4. User clicks Close on the note-view-overlay → back to week view

**Implementation detail — `_noteOpenedFromTask` flag:**
- Declared at module level in `src/js/18-notes-view.js` alongside `_editNoteId` and `_viewNoteId`: `let _noteOpenedFromTask = false;`
- Set `true` by the `cmr-link` click handler in `src/js/17-events.js`, **before** calling `openNoteView(memoId)` — NOT inside `openNoteView()` itself, since `openNoteView()` is called from both the task strip path and the Memos tab path
- Reset `false` in `closeNoteView()` — if the user closes the overlay without editing, the flag must not persist into the next `openNoteView()` call from the Memos tab
- `saveNoteModal()` checks this flag to decide whether to re-open the view overlay after save
- `saveNoteModal()` must capture `_editNoteId` *before* calling `closeNoteModal()` (which clears it): `const savedId = _editNoteId; closeNoteModal(); if (_noteOpenedFromTask) openNoteView(savedId);`

### 2.7 Carry-forward changes

`maybeCarryForward(fromRef, toRef)` (Work carry-forward only) — when creating a new task from an existing one, add:
```js
newTask.carriedFromId = originalTask.id;
```

`maybeCarryForwardFromMonth` (Lab carry-forward) — **no change**. Memos are Work-only; Lab tasks are never linked, so `carriedFromId` is not needed there.

No other carry-forward changes. Link resolution at render time walks the chain forward automatically.

---

## Architecture impact summary

| File | Change |
|---|---|
| `src/js/01-date-engine.js` | None |
| `src/js/05-week-management.js` | None |
| `src/js/06-carry-forward.js` | Set `carriedFromId` on carried task in `maybeCarryForward` |
| `src/js/09-week-view.js` | Reset `_memoIndex = {}` at start of `renderWeek()`; add `card-memo-ref` section in `buildCardHtml` (no signature change) |
| `src/js/10-actions.js` | On task delete: scan `store.notes` and remove the deleted `id` from `linkedTaskIds` of any memo |
| `src/js/11-month-view.js` | Reset `_memoIndex = {}` at start of `renderLabMonth()` — always empty in Lab context (correct by design); `buildCardHtml` reads it safely with no signature change |
| `src/js/13-notes-tooltip.js` | Add memo title link to tooltip when `_memoIndex[t.id]` has entries |
| `src/js/14-notes-modal.js` | None |
| `src/js/15-header.js` | Update `btn-ctx-notes` label to "Memos"; update notes-view heading in `renderNotes()` |
| `src/js/17-events.js` | Wire `#note-view-link-task` button; wire task picker confirm; set `_noteOpenedFromTask = true` in `cmr-link` click handler **before** calling `openNoteView()` |
| `src/js/18-notes-view.js` | Add `_noteOpenedFromTask` flag declaration (alongside `_editNoteId`/`_viewNoteId`); reset in `closeNoteView()`; re-open view overlay after save; make `renderNotes()` call conditional on `S.view === 'notes'`; link resolution helper; masonry card `↗ N tasks` indicator; linked task chips section in full-view overlay; `migrateTaskNotesToMemos()` stub |
| `src/shell.html` | Add `#note-view-link-task` button in `#note-view-overlay` footer (order: Close \| Link Task \| Edit); add `#note-view-linked-tasks` section between body and footer; add `#task-picker-overlay` modal markup; rename `btn-ctx-notes` label to "Memos" |
| `src/css/3-cards.css` | `.card-memo-ref`, `.cmr-label`, `.cmr-link`, `.cmr-more` styles (task card elements) |
| `src/css/7-notes.css` | Linked task chip styles; `↗ N tasks` masonry indicator; task picker modal styles |

---

## Phase 3 — migrate task notes → Memos

### Goal

Remove `task.notes` as a concept entirely. All task-level notes become proper Memos, linked to their source task. No data loss — content moves verbatim (date prefixes, formatting, everything intact since Memo content uses the same format).

### Migration

A one-time function `migrateTaskNotesToMemos()` — not automatic, triggered by a dismissible banner (same pattern as the existing localStorage → server migration banner):

```
"You have N tasks with inline notes — move them to Memos?
 [Move to Memos]  [Keep as-is]"
```

Migration logic:
1. Scan all weeks across all tasks where `task.notes !== null`
2. For each such task, create a Memo: `{ id: store.nextId++, title: task.title, content: task.notes, createdAt: (earliest date prefix found in notes, or today), linkedTaskIds: [task.id] }`
3. Set `task.notes = null` on the source task
4. Save once after all tasks processed

Stub `migrateTaskNotesToMemos()` is added to `src/js/18-notes-view.js` in Phase 2 (not wired to any UI) so Phase 3 has a clear hook.

### Card change: `card-memo-ref` promoted to content preview

Phase 2 builds `card-memo-ref` as a title link. Phase 3 promotes it to show a 1-line content preview — the last dated entry in the linked memo (most recent update):

```
↗ Sep 4: Agreed on JWT approach.          [Memo title →]
```

- Clicking the preview line opens `openNoteView(memoId)` as an overlay — same behaviour as Phase 2, no new infrastructure needed
- `card-notes-panel` is retired: when `task.notes` is null, it never renders; after full migration it becomes dead code and is removed
- Hover tooltip: shows the memo content preview (same as existing notes tooltip format) rather than the inline `task.notes`

### What Phase 2 already provides (no rework needed)

| Phase 3 need | Phase 2 provision |
|---|---|
| Memos linked to tasks | `linkedTaskIds` on memo schema |
| Reverse lookup task → memos | `_memoIndex` module-level variable |
| Open memo as overlay from task card | `openNoteView(id)` + `_noteOpenedFromTask` flag |
| Carry-forward link resolution | `carriedFromId` + chain-walk helper |
| Standalone `card-memo-ref` section | Built in Phase 2 outside `card-notes-panel` |

The only Phase 3 work is: migration function + banner UI + promoting `card-memo-ref` from title link to content preview + retiring `card-notes-panel`.

---

## Resolved decisions

| Question | Decision |
|---|---|
| Memos Work-only or shared? | Work-only |
| Task back-reference on card? | Yes — `→ Memo: [title]` in task notes strip and tooltip |
| Sort order for memos list? | Newest first (implemented in Phase 1) |
| Link direction? | Memo → tasks (stored on memo as `linkedTaskIds[]`) |
| Task picker entry point? | "Link Task" button on memo full-view overlay |
| Masonry card detail level? | Subtle `↗ N tasks` indicator only; full list in overlay |
| Opening memo from task strip? | `position:fixed` overlay on top of week view — no context switch |
| After editing from task strip? | Re-show note-view-overlay with updated content; user clicks Close to return to week view |
| Carry-forward link staleness? | Strategy C — `carriedFromId` on task; resolve to live instance at render time |
| Future of task inline notes? | Phase 3 migration → Memos; `card-memo-ref` (Phase 2) is designed to survive this without rework |
