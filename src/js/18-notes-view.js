// ════════════════════════════════════════════════════════
// 18. NOTES VIEW
// ════════════════════════════════════════════════════════
let _editNoteId = null;
let _viewNoteId = null;
let _memoIndex  = {}; // { taskId: [note, …] } — rebuilt each renderWeek/renderLabMonth call
let _noteOpenedFromTask  = false;
let _noteViewEditMode    = false;
let _labStore       = null; // lazy-loaded Lab store for picker + Lab chip resolution
let _workStoreCache = null; // cached Work store so Lab context can build memo index
let _pickerWorkIds  = new Set();
let _pickerLabIds   = new Set();

function _noteRng(id, salt) {
  let h = ((id * 2654435761) ^ (salt * 1000003)) >>> 0;
  h = ((h ^ (h >>> 16)) * 0x45d9f3b) >>> 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 0xFFFFFFFF;
}

const _NOTE_RADII = [
  '12px 18px 14px 20px',
  '20px 12px 18px 14px',
  '14px 20px 12px 18px',
  '18px 14px 20px 12px',
];

function buildMemoIndex() {
  // Lab context: index Lab task IDs using cached Work store's notes
  if (S.context === 'lab') {
    if (!_workStoreCache) return {};
    const idx = {};
    (_workStoreCache.notes || []).forEach(n => {
      (n.linkedLabTaskIds || []).forEach(tid => {
        for (const w of store.weeks) {
          const t = w.tasks.find(t => t.id === tid);
          if (t) { if (!idx[t.id]) idx[t.id] = []; idx[t.id].push(n); break; }
        }
      });
    });
    return idx;
  }
  // Work context: index Work task IDs
  const idx = {};
  (store.notes || []).forEach(n => {
    (n.linkedTaskIds || []).forEach(tid => {
      const live = resolveLiveTask(tid);
      if (!live) return;
      if (!idx[live.id]) idx[live.id] = [];
      idx[live.id].push(n);
    });
  });
  return idx;
}

// Notes always live in the Work store. In Lab context use _workStoreCache as fallback.
function _getNote(id) {
  const n = (store.notes || []).find(n => n.id === id);
  if (n) return n;
  if (_workStoreCache && _workStoreCache !== store) return (_workStoreCache.notes || []).find(n => n.id === id) || null;
  return null;
}

function _saveNotes() {
  if (S.context === 'lab' && _workStoreCache) {
    localStorage.setItem('tudus-work-v1', JSON.stringify(_workStoreCache));
    if (typeof SERVER_MODE !== 'undefined' && SERVER_MODE) {
      fetch('/data?ctx=work', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(_workStoreCache) }).catch(() => {});
    }
  } else {
    save();
  }
}

function resolveLiveTask(id) {
  let current = null;
  for (const w of store.weeks) {
    const t = w.tasks.find(t => t.id === id);
    if (t) { current = t; break; }
  }
  if (!current) return null;
  let next;
  while (true) {
    next = null;
    for (const w of store.weeks) {
      const t = w.tasks.find(t => t.carriedFromId === current.id);
      if (t) { next = t; break; }
    }
    if (!next) break;
    current = next;
  }
  return current;
}

