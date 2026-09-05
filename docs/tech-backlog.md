# Tech Backlog: tudus

Open items from code review. Remove an item when it ships.

---

## What's working well (keep this in mind when changing things)

- ISO week math via `Date.UTC` throughout — prevents the classic off-by-one timezone trap
- Three-state theme pattern is correct: bare `:root` = light; `@media` guarded as `:root:not([data-theme="light"])` = dark; `:root[data-theme="dark"]` = explicit dark
- Fire-and-forget server save with localStorage fallback — works offline with no coordination overhead
- `S` state object is flat and fully visible — no hidden derived state, no stale closure refs
- `server.js` at ~74 lines with 10 MB body cap and `version === 1` schema validation

---

## Open items

### 1. `dismissedCarry` in schema is vestigial

`store.settings.dismissedCarry` exists in the data schema but is unused. The current Skip behavior (DOM-only dismiss, reappears on reload) is intentional — but the field implies persistent dismiss was planned. Decision needed: wire it up (store `{ [prevRef]: true }` on Skip, check before showing banner) or remove the field.

### 2. `daysHtml` / `daysClass` / `daysText` triple-parse the same value

All three parse `nextMeeting` and compute the day delta independently. Not dead — `daysHtml` returns HTML for the week view; `daysClass` + `daysText` are used separately in month view. Negligible at this scale but cleaner as one helper:

```js
function parseMeetingDays(ds) { /* returns { cls, text, html } */ }
```

### 3. Import validation is shallow

`importData` checks task/week counts for the confirmation dialog then overwrites the store directly. A corrupted or hand-edited import can put the app in a broken state. 5–10 lines of structural validation — verify top-level keys, weeks array shape, tasks array shape — would close this.

### 4. Dark-mode CSS duplication is by design but undocumented

The token redefinitions appear identically in the `@media` block and in `:root[data-theme="dark"]`. Correct for the three-state pattern, but any token change requires editing two places. Add a comment to prevent future confusion:

```css
/* DARK TOKENS — edit both blocks below; they must stay identical */
```

---

## Minor observations

- `allWeeks()` returns a new sorted array on every call; called multiple times per render cycle — negligible at this scale
- `parseSubs` URL detection (`https?:\/\/\S+`) breaks on URLs with trailing punctuation — acceptable for a personal tool where clean URLs are pasted
- `SEED` constant embeds real Atlassian/Google URLs — if the repo goes public, those URLs are in git history
- `notes-textarea` has a visible character count but no enforced limit; the 10 MB server cap is the only backstop
