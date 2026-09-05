// ════════════════════════════════════════════════════════
// 10. ACTIONS
// ════════════════════════════════════════════════════════
function doAction(action, id) {
  const week = getWeek(S.weekRef);
  if (action === 'menu')      { toggleDropdown(id); return; }
  if (action === 'edit')      { closeDropdowns(); if (!S.viewOnly) openModal(id); return; }
  if (action === 'notes')     { closeDropdowns(); if (!S.viewOnly) openNotes(id); return; }
  if (action === 'viewnotes') { if (!S.viewOnly) openNotes(id); return; }
  if (action === 'quickdate') {
    if (S.viewOnly) return;
    // toggle: close any open picker
    const existing = document.querySelector('.quick-date-pop');
    if (existing) { existing.remove(); return; }
    const w = getWeek(S.weekRef); if (!w) return;
    const t = w.tasks.find(t => t.id === id); if (!t) return;
    const section = document.querySelector(`.meet-section[data-id="${id}"]`);
    if (!section) return;

    const cur = t.nextMeeting || '';
    const pop = document.createElement('div');
    pop.className = 'quick-date-pop';

    const dateInp = document.createElement('input');
    dateInp.type = 'date';
    dateInp.className = 'quick-date-finput';
    dateInp.value = cur.slice(0, 10);

    const timeInp = document.createElement('input');
    timeInp.type = 'time';
    timeInp.className = 'quick-date-finput quick-date-time';
    timeInp.value = cur.slice(11, 16);

    const row = document.createElement('div');
    row.className = 'quick-date-row';
    row.appendChild(dateInp);
    row.appendChild(timeInp);

    const clrBtn = document.createElement('button');
    clrBtn.textContent = 'Clear';
    clrBtn.className = 'quick-date-clr';

    const okBtn = document.createElement('button');
    okBtn.textContent = 'OK';
    okBtn.className = 'quick-date-ok';

    const actions = document.createElement('div');
    actions.className = 'quick-date-actions';
    actions.appendChild(clrBtn);
    actions.appendChild(okBtn);

    pop.appendChild(row);
    pop.appendChild(actions);
    document.body.appendChild(pop);

    // position below the section; clamp to viewport edges
    const rect = section.getBoundingClientRect();
    pop.style.top  = (rect.bottom + 6) + 'px';
    pop.style.left = rect.left + 'px';
    const pr = pop.getBoundingClientRect();
    if (pr.right  > window.innerWidth  - 8) pop.style.left = (window.innerWidth  - 8 - pr.width)  + 'px';
    if (pr.bottom > window.innerHeight - 8) pop.style.top  = (rect.top - 6 - pr.height) + 'px';

    dateInp.focus();

    const commit = (val) => {
      pop.remove();
      document.removeEventListener('mousedown', onOutside, true);
      const w2 = getWeek(S.weekRef); if (!w2) return;
      const i2 = w2.tasks.findIndex(t => t.id === id); if (i2 < 0) return;
      w2.tasks[i2].nextMeeting = val || null;
      save(); renderCurrent();
    };
    okBtn.addEventListener('click', () => {
      const d = dateInp.value;
      commit(d ? d + 'T' + (timeInp.value || '00:00') : null);
    });
    clrBtn.addEventListener('click', () => commit(null));

    const onOutside = (e) => {
      if (!pop.isConnected) { document.removeEventListener('mousedown', onOutside, true); return; }
      if (pop.contains(e.target) || section.contains(e.target)) return;
      document.removeEventListener('mousedown', onOutside, true);
      pop.remove();
    };
    document.addEventListener('mousedown', onOutside, true);

    pop.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.stopPropagation(); pop.remove(); document.removeEventListener('mousedown', onOutside, true); }
      if (e.key === 'Enter')  { e.stopPropagation(); e.preventDefault(); okBtn.click(); }
    });
    return;
  }
  if (action === 'delete') {
    closeDropdowns();
    if (S.viewOnly || !week) return;
    const idx = week.tasks.findIndex(t => t.id === id); if (idx < 0) return;
    const title = week.tasks[idx].title;
    showConfirm('"' + title + '"\n\nThis cannot be undone.', 'Delete task', () => {
      const w = getWeek(S.weekRef); if (!w) return;
      const i = w.tasks.findIndex(t => t.id === id); if (i < 0) return;
      w.tasks.splice(i, 1);
      w.tasks.forEach((t, j) => t.rank = j + 1);
      (store.notes || []).forEach(n => {
        if (!n.linkedTaskIds) return;
        const pos = n.linkedTaskIds.indexOf(id);
        if (pos >= 0) n.linkedTaskIds.splice(pos, 1);
      });
      save(); renderCurrent(); toast('Task deleted');
    });
    return;
  }
  if (!week) return;
  const idx = week.tasks.findIndex(t => t.id === id); if (idx < 0) return;
  if (action === 'expand') {
    week.tasks[idx].expanded = !week.tasks[idx].expanded; save(); renderCurrent();
  } else if (action === 'status') {
    week.tasks[idx].status = nextStatus(week.tasks[idx].status);
    save(); toast(`Marked as ${STATUS_LABEL[week.tasks[idx].status]}`); renderCurrent();
  }
}

function toggleDropdown(id) {
  const dd  = document.getElementById('dd-' + id);
  const btn = document.querySelector(`.card-menu-btn[data-id="${id}"]`);
  if (!dd) return;
  const open = !dd.classList.contains('hidden');
  closeDropdowns();
  if (!open) { dd.classList.remove('hidden'); btn && btn.classList.add('open'); }
}
function closeDropdowns() {
  document.querySelectorAll('.card-dropdown').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.card-menu-btn').forEach(el => el.classList.remove('open'));
}
