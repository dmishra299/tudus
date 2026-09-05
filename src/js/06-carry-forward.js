// ════════════════════════════════════════════════════════
// 6. CARRY-FORWARD
// ════════════════════════════════════════════════════════
function maybeCarryForwardFromMonth(fromYear, fromMonth) {
  // byEndDate=true: each week belongs to exactly one month (its endDate's month),
  // preventing boundary weeks from appearing as both source and target.
  const fromWeeks = weeksInMonth(fromYear, fromMonth, true);
  if (!fromWeeks.length) return 0;

  const openTasks = fromWeeks.flatMap(w => w.tasks.filter(t => t.status !== 'done'));
  if (!openTasks.length) return 0;

  // Bring into today's week (always the "current" landing zone in Lab)
  const target = ensureWeek(_cwd);

  // Dedup against all weeks in the current displayed month
  const { year: toY, month: toM } = S.monthContext;
  const toWeeks  = weeksInMonth(toY, toM, true);
  const existing = new Set(toWeeks.flatMap(w => w.tasks.map(t => t.title.trim())));

  const toCarry = openTasks.filter(t => !existing.has(t.title.trim()));
  if (!toCarry.length) return 0;

  toCarry.forEach(t => {
    target.tasks.push({
      ...JSON.parse(JSON.stringify(t)),
      id:      store.nextId++,
      rank:    target.tasks.length + 1,
      carried: true,
      status:  t.status === 'in-prog' ? 'in-prog' : 'todo',
    });
  });

  // Stay in the month the user was viewing (don't snap back to the source month).
  save();
  return toCarry.length;
}

function maybeCarryForward(fromRef, toRef) {
  const from = getWeek(fromRef);
  if (!from) return;
  const to   = ensureWeek(offsetWeekData(fromRef, 1));
  if (to.ref !== toRef) return;
  const openTasks = from.tasks.filter(t => t.status !== 'done');
  if (!openTasks.length) return;
  // Task-level dedup: skip tasks already present in `to` by title
  const existing = new Set(to.tasks.map(t => t.title.trim()));
  const toCarry  = openTasks.filter(t => !existing.has(t.title.trim()));
  if (!toCarry.length) return;
  toCarry.forEach(t => {
    to.tasks.push({
      ...JSON.parse(JSON.stringify(t)),
      id:            store.nextId++,
      rank:          to.tasks.length + 1,
      carried:       true,
      status:        t.status === 'in-prog' ? 'in-prog' : 'todo',
      carriedFromId: t.id,
    });
  });
  to.carriedFrom = fromRef;
  save();
}
