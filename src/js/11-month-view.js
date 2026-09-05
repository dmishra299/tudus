// ════════════════════════════════════════════════════════
// 11. RENDER — MONTH VIEW
// ════════════════════════════════════════════════════════
function renderLabCarryBanner() {
  const banner = document.getElementById('lab-carry-banner');
  if (!banner) return;

  // Previous month
  let { year, month } = S.monthContext;
  month--; if (month < 1) { month = 12; year--; }

  const prevOpen = weeksInMonth(year, month, true).flatMap(w => w.tasks.filter(t => t.status !== 'done'));
  if (!prevOpen.length) { banner.classList.add('hidden'); return; }

  const { year: cy, month: cm } = S.monthContext;
  const currTitles = new Set(weeksInMonth(cy, cm, true).flatMap(w => w.tasks.map(t => t.title.trim())));
  const unbrought  = prevOpen.filter(t => !currTitles.has(t.title.trim()));

  if (!unbrought.length) { banner.classList.add('hidden'); return; }

  const prevName = monthLabel(year, month);
  const cnt = unbrought.length;
  banner.classList.remove('hidden');
  banner.innerHTML =
    `↺&nbsp;<span><strong>${cnt} open task${cnt !== 1 ? 's' : ''}</strong> from <strong>${prevName}</strong> — not yet brought in</span>`
    + `<div style="display:flex;gap:8px;margin-left:auto;flex-shrink:0">`
    + `<button class="carry-dismiss" id="lab-carry-bring-btn" style="font-weight:600;color:var(--accent)">Bring in</button>`
    + `<button class="carry-dismiss" id="lab-carry-skip-btn">Skip</button>`
    + `</div>`;

  document.getElementById('lab-carry-bring-btn').onclick = () => {
    const carried = maybeCarryForwardFromMonth(year, month);
    if (carried) {
      syncHeader();
      renderMonth();
      toast(`${carried} task${carried !== 1 ? 's' : ''} brought in from ${prevName}`);
    } else {
      banner.classList.add('hidden');
    }
  };
  document.getElementById('lab-carry-skip-btn').onclick = () => banner.classList.add('hidden');
}

