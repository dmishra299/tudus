// ════════════════════════════════════════════════════════
// 9. RENDER — WEEK VIEW
// ════════════════════════════════════════════════════════
function renderCarryBanner(week) {
  const banner = document.getElementById('carry-banner');
  if (S.context === 'lab') { banner.classList.add('hidden'); return; }

  // Done banner: tasks were already carried in and not yet dismissed
  const doneCnt = (week && week.carriedFrom && !store.settings.dismissedCarry[S.weekRef])
    ? week.tasks.filter(t => t.carried).length : 0;

  if (doneCnt > 0) {
    const fromWeek  = getWeek(week.carriedFrom);
    const fromLabel = fromWeek ? weekLabelShort(fromWeek.startDate, fromWeek.endDate) : week.carriedFrom;
    banner.classList.remove('hidden');
    banner.innerHTML = `↺&nbsp;<span><strong>${doneCnt} task${doneCnt!==1?'s':''}</strong> carried forward from <strong>${fromLabel}</strong></span>`
      + `<button class="carry-dismiss" id="carry-dismiss-btn">Dismiss</button>`;
    document.getElementById('carry-dismiss-btn').onclick = () => {
      store.settings.dismissedCarry[S.weekRef] = true;
      save(); banner.classList.add('hidden');
    };
    return;
  }

  // Offer banner: previous week has open tasks not yet brought into this week
  const sorted    = allWeeks();
  const wi        = sorted.findIndex(w => w.ref === S.weekRef);
  const prevWeek  = wi > 0 ? sorted[wi - 1] : null;
  const openTasks = prevWeek ? prevWeek.tasks.filter(t => t.status !== 'done') : [];
  const existing  = week ? new Set(week.tasks.map(t => t.title.trim())) : new Set();
  const unbrought = openTasks.filter(t => !existing.has(t.title.trim()));

  if (unbrought.length) {
    const prevLabel = weekLabelShort(prevWeek.startDate, prevWeek.endDate);
    const cnt = unbrought.length;
    banner.classList.remove('hidden');
    banner.innerHTML = `↺&nbsp;<span><strong>${cnt} open task${cnt!==1?'s':''}</strong> from <strong>${prevWeek.wref} · ${prevLabel}</strong> — not yet brought in</span>`
      + `<div style="display:flex;gap:8px;margin-left:auto;flex-shrink:0">`
      + `<button class="carry-dismiss" id="carry-bring-btn" style="font-weight:600;color:var(--accent)">Bring in</button>`
      + `<button class="carry-dismiss" id="carry-skip-btn">Skip</button>`
      + `</div>`;
    document.getElementById('carry-bring-btn').onclick = () => {
      maybeCarryForward(prevWeek.ref, S.weekRef);
      renderWeek();
      toast(`${cnt} task${cnt!==1?'s':''} brought in from ${prevWeek.wref}`);
    };
    document.getElementById('carry-skip-btn').onclick = () => banner.classList.add('hidden');
  } else {
    banner.classList.add('hidden');
  }
}

function buildSubtasksHtml(subtasks) {
  return subtasks.map(s =>
    `<div class="subtask"${(s.indent||0) > 0 ? ` style="margin-left:${(s.indent||0)*14}px"` : ''}>` +
    `<span class="st-arr">↳</span>` +
    (s.link
      ? `<a href="${esc(s.link)}" target="_blank" rel="noopener noreferrer">${esc(s.text)}</a>`
      : `<span>${esc(s.text)}</span>`) +
    `</div>`
  ).join('');
}

function buildCardHtml(t) {
  const hasSub     = t.subtasks.length > 0;
  const mFmt       = fmtMeet(t.nextMeeting);
  const drHtml     = daysHtml(t.nextMeeting);
  const taskMemos  = _memoIndex[t.id] || [];
  let memoRefHtml  = '';
  if (taskMemos.length > 0) {
    const first = taskMemos[0];
    const extra = taskMemos.length - 1;
    memoRefHtml = `<div class="card-memo-ref">`
      + `<span class="cmr-label">↗</span>`
      + `<button class="cmr-link" data-a="openmemo" data-mid="${first.id}">${esc(first.title || 'Untitled')}</button>`
      + (extra > 0 ? `<button class="cmr-more" data-a="openmemomore">+${extra} more</button>` : '')
      + `</div>`;
  }

  return `
    ${_selectMode
      ? `<div class="card-sel-col"><input type="checkbox"${_selectedIds.has(t.id) ? ' checked' : ''}></div>`
      : `<div class="card-grip-col" title="Drag to reorder"><span class="grip">⠿</span><span class="card-num">${t.rank}</span></div>`}
    <div class="card-body">
      <div class="card-head">
        ${hasSub
          ? `<button class="exp-btn" data-a="expand" data-id="${t.id}">${t.expanded?'▾':'▸'}</button>`
          : `<span style="width:16px;flex-shrink:0"></span>`}
        <span class="card-title">${esc(t.title)}</span>
        ${t.carried ? `<span class="carried-tag">↺&nbsp;carried</span>` : ''}

        <div class="card-menu-wrap">
          <button class="card-menu-btn" data-a="menu" data-id="${t.id}" title="More options">···</button>
          <div class="card-dropdown hidden" id="dd-${t.id}">
            ${!S.viewOnly ? `<button class="dd-item" data-a="edit"  data-id="${t.id}">✏ Edit task</button>` : ''}
            ${!S.viewOnly ? `<button class="dd-item" data-a="notes" data-id="${t.id}">${t.notes ? '✎ Edit notes' : '＋ Add notes'}</button>` : ''}
            ${S.viewOnly  ? `<span class="dd-item" style="opacity:.45;cursor:default;font-size:12px">View-only mode</span>` : ''}
            ${!S.viewOnly ? `<div class="dd-sep"></div><button class="dd-item dd-danger" data-a="delete" data-id="${t.id}">✕ Delete task</button>` : ''}
          </div>
        </div>
      </div>
      ${hasSub ? `<div class="subtasks" ${t.expanded ? '' : 'style="display:none"'}>${buildSubtasksHtml(t.subtasks)}</div>` : ''}
      <div class="card-foot">
        <div class="meet-section${!S.viewOnly ? ' meet-clickable' : ''}" ${!S.viewOnly ? `data-a="quickdate" data-id="${t.id}" title="Click to set date"` : ''}>
          ${mFmt ? `<span class="meet-date">${mFmt}</span>${drHtml}` : `<span class="meet-none">No action date</span>`}
        </div>
        <button class="s-pill ${t.status}" data-a="status" data-id="${t.id}" ${S.viewOnly ? 'disabled' : ''}>
          <span class="s-dot"></span>${STATUS_LABEL[t.status]}
        </button>
      </div>
    </div>
    ${t.notes ? `<div class="card-notes-panel" data-a="viewnotes" data-id="${t.id}" title="Click to view/edit notes">
      <div class="cnp-label">◎ Notes</div>
      <div class="cnp-preview">${esc(t.notes)}</div>
    </div>` : ''}${memoRefHtml}`;
}

