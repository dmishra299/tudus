// ════════════════════════════════════════════════════════
// 5. WEEK MANAGEMENT
// ════════════════════════════════════════════════════════
function getWeek(ref)   { return store.weeks.find(w => w.ref === ref); }
function allWeeks()     { return [...store.weeks].sort((a,b) => a.startDate.localeCompare(b.startDate)); }

function ensureWeek(data) {
  let w = getWeek(data.ref);
  if (!w) {
    w = { ref:data.ref, wref:data.wref, startDate:data.startDate, endDate:data.endDate, carriedFrom:null, tasks:[] };
    store.weeks.push(w);
    store.weeks.sort((a,b) => a.startDate.localeCompare(b.startDate));
    save();
  }
  return w;
}