function renderNotes() {
  _workStoreCache = store;
  const container = document.getElementById('note-cards');
  const notes = (store.notes || []).slice().reverse();
  if (!notes.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-glyph">◎</div><p>No memos yet — capture a thought.</p></div>';
    return;
  }
  const NUM_COLS = 3;
  const cols = Array.from({ length: NUM_COLS }, () => {
    const el = document.createElement('div');
    el.className = 'note-col';
    return el;
  });
  const colH = new Array(NUM_COLS).fill(0);
  notes.forEach(n => {
    const radius = _NOTE_RADII[Math.floor(_noteRng(n.id, 1) * _NOTE_RADII.length)];
    const preview = (n.content || '').replace(/\t/g, '  ');
    const titleLines = Math.ceil(Math.max((n.title || '').length, 10) / 28);
    const bodyLines  = Math.min((n.content || '').split('\n').length, 4);
    const estH       = 56 + titleLines * 20 + bodyLines * 19 + 46;
    const colIdx = colH.indexOf(Math.min(...colH));
    colH[colIdx] += estH + 16;
    const card = document.createElement('div');
    const workLinks = (n.linkedTaskIds || []).length;
    const labLinks  = (n.linkedLabTaskIds || []).length;
    card.className = 'note-card'
      + (workLinks > 0 ? ' note-card-work-linked' : '')
      + (labLinks  > 0 ? ' note-card-lab-linked'  : '');
    card.style.borderRadius = radius;
    card.dataset.nid = n.id;
    const workInd = workLinks > 0
      ? `<span class="note-link-ind note-link-ind-work">↗ ${workLinks} work task${workLinks !== 1 ? 's' : ''}</span>`
      : '';
    const labInd = labLinks > 0
      ? `<span class="note-link-ind note-link-ind-lab">⚗ ${labLinks} lab task${labLinks !== 1 ? 's' : ''}</span>`
      : '';
    const linkInds = (workLinks > 0 || labLinks > 0)
      ? `<div style="display:flex;gap:4px;flex-wrap:wrap">${workInd}${labInd}</div>`
      : '';
    card.innerHTML =
      '<div class="note-card-title">' + esc(n.title || 'Untitled') + '</div>'
      + '<div class="note-card-preview">' + esc(preview) + '</div>'
      + '<div class="note-card-footer">'
      + '<span class="note-card-date">' + esc(_fmtNoteDate(n.createdAt)) + '</span>'
      + linkInds
      + '<div class="note-menu-wrap">'
      + '<button class="note-menu-btn" data-na="menu" data-nid="' + n.id + '" title="More options">···</button>'
      + '<div class="note-dropdown hidden" id="ndd-' + n.id + '">'
      + '<button class="dd-item" data-na="edit"   data-nid="' + n.id + '">✏ Edit memo</button>'
      + '<div class="dd-sep"></div>'
      + '<button class="dd-item dd-danger" data-na="delete" data-nid="' + n.id + '">✕ Delete memo</button>'
      + '</div></div></div>';
    card.addEventListener('click', e => {
      if (e.target.closest('.note-menu-wrap')) return;
      openNoteView(n.id);
    });
    card.querySelectorAll('[data-na]').forEach(el => {
      el.addEventListener('click', e => { e.stopPropagation(); _noteAction(el.dataset.na, +el.dataset.nid); });
    });
    cols[colIdx].appendChild(card);
  });
  const masonry = document.createElement('div');
  masonry.className = 'note-masonry';
  cols.forEach(c => masonry.appendChild(c));
  container.innerHTML = '';
  container.appendChild(masonry);
}

function _fmtNoteDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function _noteAction(action, id) {
  if (action === 'menu') {
    const dd  = document.getElementById('ndd-' + id);
    const btn = document.querySelector('.note-menu-btn[data-nid="' + id + '"]');
    if (!dd) return;
    const isOpen = !dd.classList.contains('hidden');
    closeNoteDropdowns();
    if (!isOpen) { dd.classList.remove('hidden'); btn && btn.classList.add('open'); }
    return;
  }
  closeNoteDropdowns();
  if (action === 'edit')   { openNoteModal(id); return; }
  if (action === 'delete') {
    const n = (store.notes || []).find(n => n.id === id); if (!n) return;
    const label = (n.title || n.content.split('\n')[0]).slice(0, 60);
    showConfirm('"' + label + (label.length >= 60 ? '…' : '') + '"\n\nThis cannot be undone.', 'Delete memo', () => {
      store.notes = store.notes.filter(x => x.id !== id);
      save(); renderNotes(); toast('Memo deleted');
    });
  }
}

