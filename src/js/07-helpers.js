// ════════════════════════════════════════════════════════
// 7. HELPERS
// ════════════════════════════════════════════════════════
function fmtMeet(ds) {
  if (!ds) return null;
  const d  = new Date(ds);
  const mo = d.toLocaleString('en-US', {month:'short'});
  const h  = d.getHours()%12||12, m = d.getMinutes(), ap = d.getHours()>=12?'pm':'am';
  return `${mo} ${d.getDate()}, ${h}${m?':'+String(m).padStart(2,'0'):''}${ap}`;
}
function fmtMeetShort(ds) {
  if (!ds) return null;
  const d = new Date(ds);
  return `${d.toLocaleString('en-US',{month:'short'})} ${d.getDate()}`;
}
function getDays(ds) {
  if (!ds) return null;
  const now = new Date(); now.setHours(0,0,0,0);
  const tgt = new Date(ds); tgt.setHours(0,0,0,0);
  return Math.ceil((tgt - now) / 864e5);
}
// Business days (Mon–Fri) remaining; negative/zero pass through as calendar days.
function getBizDays(ds) {
  const cal = getDays(ds);
  if (cal === null || cal <= 0) return cal;
  const now = new Date(); now.setHours(0,0,0,0);
  const tgt = new Date(ds); tgt.setHours(0,0,0,0);
  let biz = 0;
  const d = new Date(now); d.setDate(d.getDate() + 1);
  while (d <= tgt) { const wd = d.getDay(); if (wd !== 0 && wd !== 6) biz++; d.setDate(d.getDate() + 1); }
  return biz;
}
function daysHtml(ds) {
  const n = getDays(ds);
  if (n === null) return '';
  if (n  <  0)   return `<span class="dr dr-over">${Math.abs(n)}d overdue</span>`;
  if (n === 0)   return `<span class="dr dr-today">Today</span>`;
  const b = getBizDays(ds);
  if (b === 1)   return `<span class="dr dr-soon">Tomorrow</span>`;
  if (b <= 4)    return `<span class="dr dr-soon">${b}d</span>`;
  return `<span class="dr dr-norm">${b}d</span>`;
}
function daysClass(ds) {
  const n = getDays(ds);
  if (n === null) return '';
  if (n <  0)  return 'dr-over';
  if (n === 0) return 'dr-today';
  const b = getBizDays(ds);
  if (b <= 4)  return 'dr-soon';
  return '';
}
function daysText(ds) {
  const n = getDays(ds);
  if (n === null) return '—';
  if (n < 0)   return `${Math.abs(n)}d over`;
  if (n === 0) return 'Today';
  const b = getBizDays(ds);
  if (b === 1) return 'Tmr';
  return `${b}d`;
}

let _toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

const STATUSES     = ['todo','in-prog','done'];
const STATUS_LABEL = {todo:'Todo','in-prog':'In Progress',done:'Done'};
function nextStatus(s) { return STATUSES[(STATUSES.indexOf(s)+1) % STATUSES.length]; }

let _confirmCb = null;
function showConfirm(msg, okLabel, cb) {
  document.getElementById('confirm-msg').textContent = msg;
  const ok = document.getElementById('confirm-ok');
  ok.textContent = okLabel || 'Confirm';
  _confirmCb = cb;
  document.getElementById('confirm-overlay').classList.remove('hidden');
  setTimeout(() => ok.focus(), 40);
}
function closeConfirm() {
  document.getElementById('confirm-overlay').classList.add('hidden');
  _confirmCb = null;
}
