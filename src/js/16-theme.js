// ════════════════════════════════════════════════════════
// 16. THEME
// ════════════════════════════════════════════════════════
const THEME_CYCLE = ['system','light','dark'];
function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'light')  root.setAttribute('data-theme', 'light');
  else if (theme === 'dark') root.setAttribute('data-theme', 'dark');
  else root.removeAttribute('data-theme');
}
function cycleTheme() {
  const cur = store.settings.theme || 'system';
  const nxt = THEME_CYCLE[(THEME_CYCLE.indexOf(cur) + 1) % THEME_CYCLE.length];
  store.settings.theme = nxt;
  save(); applyTheme(nxt); syncHeader();
  toast({ system:'Theme: System', light:'Theme: Light', dark:'Theme: Dark' }[nxt]);
}
