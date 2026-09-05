// ════════════════════════════════════════════════════════
// 12. MODAL — ADD / EDIT
// ════════════════════════════════════════════════════════
function parseSubs(raw) {
  return (raw || '').split('\n').filter(s => s.trim()).map(line => {
    // Detect indent: leading tabs (1 tab = 1 level) or leading 2-space groups
    const iMatch = line.match(/^(\t+|( {2})+)/);
    const indent = iMatch
      ? Math.min(iMatch[1].startsWith('\t') ? iMatch[1].length : Math.floor(iMatch[1].length / 2), 4)
      : 0;
    const m = line.match(/https?:\/\/\S+/);
    if (m) return { text: line.replace(m[0], '').replace(/^[\s\-↳]+/, '').trim() || m[0], link: m[0], indent };
    return { text: line.replace(/^[\s\-↳]+/, '').trim(), link: null, indent };
  });
}
function subsToText(subs) {
  return subs.map(s => '\t'.repeat(s.indent || 0) + (s.link ? `${s.text} ${s.link}` : s.text)).join('\n');
}
function meetToVal(ds)    { return ds ? { date: ds.slice(0, 10), time: ds.slice(11, 16) } : { date: '', time: '' }; }

function openModal(editId) {
  S.editId = editId || null;
  const week = getWeek(S.weekRef);
  const wLabel = week ? weekLabelShort(week.startDate, week.endDate) : '';
  if (S.editId && week) {
    const t = week.tasks.find(t => t.id === S.editId);
    if (!t) return;
    document.getElementById('modal-title').innerHTML = `Edit task <span style="color:var(--text-2);font-weight:400">— ${wLabel}</span>`;
    const mv = meetToVal(t.nextMeeting);
    document.getElementById('f-title').value     = t.title;
    document.getElementById('f-subs').value      = subsToText(t.subtasks);
    document.getElementById('f-meet-date').value = mv.date;
    document.getElementById('f-meet-time').value = mv.time;
    document.getElementById('btn-mo-save').textContent = 'Save changes';
  } else {
    document.getElementById('modal-title').innerHTML = `Add task <span style="color:var(--text-2);font-weight:400">— ${wLabel}</span>`;
    document.getElementById('f-title').value     = '';
    document.getElementById('f-subs').value      = '';
    document.getElementById('f-meet-date').value = '';
    document.getElementById('f-meet-time').value = '';
    document.getElementById('btn-mo-save').textContent = 'Add Task';
  }
  document.getElementById('overlay').classList.remove('hidden');
  setTimeout(() => document.getElementById('f-title').focus(), 40);
}

function closeModal() {
  document.getElementById('overlay').classList.add('hidden');
  S.editId = null;
}

function saveTask() {
  const title = document.getElementById('f-title').value.trim();
  if (!title) { document.getElementById('f-title').focus(); return; }
  const subtasks  = parseSubs(document.getElementById('f-subs').value);
  const meetDate  = document.getElementById('f-meet-date').value;
  const meetTime  = document.getElementById('f-meet-time').value;
  const rawMeet   = meetDate ? `${meetDate}T${meetTime || '00:00'}` : '';
  const week     = getWeek(S.weekRef);
  if (!week) return;

  if (S.editId) {
    const idx = week.tasks.findIndex(t => t.id === S.editId);
    if (idx >= 0) {
      week.tasks[idx] = { ...week.tasks[idx], title, nextMeeting: rawMeet || null,
        subtasks, expanded: subtasks.length > 0 || week.tasks[idx].expanded };
    }
    save(); closeModal(); renderCurrent(); syncHeader(); toast('Task updated');
  } else {
    week.tasks.push({ id: store.nextId++, rank: week.tasks.length + 1, title,
      status: 'todo', nextMeeting: rawMeet || null, carried: false,
      expanded: subtasks.length > 0 || S.context === 'lab', subtasks });
    const newId = store.nextId - 1;
    // In Lab, snap month context to where the task landed before re-rendering
    if (S.context === 'lab') {
      const d = new Date(week.startDate + 'T00:00:00');
      S.monthContext = { year: d.getFullYear(), month: d.getMonth() + 1 };
    }
    save(); closeModal(); renderCurrent(); syncHeader(); toast('Task added');
    // In lab, immediately open notes so the task is useful from the start
    if (S.context === 'lab') setTimeout(() => openNotes(newId), 80);
  }
}