function renderLabMonth() {
  _memoIndex = buildMemoIndex();
  renderLabCarryBanner();

  const { year, month } = S.monthContext;
  const weeks    = weeksInMonth(year, month, true);
  const allTasks = weeks.flatMap(w => w.tasks.map(t => ({ ...t, _wref: w.ref })));
  const done     = allTasks.filter(t => t.status === 'done').length;

  document.getElementById('mo-nav-title').textContent = monthLabel(year, month);
  document.getElementById('mo-nav-meta').textContent  = `${done} of ${allTasks.length} done`;

  const container = document.getElementById('week-blocks');

  if (!allTasks.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-glyph">⚗</div><p>Nothing in the lab this month.</p>${
      !S.viewOnly ? `<button class="btn-add" onclick="ensureWeek(_cwd);S.weekRef=_cwd.ref;openModal()">+ Start something</button>` : ''
    }</div>`;
    return;
  }

  container.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'task-cards';

  allTasks.forEach(t => {
    const card = document.createElement('div');
    card.className = `task-card${t.status === 'done' ? ' is-done' : ''}`;
    card.dataset.id   = t.id;
    card.dataset.wref = t._wref;
    card.innerHTML    = buildCardHtml(t);

    // Point S.weekRef at this card's week before every action dispatch
    card.querySelectorAll('[data-a]').forEach(el => {
      el.addEventListener('click', e => {
        e.stopPropagation();
        const a = el.dataset.a;
        if (a === 'openmemo') { _noteOpenedFromTask = true; openNoteView(+el.dataset.mid); return; }
        if (a === 'openmemomore') { _showMoreMemosDropdown(el, +card.dataset.id); return; }
        S.weekRef = card.dataset.wref;
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

    wrap.appendChild(card);
  });

  container.appendChild(wrap);
}

function renderMonth() {
  if (S.context === 'lab') { renderLabMonth(); return; }

  const { year, month } = S.monthContext;
  const weeks  = weeksInMonth(year, month);
  const all    = weeks.flatMap(w => w.tasks);
  const done   = all.filter(t => t.status === 'done').length;

  document.getElementById('mo-nav-title').textContent = monthLabel(year, month);
  document.getElementById('mo-nav-meta').textContent  = `${done} of ${all.length} tasks done`;

  if (!weeks.length) {
    document.getElementById('week-blocks').innerHTML = `<div class="empty-state"><div class="empty-glyph">◦</div><p>No weeks in ${monthLabel(year,month)}.</p></div>`;
    return;
  }

  document.getElementById('week-blocks').innerHTML = weeks.map(week => {
    const d   = week.tasks.filter(t => t.status === 'done').length;
    const tot = week.tasks.length;
    const pct = tot ? Math.round(d / tot * 100) : 0;
    const isCurrentWeek = week.ref === S.currRef;
    const open = week.ref === S.weekRef;

    const rows = tot
      ? week.tasks.map(t => {
          const ms  = fmtMeetShort(t.nextMeeting);
          const dc  = daysClass(t.nextMeeting);
          const dn  = daysText(t.nextMeeting);
          return `<div class="mrow ${t.status==='done'?'is-done':''}" data-ref="${week.ref}" data-tid="${t.id}">
            <div class="mr-rank">${t.rank}</div>
            <div class="mr-title">${esc(t.title)}</div>
            <div class="mr-meet">${ms||'—'}</div>
            <div class="mr-dr ${dc}">${dn}</div>
            <div><span class="s-pill ${t.status}" style="pointer-events:none;font-size:11px;padding:2px 8px"><span class="s-dot"></span>${STATUS_LABEL[t.status]}</span></div>
          </div>`;
        }).join('')
      : `<div style="padding:10px 16px;font-size:12.5px;color:var(--text-3)">No tasks this week</div>`;

    return `
      <div class="week-block">
        <div class="wb-hdr ${open?'open':''}" data-ref="${week.ref}">
          <span class="wb-wref">${week.wref}</span>
          <span class="wb-label">${weekLabelShort(week.startDate, week.endDate)}</span>
          ${isCurrentWeek?`<span class="wb-curr">current</span>`:''}
          <div class="wb-prog">
            <div class="wb-bar"><div class="wb-fill" style="width:${pct}%"></div></div>
            <span class="wb-count">${d}/${tot}</span>
          </div>
          <span class="wb-chev ${open?'open':''}">▶</span>
        </div>
        <div class="wb-body ${open?'open':''}">${rows}</div>
      </div>`;
  }).join('');

  document.getElementById('week-blocks').querySelectorAll('.wb-hdr').forEach(el => {
    el.addEventListener('click', () => {
      const body = el.nextElementSibling, chev = el.querySelector('.wb-chev');
      const o = !body.classList.contains('open');
      body.classList.toggle('open', o); el.classList.toggle('open', o); chev.classList.toggle('open', o);
    });
  });
  document.getElementById('week-blocks').querySelectorAll('.mrow[data-ref]').forEach(el => {
    el.addEventListener('click', () => jumpToTask(el.dataset.ref, +el.dataset.tid));
  });
}

function jumpToTask(weekRef, taskId) {
  S.weekRef = weekRef;
  const w = getWeek(weekRef);
  if (w) {
    const d = new Date(w.startDate + 'T00:00:00');
    S.monthContext = { year: d.getFullYear(), month: d.getMonth() + 1 };
  }
  setView('week');
  requestAnimationFrame(() => {
    const card = document.querySelector(`.task-card[data-id="${taskId}"]`);
    if (!card) return;
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.classList.add('card-highlight');
    card.addEventListener('animationend', () => card.classList.remove('card-highlight'), { once: true });
  });
}
