// ════════════════════════════════════════════════════════
// 15. HEADER SYNC
// ════════════════════════════════════════════════════════
function syncHeader() {
  const week      = getWeek(S.weekRef);
  const isCurrent = S.weekRef === S.currRef;
  const isPast    = week && week.endDate < toISO(new Date());

  // Week period labels
  document.getElementById('p-wref').textContent  = week ? week.wref : '';
  document.getElementById('p-label').textContent = week ? weekLabelFull(week.startDate, week.endDate) : '';
  document.getElementById('curr-badge').classList.toggle('hidden', !isCurrent);
  document.getElementById('period-wrap').className = 'period-wrap' + (isPast && !isCurrent ? ' is-past' : '');

  // Prev / next availability
  const sorted = allWeeks();
  const wi = sorted.findIndex(w => w.ref === S.weekRef);
  document.getElementById('btn-prev').disabled = wi <= 0;
  document.getElementById('btn-next').disabled = false; // forward always allowed — creates week on demand

  // Current Week button
  const tw = document.getElementById('btn-thisweek');
  tw.textContent = isCurrent ? '✓ Current Week' : 'Current Week';
  tw.classList.toggle('on-curr', isCurrent);

  // Current Month button
  const now = new Date();
  const isCurrentMonth = S.monthContext.year === now.getFullYear() && S.monthContext.month === now.getMonth() + 1;
  const cm = document.getElementById('btn-curr-month');
  cm.textContent = isCurrentMonth ? '✓ Current Month' : 'Current Month';
  cm.classList.toggle('on-curr', isCurrentMonth);

  // View toggle
  document.getElementById('btn-v-week').classList.toggle('active',  S.view === 'week');
  document.getElementById('btn-v-month').classList.toggle('active', S.view === 'month');

  // Nav section swap — Lab is always month nav; hide view toggle in Lab or Notes
  const isLab = S.context === 'lab';
  document.getElementById('nav-week').classList.toggle('hidden',  isLab || S.view !== 'week');
  document.getElementById('nav-month').classList.toggle('hidden', !isLab && S.view !== 'month');
  document.querySelector('.view-seg').classList.toggle('hidden', isLab || S.view === 'notes');

  // Month nav context
  document.getElementById('mo-nav-title').textContent = monthLabel(S.monthContext.year, S.monthContext.month);

  // View-only
  document.getElementById('btn-viewonly').classList.toggle('active', S.viewOnly);
  document.getElementById('vo-chip').classList.toggle('hidden',  !S.viewOnly);
  document.getElementById('btn-add').classList.toggle('hidden',   S.viewOnly || S.view === 'notes');

  // Context toggle (Notes is a top-level tab alongside Work / Lab)
  document.getElementById('btn-ctx-work').classList.toggle('active',  S.context !== 'lab' && S.view !== 'notes');
  document.getElementById('btn-ctx-lab').classList.toggle('active',   S.context === 'lab');
  document.getElementById('btn-ctx-notes').classList.toggle('active', S.view === 'notes');

  // Theme indicator
  const themes = { system:'◑', light:'☀', dark:'☽' };
  document.getElementById('btn-theme').textContent = themes[store.settings.theme] || '◑';
}
