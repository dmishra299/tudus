// ════════════════════════════════════════════════════════
// 8. MOUSE DRAG & DROP
// ════════════════════════════════════════════════════════
const drag = { active:false, srcId:null, ghost:null, targetId:null, targetBefore:true, offsetY:0 };

function showInd(refEl, before) {
  removeInd();
  const ind = document.createElement('div');
  ind.className = 'drag-ind'; ind.id = 'drag-ind';
  refEl.parentNode.insertBefore(ind, before ? refEl : refEl.nextSibling);
}
function removeInd() { const el = document.getElementById('drag-ind'); if (el) el.remove(); }

function initDrag(card, taskId) {
  card.addEventListener('mousedown', e => {
    if (S.viewOnly || e.button !== 0) return;
    if (e.target.closest('button, a, input, textarea, .card-notes-panel, .meet-section')) return;
    e.preventDefault();
    const rect = card.getBoundingClientRect();
    drag.active = true; drag.srcId = taskId; drag.offsetY = e.clientY - rect.top;
    clearTimeout(_tooltipTimer); notesTooltip.classList.remove('show');
    const g = card.cloneNode(true);
    Object.assign(g.style, {
      position:'fixed', top:rect.top+'px', left:rect.left+'px', width:rect.width+'px',
      zIndex:'1000', pointerEvents:'none', opacity:'0.92',
      boxShadow:'0 16px 48px rgba(0,0,0,.22)', transform:'rotate(.6deg) scale(1.015)',
      transition:'none', margin:'0', borderRadius:'8px',
    });
    document.body.appendChild(g);
    drag.ghost = g;
    card.classList.add('is-ghost');
    document.body.style.userSelect = 'none';
    document.body.style.cursor     = 'grabbing';
  });
}

document.addEventListener('mousemove', e => {
  if (!drag.active || !drag.ghost) return;
  drag.ghost.style.top = (e.clientY - drag.offsetY) + 'px';
  const cards = [...document.querySelectorAll('.task-card')].filter(c => +c.dataset.id !== drag.srcId);
  drag.targetId = null;
  for (const c of cards) {
    const r = c.getBoundingClientRect();
    if (e.clientY >= r.top - 6 && e.clientY <= r.bottom + 6) {
      const before = e.clientY < r.top + r.height / 2;
      showInd(c, before); drag.targetId = +c.dataset.id; drag.targetBefore = before; break;
    }
  }
  if (!drag.targetId && cards.length) {
    const last = cards[cards.length - 1];
    if (e.clientY > last.getBoundingClientRect().bottom) {
      showInd(last, false); drag.targetId = +last.dataset.id; drag.targetBefore = false;
    }
  }
});

document.addEventListener('mouseup', () => {
  if (!drag.active) return;
  if (drag.ghost) { drag.ghost.remove(); drag.ghost = null; }
  removeInd();
  document.body.style.userSelect = '';
  document.body.style.cursor     = '';
  if (drag.targetId && drag.targetId !== drag.srcId) {
    dropTask(drag.srcId, drag.targetId, drag.targetBefore);
  } else {
    renderCurrent();
  }
  drag.active = false; drag.srcId = null; drag.targetId = null;
});

function dropTask(srcId, tgtId, before) {
  const week = getWeek(S.weekRef); if (!week) return;
  const fi = week.tasks.findIndex(t => t.id === srcId);
  const [mv] = week.tasks.splice(fi, 1);
  let ti = week.tasks.findIndex(t => t.id === tgtId);
  if (!before) ti++;
  week.tasks.splice(ti, 0, mv);
  week.tasks.forEach((t, i) => t.rank = i + 1);
  save(); renderCurrent(); toast('Priority updated');
}