function closeNoteDropdowns() {
  document.querySelectorAll('.note-dropdown').forEach(d => d.classList.add('hidden'));
  document.querySelectorAll('.note-menu-btn').forEach(b => b.classList.remove('open'));
}

function _setNoteViewMode(mode) {
  const edit = mode === 'edit';
  document.getElementById('note-view-modal-title').classList.toggle('hidden', edit);
  document.getElementById('note-view-ttl-input').classList.toggle('hidden', !edit);
  document.getElementById('note-view-body').classList.toggle('hidden', edit);
  document.getElementById('note-view-textarea').classList.toggle('hidden', !edit);
  document.getElementById('note-view-edit-icon').classList.toggle('hidden', edit);
  if (edit) document.getElementById('note-view-linked-tasks').classList.add('hidden');
  // Read-mode linked-tasks visibility is managed by _renderLinkedTaskChips
  document.getElementById('note-view-close').classList.toggle('hidden', edit);
  document.getElementById('note-view-link-task').classList.toggle('hidden', edit);
  document.getElementById('note-view-edit-cancel').classList.toggle('hidden', !edit);
  document.getElementById('note-view-edit-save').classList.toggle('hidden', !edit);
}

function enterNoteEditMode(focusTitle) {
  const n = _getNote(_viewNoteId); if (!n) return;
  _noteViewEditMode = true;
  document.getElementById('note-view-ttl-input').value = n.title || '';
  document.getElementById('note-view-textarea').value  = n.content || '';
  _setNoteViewMode('edit');
  if (focusTitle === true) {
    const inp = document.getElementById('note-view-ttl-input');
    inp.focus(); inp.select();
  } else {
    const ta = document.getElementById('note-view-textarea');
    ta.focus();
    ta.setSelectionRange(ta.value.length, ta.value.length);
  }
}

function exitNoteEditMode(doSave) {
  if (doSave) {
    const ttl     = document.getElementById('note-view-ttl-input').value.trim();
    const content = document.getElementById('note-view-textarea').value.trim();
    if (!ttl)     { document.getElementById('note-view-ttl-input').focus(); return; }
    if (!content) { document.getElementById('note-view-textarea').focus();  return; }
    const n = _getNote(_viewNoteId);
    if (n) {
      n.title = ttl; n.content = content;
      _saveNotes();
      document.getElementById('note-view-modal-title').textContent = n.title;
      document.getElementById('note-view-body').innerHTML          = formatNotes(n.content);
      _renderLinkedTaskChips(n);
      if (S.view === 'notes') renderNotes();
      toast('Memo updated');
    }
  } else {
    const n = _getNote(_viewNoteId);
    if (n) _renderLinkedTaskChips(n);
  }
  _noteViewEditMode = false;
  _setNoteViewMode('read');
}

function openNoteView(id) {
  const n = _getNote(id); if (!n) return;
  _viewNoteId       = id;
  _noteViewEditMode = false;
  document.getElementById('note-view-modal-title').textContent = n.title || 'Untitled';
  document.getElementById('note-view-modal-date').textContent  = _fmtNoteDate(n.createdAt);
  document.getElementById('note-view-body').innerHTML          = formatNotes(n.content || '');
  _setNoteViewMode('read');
  _renderLinkedTaskChips(n);
  if ((n.linkedLabTaskIds || []).length && !_labStore) {
    load('lab').then(ls => { _labStore = ls; _renderLinkedTaskChips(n); });
  }
  document.getElementById('note-view-overlay').classList.remove('hidden');
}

