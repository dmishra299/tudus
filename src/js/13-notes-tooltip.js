// ════════════════════════════════════════════════════════
// 13. NOTES TOOLTIP
// ════════════════════════════════════════════════════════
const notesTooltip = document.getElementById('notes-tooltip');
let _tooltipTimer = null;

function showNotesTooltip(panelEl, text, taskId) {
  if (drag.active) return;
  clearTimeout(_tooltipTimer);
  let html = formatNotes(text);
  const memos = (taskId && _memoIndex) ? (_memoIndex[taskId] || []) : [];
  if (memos.length > 0) {
    html += '<div class="ntt-memo-link">↗ ' + esc(memos[0].title || 'Untitled')
      + (memos.length > 1 ? ' <span style="color:var(--text-3)">+' + (memos.length - 1) + ' more</span>' : '')
      + '</div>';
  }
  notesTooltip.innerHTML = html;
  notesTooltip.classList.add('show');
  const r    = panelEl.getBoundingClientRect();
  const gap  = 10;
  const tw   = 500;
  // Prefer left of the panel; fall back to right if clipped
  const left = r.left - tw - gap >= 8 ? r.left - tw - gap : r.right + gap;
  notesTooltip.style.left = Math.max(8, left) + 'px';
  notesTooltip.style.top  = r.top + 'px';
  // Vertical clamp after paint so height is known
  requestAnimationFrame(() => {
    const th  = notesTooltip.offsetHeight;
    let   top = r.top;
    if (top + th > window.innerHeight - 8) top = window.innerHeight - th - 8;
    if (top < 8) top = 8;
    notesTooltip.style.top = top + 'px';
  });
}

function hideNotesTooltip() {
  _tooltipTimer = setTimeout(() => notesTooltip.classList.remove('show'), 120);
}

notesTooltip.addEventListener('mouseenter', () => clearTimeout(_tooltipTimer));
notesTooltip.addEventListener('mouseleave', () => notesTooltip.classList.remove('show'));
