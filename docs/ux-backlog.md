# UX Backlog: tudus

Open items from user experience review. Remove an item when it ships.

---

## What to protect as the tool grows

The core loop — open the week, see tasks ranked by your own order with urgency badges, drag to reprioritise, Ctrl+K to add — should stay exactly as clean as it is. Every item below can be added behind affordances (search icon, carry modal, aging tag) without touching the main weekly page layout.

---

## Open items

### 1. Carry-forward is all-or-nothing

A real week ends with a mix: tasks genuinely incomplete (carry), half-done (decide), silently de-prioritised (leave behind). "Bring in all / Skip all" forces you to either carry tasks you don't want or manually delete them after.

**Direction:** a checkboxed carry modal — "Select which tasks to bring forward."

### 2. "Skip" feels permanent but isn't

Clicking Skip dismisses the banner for the session. On next reload it reappears. The mismatch between what the interaction feels like ("I've decided") and what it does (DOM-only, reappears) erodes trust. Related to `dismissedCarry` in tech-backlog — both need the same decision: persist Skip or change the UX to not imply permanence.

### 3. No search

After a few months of use, "where did I put that task about the alert ID system?" has no answer except navigate week-by-week or grep the JSON. A title-only search across all weeks covers 90% of cases and is the feature most likely to cause abandonment without it.

### 4. No task aging / origin visibility

`↺ carried` tag shows a task was carried. It doesn't show it's been carried for six weeks, open since W28. The originating week ref is stored on the task — it's just not surfaced. Useful for self-prioritisation and stakeholder conversations.

### 5. Status cycling only goes forward

Todo → In Progress → Done → Todo. Accidentally clicking Done means two more clicks to get back. A right-click to reverse, or a long-press, would help — especially since there is no undo.

### 6. Subtasks are display-only

You can't check off individual subtasks. For a multi-step task (e.g. three pipeline components to validate), you want to tick off sub-items without marking the whole task done. A `[x]`-style toggle rendered as strikethrough on done items would cover this — it's where real progress tracking often lives.

---

## Structural gaps (larger efforts)

**Recurring tasks** — some work never closes (monitoring, standards reviews, team updates). These currently have to be manually carried every week, where they blend in with genuinely stalled work using the same `↺ carried` tag. A "recurring" flag that auto-includes a task in every new week, shown differently, would match how this category of work actually behaves.

**Cross-week open-task rollup** — "what are all my open tasks right now, across any week?" has no direct answer. A flat "all open tasks" list view, sortable and filterable, would be the second most-used view after the current week for anyone managing ongoing work.