function _renderLinkedTaskChips(n) {
  const container = document.getElementById('note-view-linked-tasks');
  const workIds = n.linkedTaskIds || [];
  const labIds  = n.linkedLabTaskIds || [];
  if (!workIds.length && !labIds.length) { container.classList.add('hidden'); container.innerHTML = ''; return; }
  container.classList.remove('hidden');

  let html = '';

  if (workIds.length) {
    const chips = workIds.map(tid => {
      const live = resolveLiveTask(tid);
      if (!live) return '<span class="linked-task-chip linked-task-orphan"><s>Removed task</s></span>';
      let wref = null;
      for (const w of store.weeks) {
        if (w.tasks.some(t => t.id === live.id)) { wref = w.ref; break; }
      }
      return '<button class="linked-task-chip linked-task-chip-work" data-ltid="' + live.id + '" data-wref="' + esc(wref || '') + '" data-ltctx="work" title="Jump to task">'
        + '<span class="lt-chip-title">' + esc(live.title) + '</span>'
        + '<span class="s-pill ' + live.status + '" style="pointer-events:none;font-size:10px;padding:1px 7px;margin:0">'
        + '<span class="s-dot"></span>' + STATUS_LABEL[live.status] + '</span>'
        + '<span class="lt-chip-jump">→</span>'
        + '</button>';
    }).join('');
    html += '<div class="linked-tasks-label">Work tasks</div><div class="linked-tasks-chips">' + chips + '</div>';
  }

  if (labIds.length) {
    const chips = labIds.map(tid => {
      if (!_labStore) return '<span class="linked-task-chip linked-task-chip-lab" style="opacity:.55">Loading…</span>';
      let labTask = null, wref = null;
      for (const w of _labStore.weeks) {
        const t = w.tasks.find(t => t.id === tid);
        if (t) { labTask = t; wref = w.ref; break; }
      }
      if (!labTask) return '<span class="linked-task-chip linked-task-chip-lab linked-task-orphan"><s>Removed task</s></span>';
      return '<button class="linked-task-chip linked-task-chip-lab" data-ltid="' + labTask.id + '" data-wref="' + esc(wref || '') + '" data-ltctx="lab" title="Jump to Lab task">'
        + '<span class="lt-chip-title">' + esc(labTask.title) + '</span>'
        + '<span class="s-pill ' + labTask.status + '" style="pointer-events:none;font-size:10px;padding:1px 7px;margin:0">'
        + '<span class="s-dot"></span>' + STATUS_LABEL[labTask.status] + '</span>'
        + '<span class="lt-chip-jump">→</span>'
        + '</button>';
    }).join('');
    html += '<div class="linked-tasks-label"' + (workIds.length ? ' style="margin-top:10px"' : '') + '>Lab tasks</div>'
      + '<div class="linked-tasks-chips">' + chips + '</div>';
  }

  container.innerHTML = html;
  container.querySelectorAll('.linked-task-chip[data-ltid]').forEach(btn => {
    btn.addEventListener('click', () => {
      const taskId  = +btn.dataset.ltid;
      const weekRef = btn.dataset.wref;
      const ctx     = btn.dataset.ltctx;
      if (!weekRef) return;
      closeNoteView();
      if (ctx === 'lab') {
        switchContext('lab').then(() => _jumpToLinkedTask(weekRef, taskId));
      } else if (S.context !== 'work') {
        switchContext('work').then(() => _jumpToLinkedTask(weekRef, taskId));
      } else {
        _jumpToLinkedTask(weekRef, taskId);
      }
    });
  });
}

function _jumpToLinkedTask(weekRef, taskId) {
  S.weekRef = weekRef;
  const w = getWeek(weekRef);
  if (w) { const d = new Date(w.startDate + 'T00:00:00'); S.monthContext = { year: d.getFullYear(), month: d.getMonth() + 1 }; }
  setView('week');
  requestAnimationFrame(() => {
    const card = document.querySelector('.task-card[data-id="' + taskId + '"]');
    if (!card) return;
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.classList.add('card-highlight');
    card.addEventListener('animationend', () => card.classList.remove('card-highlight'), { once: true });
  });
}

function closeNoteView() {
  if (_noteViewEditMode) { exitNoteEditMode(false); return; } // Esc in edit mode → cancel, stay in overlay
  document.getElementById('note-view-overlay').classList.add('hidden');
  _viewNoteId = null;
  _noteOpenedFromTask = false;
}

