// ════════════════════════════════════════════════════════
// 17. VIEW & NAVIGATION
// ════════════════════════════════════════════════════════
function setView(v) {
  if (!store) return;
  if (S.context === 'lab') v = 'month'; // Lab is always month view
  S.view = v;
  if (v === 'notes') document.documentElement.dataset.view = 'notes';
  else delete document.documentElement.dataset.view;
  document.getElementById('week-view').classList.toggle('hidden',  v !== 'week');
  document.getElementById('month-view').classList.toggle('hidden', v !== 'month');
  document.getElementById('notes-view').classList.toggle('hidden', v !== 'notes');
  syncHeader();
  if (v === 'week') renderWeek(); else if (v === 'month') renderMonth(); else renderNotes();
}

function navigateWeek(delta) {
  if (!store) return;
  const sorted = allWeeks();
  const wi     = sorted.findIndex(w => w.ref === S.weekRef);
  if (wi < 0) return;

  let newRef;
  if (delta > 0) {
    // Forward: create the target week on demand so navigation is always possible
    const nextData = offsetWeekData(S.weekRef, delta);
    ensureWeek(nextData);
    newRef = nextData.ref;
  } else {
    // Backward: only navigate to existing weeks
    const newIdx = wi + delta;
    if (newIdx < 0) return;
    newRef = sorted[newIdx].ref;
  }

  // Clean up the week we're leaving if it's empty and has no carry origin (navigation artifact)
  const leaving = getWeek(S.weekRef);
  if (leaving && !leaving.tasks.length && !leaving.carriedFrom && S.weekRef !== S.currRef) {
    store.weeks = store.weeks.filter(w => w.ref !== S.weekRef);
    save();
  }

  S.weekRef = newRef;
  const w = getWeek(newRef);
  if (w) { const d = new Date(w.startDate + 'T00:00:00'); S.monthContext = { year:d.getFullYear(), month:d.getMonth()+1 }; }
  setView('week');
}

function goToCurrentWeek() {
  if (S.weekRef === S.currRef) return;
  S.weekRef = S.currRef;
  const w = getWeek(S.currRef);
  if (w) { const d = new Date(w.startDate+'T00:00:00'); S.monthContext={year:d.getFullYear(),month:d.getMonth()+1}; }
  setView('week');
  toast('Jumped to current week');
}

function goToCurrentMonth() {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth() + 1;
  if (S.monthContext.year === y && S.monthContext.month === m) return;
  S.monthContext = { year: y, month: m };
  renderMonth(); syncHeader();
}

function navigateMonth(delta) {
  let { year, month } = S.monthContext;
  month += delta;
  if (month > 12) { month = 1; year++; }
  if (month < 1)  { month = 12; year--; }
  S.monthContext = { year, month };
  renderMonth(); syncHeader();
}