function renderWeek() {
  _workStoreCache = store;
  _memoIndex = buildMemoIndex();
  const week = getWeek(S.weekRef);
  renderCarryBanner(week);

  const cards = document.getElementById('task-cards');
  const weekToolbar   = document.getElementById('week-toolbar');
  const selectToolbar = document.getElementById('select-toolbar');

  const hasTasks = !!(week && week.tasks.length);

  if (!hasTasks) {
    weekToolbar.classList.add('hidden');
    selectToolbar.classList.add('hidden');
    cards.classList.remove('selecting');
    if (S.context === 'lab') {
      const elsewhere = store.weeks.filter(w => w.ref !== S.weekRef && w.tasks.length > 0);
      const elseCount = elsewhere.reduce((n, w) => n + w.tasks.length, 0);
      const elseHint  = elseCount > 0
        ? `<p style="font-size:12.5px;color:var(--text-3);margin-top:4px">${elseCount} item${elseCount!==1?'s':''} in other weeks — <button onclick="setView('month')" style="color:var(--accent);text-decoration:underline;font-size:inherit;font-weight:500">month view</button></p>`
        : '';
      cards.innerHTML = `<div class="empty-state"><div class="empty-glyph">⚗</div><p>Nothing in the lab this week.</p>${!S.viewOnly ? `<button class="btn-add" onclick="openModal()">+ Start something</button>` : ''}${elseHint}</div>`;
    } else {
      cards.innerHTML = `<div class="empty-state"><div class="empty-glyph">◦</div><p>No tasks this week — clean slate.</p>${!S.viewOnly ? `<button class="btn-add" onclick="openModal()">+ Add first task</button>` : ''}</div>`;
    }
    return;
  }

  if (_selectMode) {
    weekToolbar.classList.add('hidden');
    selectToolbar.classList.remove('hidden');
    _syncSelectToolbar();
  } else {
    weekToolbar.classList.toggle('hidden', S.viewOnly || S.context === 'lab');
    selectToolbar.classList.add('hidden');
  }

  cards.classList.toggle('selecting', _selectMode);
  cards.innerHTML = '';
  week.tasks.forEach(t => {
    const card = document.createElement('div');
    card.className = `task-card${t.status === 'done' ? ' is-done' : ''}${_selectMode && _selectedIds.has(t.id) ? ' sel-checked' : ''}`;
    card.dataset.id = t.id;
    card.innerHTML = buildCardHtml(t);

    if (_selectMode) {
      card.addEventListener('click', () => _toggleCard(t.id));
    } else {
      card.querySelectorAll('[data-a]').forEach(el => {
        el.addEventListener('click', e => {
          e.stopPropagation();
          const a = el.dataset.a;
          if (a === 'openmemo') { _noteOpenedFromTask = true; openNoteView(+el.dataset.mid); return; }
          if (a === 'openmemomore') { _showMoreMemosDropdown(el, +card.dataset.id); return; }
          doAction(a, +el.dataset.id);
        });
      });
      if (t.notes) {
        const np = card.querySelector('.card-notes-panel');
        if (np) {
          np.addEventListener('mouseenter', () => showNotesTooltip(np, t.notes, t.id));
          np.addEventListener('mouseleave', hideNotesTooltip);
        }
      }
      initDrag(card, t.id);
    }
    cards.appendChild(card);
  });
}

// Re-render whichever view is currently active
function renderCurrent() {
  if (S.view === 'notes') renderNotes();
  else if (S.view === 'month') renderMonth();
  else renderWeek();
}

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
const _URL_RE = /(https?:\/\/[^\s<>"']+|www\.[a-zA-Z0-9][^\s<>"']*)/;
function _linkHref(part) { return part.startsWith('www.') ? 'https://' + part : part; }
function linkify(s) {
  return String(s).split(_URL_RE).map((part, i) =>
    i % 2 === 1
      ? `<a href="${esc(_linkHref(part))}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">${esc(part)}</a>`
      : esc(part)
  ).join('');
}
function formatNotes(s) {
  const datePfx = /^((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2}:)/gm;
  return String(s).split(_URL_RE).map((part, i) =>
    i % 2 === 1
      ? `<a href="${esc(_linkHref(part))}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">${esc(part)}</a>`
      : esc(part).replace(datePfx, '<span class="ntt-date">$1</span>')
  ).join('');
}
