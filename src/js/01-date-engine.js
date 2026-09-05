// ════════════════════════════════════════════════════════
// 1. DATE ENGINE
// ════════════════════════════════════════════════════════
function toISO(d) { return d.toISOString().slice(0, 10); }

function getISOWeekData(date) {
  const d   = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dow = d.getUTCDay() || 7;
  const thu = new Date(d); thu.setUTCDate(d.getUTCDate() + 4 - dow);
  const isoYear = thu.getUTCFullYear();
  const jan1    = new Date(Date.UTC(isoYear, 0, 1));
  const weekNum = Math.ceil(((thu - jan1) / 864e5 + 1) / 7);
  const mon     = new Date(d); mon.setUTCDate(d.getUTCDate() - (dow - 1));
  const fri     = new Date(mon); fri.setUTCDate(mon.getUTCDate() + 4);
  const wn      = String(weekNum).padStart(2, '0');
  return { isoYear, weekNum, ref: `${isoYear}-W${wn}`, wref: `W${wn}`, startDate: toISO(mon), endDate: toISO(fri) };
}

function weekLabelFull(sd, ed) {
  const s = new Date(sd + 'T00:00:00'), e = new Date(ed + 'T00:00:00');
  const sm = s.toLocaleString('en-US', {month:'short'}), em = e.toLocaleString('en-US', {month:'short'});
  if (sm === em) return `${sm} ${s.getDate()} – ${e.getDate()}, ${s.getFullYear()}`;
  return `${sm} ${s.getDate()} – ${em} ${e.getDate()}, ${e.getFullYear()}`;
}
function weekLabelShort(sd, ed) {
  const s = new Date(sd + 'T00:00:00'), e = new Date(ed + 'T00:00:00');
  const sm = s.toLocaleString('en-US', {month:'short'}), em = e.toLocaleString('en-US', {month:'short'});
  return sm === em ? `${sm} ${s.getDate()} – ${e.getDate()}` : `${sm} ${s.getDate()} – ${em} ${e.getDate()}`;
}
function monthLabel(year, month) { // month 1-indexed
  return new Date(year, month - 1, 1).toLocaleString('en-US', {month:'long', year:'numeric'});
}

function offsetWeekData(ref, delta) {
  const [yearStr, wStr] = ref.split('-W');
  const year = parseInt(yearStr), weekNum = parseInt(wStr);
  const jan4  = new Date(Date.UTC(year, 0, 4));
  const dow4  = jan4.getUTCDay() || 7;
  const w1Mon = new Date(jan4); w1Mon.setUTCDate(jan4.getUTCDate() - (dow4 - 1));
  const tMon  = new Date(w1Mon); tMon.setUTCDate(w1Mon.getUTCDate() + (weekNum - 1 + delta) * 7);
  return getISOWeekData(tMon);
}

function weeksInMonth(year, month, byEndDate = false) { // month 1-indexed
  const m   = String(month).padStart(2, '0'), y = String(year);
  const ms  = `${y}-${m}-01`;
  const ld  = new Date(year, month, 0).getDate();
  const me  = `${y}-${m}-${String(ld).padStart(2,'0')}`;
  // byEndDate: assign each week to exactly one month (the month its endDate falls in).
  // Used for Lab month view to prevent overlap-boundary weeks from appearing in two months.
  const pred = byEndDate
    ? w => w.endDate >= ms && w.endDate <= me
    : w => w.startDate <= me && w.endDate >= ms;
  return store.weeks.filter(pred)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}