// ════════════════════════════════════════════════════════
// 18. EVENTS
// ════════════════════════════════════════════════════════
document.getElementById('btn-prev').addEventListener('click',     () => navigateWeek(-1));
document.getElementById('btn-next').addEventListener('click',     () => navigateWeek(+1));
document.getElementById('btn-thisweek').addEventListener('click', () => goToCurrentWeek());
document.getElementById('btn-v-week').addEventListener('click',   () => {
  if (S.view === 'month') {
    const mw = weeksInMonth(S.monthContext.year, S.monthContext.month);
    if (mw.length && !mw.some(w => w.ref === S.weekRef)) S.weekRef = mw[0].ref;
  }
  setView('week');
});
document.getElementById('btn-v-month').addEventListener('click',  () => setView('month'));
document.getElementById('btn-mo-prev').addEventListener('click',  () => navigateMonth(-1));
document.getElementById('btn-mo-next').addEventListener('click',  () => navigateMonth(+1));
document.getElementById('btn-curr-month').addEventListener('click', () => goToCurrentMonth());
document.getElementById('btn-viewonly').addEventListener('click', () => {
  S.viewOnly = !S.viewOnly; syncHeader();
  renderCurrent();
  toast(S.viewOnly ? 'View-only — editing disabled' : 'Edit mode enabled');
});
document.getElementById('btn-add').addEventListener('click', () => {
  if (S.context === 'lab') {
    // Always add to today's week in Lab
    ensureWeek(_cwd);
    S.weekRef = _cwd.ref;
  }
  openModal();
});
document.getElementById('note-view-close').addEventListener('click', closeNoteView);
document.getElementById('note-view-edit-icon').addEventListener('click', enterNoteEditMode);
document.getElementById('note-view-edit-cancel').addEventListener('click', () => exitNoteEditMode(false));
document.getElementById('note-view-edit-save').addEventListener('click',   () => exitNoteEditMode(true));
document.getElementById('note-view-textarea').addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  const el = e.target, s = el.selectionStart, end = el.selectionEnd;
  const ins = (e.ctrlKey || e.metaKey) ? '\n\t' : e.shiftKey ? '\n' : '\n' + notesDatePrefix();
  el.value = el.value.slice(0, s) + ins + el.value.slice(end);
  el.selectionStart = el.selectionEnd = s + ins.length;
});
document.getElementById('note-view-link-task').addEventListener('click', openTaskPicker);
document.getElementById('note-view-overlay').addEventListener('click', e => { if (e.target === document.getElementById('note-view-overlay')) closeNoteView(); });
document.getElementById('task-picker-cancel').addEventListener('click', closeTaskPicker);
document.getElementById('task-picker-confirm').addEventListener('click', confirmTaskPicker);
document.getElementById('task-picker-overlay').addEventListener('click', e => { if (e.target === document.getElementById('task-picker-overlay')) closeTaskPicker(); });
document.getElementById('task-picker-search').addEventListener('input', e => { _renderTaskPickerList(e.target.value.trim()); });
document.getElementById('task-picker-list').addEventListener('change', e => {
  if (!e.target.classList.contains('tpicker-cb')) return;
  const tid = +e.target.dataset.tid;
  const set = e.target.dataset.ctx === 'lab' ? _pickerLabIds : _pickerWorkIds;
  if (e.target.checked) set.add(tid);
  else set.delete(tid);
});
document.getElementById('confirm-cancel').addEventListener('click', closeConfirm);
document.getElementById('confirm-ok').addEventListener('click', () => { const cb = _confirmCb; closeConfirm(); if (cb) cb(); });
document.getElementById('confirm-overlay').addEventListener('click', e => { if (e.target === document.getElementById('confirm-overlay')) closeConfirm(); });
document.getElementById('note-edit-cancel').addEventListener('click', closeNoteModal);
document.getElementById('note-edit-save').addEventListener('click',   saveNoteModal);
document.getElementById('note-edit-overlay').addEventListener('click', e => { if (e.target === document.getElementById('note-edit-overlay')) closeNoteModal(); });
document.getElementById('btn-add-note').addEventListener('click', () => openNoteModal());
document.getElementById('note-edit-textarea').addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  const el = e.target, s = el.selectionStart, end = el.selectionEnd;
  const ins = (e.ctrlKey || e.metaKey) ? '\n\t' : e.shiftKey ? '\n' : '\n' + notesDatePrefix();
  el.value = el.value.slice(0, s) + ins + el.value.slice(end);
  el.selectionStart = el.selectionEnd = s + ins.length;
});
document.getElementById('btn-mo-cancel').addEventListener('click', closeModal);
document.getElementById('btn-mo-save').addEventListener('click',   saveTask);
document.getElementById('overlay').addEventListener('click',    e => { if (e.target === document.getElementById('overlay')) closeModal(); });
document.getElementById('btn-notes-cancel').addEventListener('click', closeNotes);
document.getElementById('btn-notes-save').addEventListener('click',   saveNotes);
document.getElementById('btn-notes-clear').addEventListener('click',  clearNotes);
document.getElementById('notes-overlay').addEventListener('click', e => { if (e.target === document.getElementById('notes-overlay')) closeNotes(); });
document.getElementById('notes-textarea').addEventListener('input', updateNotesCount);
document.getElementById('notes-textarea').addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  const el = e.target, s = el.selectionStart, end = el.selectionEnd;
  // Ctrl/Cmd+Enter: continuation line — tab-indented, no date
  // Shift+Enter: plain new line — no date, no indent
  // Plain Enter: new dated entry
  const ins = (e.ctrlKey || e.metaKey) ? '\n\t' : e.shiftKey ? '\n' : '\n' + notesDatePrefix();
  el.value = el.value.slice(0, s) + ins + el.value.slice(end);
  el.selectionStart = el.selectionEnd = s + ins.length;
  updateNotesCount();
});
document.getElementById('btn-theme').addEventListener('click',  cycleTheme);

