// ════════════════════════════════════════════════════════
// 3. STORAGE
// ════════════════════════════════════════════════════════
const STORAGE_KEY = 'tudus-v1';   // legacy key — kept for migration only
const LS_WORK     = 'tudus-work-v1';
const LS_LAB      = 'tudus-lab-v1';
function lsKey() { return S.context === 'lab' ? LS_LAB : LS_WORK; }
// true when served via node server.js (http://localhost:3003)
const SERVER_MODE = location.protocol === 'http:' || location.protocol === 'https:';

let _needsMigration = false; // set when server is live but data file doesn't exist yet

async function load(ctx) {
  const key = ctx === 'lab' ? LS_LAB : LS_WORK;
  if (SERVER_MODE) {
    try {
      const r = await fetch('/data?ctx=' + ctx, { cache: 'no-store' });
      if (r.ok) {
        const d = await r.json();
        if (d && d.version === 1) {
          localStorage.setItem(key, JSON.stringify(d));
          return d;
        }
        if (ctx === 'work') _needsMigration = true;
      }
    } catch (_) {}
  }
  // For work: try new key, fall back to legacy key for migration
  try {
    const raw = localStorage.getItem(key) || (ctx === 'work' ? localStorage.getItem(STORAGE_KEY) : null);
    if (raw) {
      const d = JSON.parse(raw);
      if (d && d.version === 1) return d;
    }
  } catch (_) {}
  // Lab starts empty; work seeds with real tasks
  if (ctx === 'lab') {
    return { version:1, nextId:1, settings:{ theme:store ? store.settings.theme : 'system', dismissedCarry:{} }, weeks:[], notes:[] };
  }
  return JSON.parse(JSON.stringify(SEED));
}

function save() {
  localStorage.setItem(lsKey(), JSON.stringify(store));
  if (SERVER_MODE) {
    fetch('/data?ctx=' + S.context, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(store),
    }).catch(() => {});
  }
}

function exportData() {
  const now  = new Date();
  const date = toISO(now);
  const blob = new Blob([JSON.stringify(store, null, 2)], {type:'application/json'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `tudus-${S.context}-${date}.json`;
  a.click(); URL.revokeObjectURL(url);
  toast('Backup downloaded');
}

function importData(file) {
  const taskCount = store ? store.weeks.reduce((n, w) => n + w.tasks.length, 0) : 0;
  const migrationActive = !document.getElementById('migrate-banner').classList.contains('hidden');
  function doImport() {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const d = JSON.parse(e.target.result);
        if (!d || d.version !== 1 || !Array.isArray(d.weeks)) throw new Error('Invalid');
        store = d; save();
        document.getElementById('migrate-banner').classList.add('hidden');
        // Reset nav to current week
        const cw = getISOWeekData(new Date());
        S.weekRef = cw.ref;
        const cDate = new Date(cw.startDate + 'T00:00:00');
        S.monthContext = { year: cDate.getFullYear(), month: cDate.getMonth() + 1 };
        setView('week');
        toast('Data restored from backup');
      } catch (_) {
        toast('Import failed — invalid file');
      }
    };
    reader.readAsText(file);
  }
  if (!migrationActive && taskCount > 0) {
    showConfirm(
      'Import will replace all current data (' + taskCount + ' task' + (taskCount !== 1 ? 's' : '') +
      ' across ' + store.weeks.length + ' week' + (store.weeks.length !== 1 ? 's' : '') +
      ').\n\nExport first if you want a backup.',
      'Replace data', doImport
    );
    return;
  }
  doImport();
}

function showMigrationBanner() {
  const banner = document.getElementById('migrate-banner');
  const code   = s => `<code style="font-family:monospace;background:var(--surface-2);padding:1px 5px;border-radius:3px;font-size:11.5px">${s}</code>`;
  banner.innerHTML =
    `<span>No data file found. If you have tasks in ${code('file://')} mode — open ${code('index.html')} directly, click&nbsp;⬇&nbsp;Export, then import the file here.</span>`
    + `<div style="display:flex;gap:6px;margin-left:auto;flex-shrink:0">`
    + `<button class="carry-dismiss" id="mgr-import" style="font-weight:600;color:var(--accent)">⬆&nbsp;Import now</button>`
    + `<button class="carry-dismiss" id="mgr-fresh">Start fresh</button>`
    + `</div>`;
  banner.classList.remove('hidden');
  document.getElementById('mgr-import').onclick = () => document.getElementById('file-input').click();
  document.getElementById('mgr-fresh').onclick  = () => {
    banner.classList.add('hidden');
    save(); // write seed data to file so banner never reappears
    toast('Starting fresh — data saved to data/tudus-work.json');
  };
}

async function switchContext(ctx) {
  if (ctx === S.context) return;
  save(); // persist current context before switching
  S.context = ctx;
  localStorage.setItem('tudus-ctx', ctx);
  document.documentElement.dataset.ctx = ctx === 'lab' ? 'lab' : '';
  if (ctx !== 'lab') delete document.documentElement.dataset.ctx;
  store = await load(ctx);
  store.notes = store.notes || []; // backward compat
  // Carry theme preference across contexts
  applyTheme(store.settings.theme);
  // Reset view to current week
  S.weekRef = S.currRef;
  const _now = new Date();
  S.monthContext = { year: _now.getFullYear(), month: _now.getMonth() + 1 };
  ensureWeek(_cwd);
  setView('week');
  toast(ctx === 'lab' ? 'Lab context — notes-forward, no carry' : 'Work context');
}
