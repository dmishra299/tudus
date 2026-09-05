// ════════════════════════════════════════════════════════
// 4. STATE
// ════════════════════════════════════════════════════════
let store = null; // populated by async init below

const _cwd   = getISOWeekData(new Date());
const _now   = new Date();
const S = {
  view:         'week',
  weekRef:      _cwd.ref,
  currRef:      _cwd.ref,   // always today's week — never changes
  viewOnly:     false,
  editId:       null,
  monthContext: { year: _now.getFullYear(), month: _now.getMonth() + 1 },
  context:      'work',     // 'work' | 'lab'
};