function openTaskPicker() {
  if (!_viewNoteId) return;
  const n = _getNote(_viewNoteId);
  if (!n) return;
  _pickerWorkIds = new Set((n.linkedTaskIds || []).map(tid => {
    const live = resolveLiveTask(tid);
    return live ? live.id : tid;
  }));
  _pickerLabIds = new Set(n.linkedLabTaskIds || []);
  document.getElementById('task-picker-search').value = '';
  _renderTaskPickerList('');
  document.getElementById('task-picker-overlay').classList.remove('hidden');
  setTimeout(() => document.getElementById('task-picker-search').focus(), 40);
  if (!_labStore) {
    load('lab').then(ls => {
      _labStore = ls;
      _renderTaskPickerList(document.getElementById('task-picker-search').value.trim());
    });
  }
}

function _renderTaskPickerList(filter) {
  const container = document.getElementById('task-picker-list');
  const fl = filter.toLowerCase();
  let html = '';

  (store.weeks || []).forEach(w => {
    const tasks = fl ? w.tasks.filter(t => t.title.toLowerCase().includes(fl)) : w.tasks.slice();
    if (!tasks.length) return;
    html += '<div class="tpicker-week">' + esc(w.wref) + ' — ' + esc(weekLabelShort(w.startDate, w.endDate)) + '</div>';
    tasks.forEach(t => {
      const chk = _pickerWorkIds.has(t.id) ? ' checked' : '';
      html += '<label class="tpicker-row">'
        + '<input type="checkbox" class="tpicker-cb" data-tid="' + t.id + '" data-ctx="work"' + chk + '>'
        + '<span class="tpicker-title">' + esc(t.title) + '</span>'
        + '<span class="s-pill ' + t.status + '" style="pointer-events:none;font-size:10px;padding:1px 7px;margin-left:auto;flex-shrink:0">'
        + '<span class="s-dot"></span>' + STATUS_LABEL[t.status] + '</span>'
        + '</label>';
    });
  });

  if (_labStore) {
    let labHtml = '';
    (_labStore.weeks || []).forEach(w => {
      const tasks = fl ? w.tasks.filter(t => t.title.toLowerCase().includes(fl)) : w.tasks.slice();
      if (!tasks.length) return;
      labHtml += '<div class="tpicker-week" style="color:var(--lab-accent)">'
        + esc(w.wref) + ' — ' + esc(weekLabelShort(w.startDate, w.endDate)) + ' ⚗</div>';
      tasks.forEach(t => {
        const chk = _pickerLabIds.has(t.id) ? ' checked' : '';
        labHtml += '<label class="tpicker-row">'
          + '<input type="checkbox" class="tpicker-cb" data-tid="' + t.id + '" data-ctx="lab"' + chk + '>'
          + '<span class="tpicker-title">' + esc(t.title) + '</span>'
          + '<span class="s-pill ' + t.status + '" style="pointer-events:none;font-size:10px;padding:1px 7px;margin-left:auto;flex-shrink:0">'
          + '<span class="s-dot"></span>' + STATUS_LABEL[t.status] + '</span>'
          + '</label>';
      });
    });
    if (labHtml) {
      html += '<div class="tpicker-week" style="background:var(--lab-accent-lt);color:var(--lab-accent);border-top:2px solid var(--lab-accent-dim);position:sticky;top:0">⚗ Lab tasks</div>';
      html += labHtml;
    }
  }

  if (!html) html = '<div class="tpicker-empty">No tasks found</div>';
  container.innerHTML = html;
}

function closeTaskPicker() {
  document.getElementById('task-picker-overlay').classList.add('hidden');
}