document.getElementById('week-jump-input').addEventListener('keydown', e => {
  if (e.key === 'Escape') { e.target.value = ''; e.target.blur(); return; }
  if (e.key !== 'Enter') return;
  e.preventDefault();
  const raw = e.target.value.trim().toUpperCase();
  e.target.value = '';
  if (!raw) return;

  let targetRef;
  if (/^\d{4}-W\d{1,2}$/.test(raw)) {
    targetRef = raw;
  } else if (/^W\d{1,2}$/.test(raw)) {
    const match = allWeeks().find(w => w.wref === raw);
    targetRef = match ? match.ref : `${new Date().getFullYear()}-${raw}`;
  } else {
    toast('Use W33 or 2026-W33 format'); return;
  }

  let weekData;
  try { weekData = offsetWeekData(targetRef, 0); } catch { toast('Invalid week'); return; }

  ensureWeek(weekData);
  S.weekRef = weekData.ref;
  const w = getWeek(weekData.ref);
  if (w) { const d = new Date(w.startDate + 'T00:00:00'); S.monthContext = { year:d.getFullYear(), month:d.getMonth()+1 }; }
  setView('week');
  toast(`Jumped to ${weekData.wref}`);
});
document.getElementById('btn-export').addEventListener('click', exportData);
document.getElementById('btn-import').addEventListener('click', () => document.getElementById('file-input').click());
document.getElementById('file-input').addEventListener('change', e => {
  const f = e.target.files[0]; if (f) importData(f);
  e.target.value = ''; // reset so same file can be re-imported
});

document.addEventListener('click', e => {
  if (!e.target.closest('.card-menu-wrap')) closeDropdowns();
  if (!e.target.closest('.note-menu-wrap')) closeNoteDropdowns();
});

document.getElementById('f-subs').addEventListener('keydown', e => {
  if (e.key !== 'Tab') return;
  e.preventDefault();
  const el = e.target, s = el.selectionStart, end = el.selectionEnd, val = el.value;

  if (!val.slice(s, end).includes('\n')) {
    // Single cursor or same-line selection: insert one tab
    el.value = val.slice(0, s) + '\t' + val.slice(end);
    el.selectionStart = el.selectionEnd = s + 1;
    return;
  }

  // Multi-line selection: indent or dedent every covered line
  const lineStart = val.lastIndexOf('\n', s - 1) + 1;
  const before = val.slice(0, lineStart);
  const block  = val.slice(lineStart, end);
  const after  = val.slice(end);
  // Preserve trailing newline separately so it isn't processed as an extra empty line
  const trail   = block.endsWith('\n') ? '\n' : '';
  const core    = trail ? block.slice(0, -1) : block;
  const newCore = e.shiftKey ? core.replace(/^\t/gm, '') : core.replace(/^/gm, '\t');
  const newBlock = newCore + trail;
  el.value = before + newBlock + after;
  el.selectionStart = lineStart;
  el.selectionEnd   = lineStart + newBlock.length;
});

document.addEventListener('keydown', e => {
  const inInput = ['INPUT','TEXTAREA'].includes(document.activeElement.tagName);
  if (e.key === 'Escape') { closeDropdowns(); closeNoteDropdowns(); closeModal(); closeNotes(); closeNoteModal(); closeNoteView(); closeConfirm(); closeTaskPicker(); }
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); if (!S.viewOnly) openModal(); }
  if (!inInput && e.key === 'ArrowLeft')  { if (S.context === 'lab') navigateMonth(-1); else navigateWeek(-1); }
  if (!inInput && e.key === 'ArrowRight') { if (S.context === 'lab') navigateMonth(+1); else navigateWeek(+1); }
});

document.getElementById('btn-ctx-work').addEventListener('click', () => {
  if (S.view === 'notes') { setView('week'); return; }
  switchContext('work');
});
document.getElementById('btn-ctx-lab').addEventListener('click', () => {
  if (S.context !== 'lab') _workStoreCache = store;
  switchContext('lab');
});
document.getElementById('btn-ctx-notes').addEventListener('click', async () => {
  if (S.context === 'lab') await switchContext('work');
  setView('notes');
});

// ════════════════════════════════════════════════════════
// 19. INIT
// ════════════════════════════════════════════════════════
(async () => {
  const savedCtx = localStorage.getItem('tudus-ctx') || 'work';
  S.context = savedCtx;
  if (savedCtx === 'lab') document.documentElement.dataset.ctx = 'lab';
  store = await load(savedCtx);
  store.notes = store.notes || []; // backward compat
  if (savedCtx === 'lab') {
    // Pre-load Work store so memo indicators and note links work from the first render
    _workStoreCache = await load('work');
    _workStoreCache.notes = _workStoreCache.notes || [];
  }
  // Remove any malformed week entries (e.g. created by passing a string to ensureWeek)
  const badWeeks = store.weeks.filter(w => !w.ref || !w.startDate || !w.endDate).length;
  if (badWeeks) { store.weeks = store.weeks.filter(w => w.ref && w.startDate && w.endDate); save(); }
  applyTheme(store.settings.theme);
  ensureWeek(_cwd);
  setView('week');
  if (SERVER_MODE && _needsMigration) showMigrationBanner();
  else if (SERVER_MODE) {
    const ctx = S.context;
    const file = ctx === 'lab' ? 'data/tudus-lab.json' : 'data/tudus-work.json';
    toast(`Connected · ${ctx === 'lab' ? 'Lab' : 'Work'} · saving to ${file}`);
  }
})();
