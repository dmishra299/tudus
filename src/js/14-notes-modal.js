// ════════════════════════════════════════════════════════
// 14. NOTES MODAL
// ════════════════════════════════════════════════════════
let _notesId = null;

function notesDatePrefix() {
  const d = new Date();
  return d.toLocaleString('en', { month: 'short' }) + ' ' + d.getDate() + ': ';
}

function openNotes(id) {
  const week = getWeek(S.weekRef); if (!week) return;
  const t    = week.tasks.find(t => t.id === id); if (!t) return;
  _notesId = id;
  document.getElementById('notes-modal-title').textContent = t.notes ? 'Edit Notes' : 'Add Notes';
  document.getElementById('notes-context').textContent     = t.title;
  const ta = document.getElementById('notes-textarea');
  if (t.notes) {
    ta.value = t.notes;
    ta.selectionStart = ta.selectionEnd = ta.value.length;
  } else {
    ta.value = notesDatePrefix();
    ta.selectionStart = ta.selectionEnd = ta.value.length;
  }
  updateNotesCount();
  document.getElementById('notes-overlay').classList.remove('hidden');
  setTimeout(() => { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }, 40);
}

function updateNotesCount() {
  const len = (document.getElementById('notes-textarea').value || '').length;
  document.getElementById('notes-char-count').textContent = len ? `${len} char${len!==1?'s':''}` : '';
}

function closeNotes() {
  document.getElementById('notes-overlay').classList.add('hidden');
  _notesId = null;
}

function saveNotes() {
  if (_notesId === null) return;
  const week = getWeek(S.weekRef); if (!week) return;
  const idx  = week.tasks.findIndex(t => t.id === _notesId); if (idx < 0) return;
  const text = document.getElementById('notes-textarea').value.trim();
  // Treat a bare auto-prefix with nothing typed after it the same as empty
  const cleaned = text === notesDatePrefix().trim() ? '' : text;
  week.tasks[idx].notes = cleaned || null;
  save(); closeNotes(); renderCurrent();
  toast(text ? 'Notes saved' : 'Notes cleared');
}

function clearNotes() {
  if (_notesId === null) return;
  document.getElementById('notes-textarea').value = '';
  updateNotesCount();
}