function confirmTaskPicker() {
  if (!_viewNoteId) return;
  const n = _getNote(_viewNoteId);
  if (!n) return;
  n.linkedTaskIds    = [..._pickerWorkIds];
  n.linkedLabTaskIds = [..._pickerLabIds];
  _saveNotes();
  closeTaskPicker();
  _renderLinkedTaskChips(n);
  if (S.view === 'notes') renderNotes();
}

function _showMoreMemosDropdown(btn, taskId) {
  document.querySelectorAll('.cmr-dropdown').forEach(d => d.remove());
  const memos = (_memoIndex[taskId] || []).slice(1);
  if (!memos.length) return;
  const drop = document.createElement('div');
  drop.className = 'cmr-dropdown';
  memos.forEach(m => {
    const b = document.createElement('button');
    b.className = 'dd-item';
    b.textContent = '↗ ' + (m.title || 'Untitled');
    b.addEventListener('click', e => {
      e.stopPropagation();
      drop.remove();
      document.removeEventListener('mousedown', onOutside, true);
      _noteOpenedFromTask = true;
      openNoteView(m.id);
    });
    drop.appendChild(b);
  });
  document.body.appendChild(drop);
  const r = btn.getBoundingClientRect();
  drop.style.position = 'fixed';
  drop.style.top  = (r.bottom + 4) + 'px';
  drop.style.left = r.left + 'px';
  requestAnimationFrame(() => {
    const pr = drop.getBoundingClientRect();
    if (pr.right  > window.innerWidth  - 8) drop.style.left = (window.innerWidth - 8 - pr.width)  + 'px';
    if (pr.bottom > window.innerHeight - 8) drop.style.top  = (r.top - 4 - pr.height) + 'px';
  });
  const onOutside = e => {
    if (!drop.contains(e.target)) { drop.remove(); document.removeEventListener('mousedown', onOutside, true); }
  };
  document.addEventListener('mousedown', onOutside, true);
}

function openNoteModal(editId) {
  _editNoteId = (editId !== undefined) ? editId : null;
  const ttl = document.getElementById('note-edit-ttl');
  const ta  = document.getElementById('note-edit-textarea');
  if (_editNoteId !== null) {
    const n = (store.notes || []).find(n => n.id === _editNoteId); if (!n) return;
    document.getElementById('note-edit-title').textContent = 'Edit Memo';
    ttl.value = n.title || '';
    ta.value  = n.content || '';
  } else {
    document.getElementById('note-edit-title').textContent = 'Add Memo';
    ttl.value = '';
    ta.value  = notesDatePrefix();
  }
  document.getElementById('note-edit-overlay').classList.remove('hidden');
  setTimeout(() => { ttl.focus(); }, 40);
}

function closeNoteModal() {
  document.getElementById('note-edit-overlay').classList.add('hidden');
  _editNoteId = null;
}

function saveNoteModal() {
  const ttl     = document.getElementById('note-edit-ttl').value.trim();
  const ta      = document.getElementById('note-edit-textarea');
  const text    = ta.value.trim();
  const cleaned = text === notesDatePrefix().trim() ? '' : text;
  if (!ttl)     { document.getElementById('note-edit-ttl').focus(); return; }
  if (!cleaned) { ta.focus(); return; }
  if (!store.notes) store.notes = [];
  if (_editNoteId !== null) {
    const idx = store.notes.findIndex(n => n.id === _editNoteId);
    if (idx >= 0) { store.notes[idx].title = ttl; store.notes[idx].content = cleaned; }
    save(); closeNoteModal();
    if (S.view === 'notes') renderNotes();
    toast('Memo updated');
  } else {
    store.notes.push({ id: store.nextId++, title: ttl, content: cleaned, createdAt: toISO(new Date()), linkedTaskIds: [] });
    save(); closeNoteModal();
    if (S.view === 'notes') renderNotes();
    toast('Memo added');
  }
}

function migrateTaskNotesToMemos() {
  // Phase 3: scan all tasks with task.notes !== null, create linked memos, set task.notes = null
  // Not wired to UI in Phase 2.
}
