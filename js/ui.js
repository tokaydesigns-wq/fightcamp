/* FightCamp screens (Home, Train, Food, Camp), router, clicks and forms.
   The Learn screens live in learn.js. */

let foodDay = ymd();

const ROUTES = { home: homeScreen, train: trainScreen, food: foodScreen, camp: campScreen, learn: learnScreen, p: programScreen };

function render() {
  const [name = 'home', arg] = location.hash.replace(/^#\/?/, '').split('/');
  const fn = ROUTES[name] || homeScreen;
  $('#app').innerHTML = fn(arg && decodeURIComponent(arg));
  const tab = name === 'p' ? 'learn' : (ROUTES[name] ? name : 'home');
  document.querySelectorAll('#tabs a').forEach(a => a.classList.toggle('on', a.dataset.tab === tab));
}
window.addEventListener('hashchange', () => { render(); scrollTo(0, 0); });

/* ---------- Home ---------- */

function homeScreen() {
  const wk = weekTotals(1)[0], day = dayFood(ymd()), p = state.programs[0];
  const c = state.camp && campStatus(state.camp);
  return `<header class="hero"><div><p class="eyebrow">${esc(niceDate(ymd()))}</p><h1>FightCamp</h1></div>
    <img class="logo" src="icon.svg" alt=""></header>
  ${c ? `<a class="card camp-mini" href="#/camp"><div class="count"><b>${Math.max(c.daysOut, 0)}</b><span>${c.daysOut === 1 ? 'day' : 'days'}</span></div>
      <div><p class="eyebrow">${c.daysOut >= 0 ? 'To fight night' : 'Fight done'}</p><h2>${esc(c.phase.name)}</h2><p class="muted small">${esc(c.phase.goal)}</p></div></a>`
    : `<a class="card cta" href="#/camp"><span>Got a fight coming up?</span><b>Set your fight date ›</b></a>`}
  <a class="card" href="#/train"><h2>Training this week</h2>
    <div class="stats">${stat(wk.count, wk.count === 1 ? 'session' : 'sessions')}${stat(wk.mins, 'minutes')}${stat(streak(), 'day streak')}</div></a>
  <a class="card" href="#/food"><h2>Food today</h2>
    ${meter('Calories', day.kcal, state.targets.kcal)}${meter('Protein', day.protein, state.targets.protein, 'g')}</a>
  ${p ? programMini(p) : `<a class="card cta" href="#/learn"><span>Want to move like a pro?</span><b>Learn from a famous fighter ›</b></a>`}
  <div class="quick"><a class="btn primary" href="#/train">+ Log training</a><a class="btn" href="#/food">+ Log food</a></div>`;
}

function programMini(p) {
  const s = progStats(p), t = techById(p.techId);
  return `<a class="card" href="#/p/${p.id}"><p class="eyebrow">Your program</p><h2>${esc(t.name)}</h2>
    ${p.fighter ? `<p class="muted small">like ${esc(p.fighter)}</p>` : ''}
    <div class="bar"><i style="width:${s.pct}%"></i></div><p class="muted small">${s.done} of ${s.total} drills done</p></a>`;
}

/* ---------- Train ---------- */

function trainScreen() {
  const weeks = weekTotals(8);
  const avg = Math.round(weeks.slice(0, 7).reduce((t, w) => t + w.mins, 0) / 7);
  const list = [...state.sessions].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)).slice(0, 50);
  return `<h1 class="title">Training</h1>
  <form class="card" data-form="session"><h2>Log a session</h2>
    <div class="grid2">
      <label>Date<input type="date" name="date" value="${ymd()}" max="${ymd()}" required></label>
      <label>Type<select name="type">${SESSION_TYPES.map(t => `<option value="${t.id}">${esc(t.label)}</option>`).join('')}</select></label>
      <label>Minutes<input type="number" name="mins" inputmode="numeric" min="1" max="600" value="60" required></label>
      <label>Rounds <span class="muted">(optional)</span><input type="number" name="rounds" inputmode="numeric" min="0" max="99"></label>
    </div>
    <label>How hard was it? <b id="rpeOut">6</b>/10<input type="range" name="rpe" min="1" max="10" value="6"></label>
    <div class="scale muted small"><span>Easy</span><span>All-out</span></div>
    <label>Notes<textarea name="notes" rows="2" placeholder="What did you work on?"></textarea></label>
    <button class="btn primary wide">Save session</button></form>
  <section class="card"><h2>Last 8 weeks</h2>
    ${barChart(weeks.map(w => w.mins), weeks.map(w => shortDate(w.start)), 'Minutes trained each week')}
    <p class="muted small">Minutes trained each week (week starting)</p>
    <div class="stats">${stat(weeks.at(-1).mins, 'this week')}${stat(avg, 'avg/week before')}${stat(streak(), 'day streak')}</div></section>
  <section class="card"><h2>History</h2>
    ${list.length ? `<ul class="list">${list.map(sessionRow).join('')}</ul>` : '<p class="muted">No sessions yet. Log your first one above.</p>'}</section>`;
}

function sessionRow(s) {
  return `<li class="row"><div><b>${esc(typeLabel(s.type))}</b> <span class="muted small">${esc(niceDate(s.date))}</span>
    <p class="small">${s.mins} min${s.rounds ? ` · ${s.rounds} rounds` : ''} · effort ${s.rpe}/10</p>
    ${s.notes ? `<p class="small muted">${esc(s.notes)}</p>` : ''}</div>
    <button class="x" data-act="session-del" data-id="${s.id}" aria-label="Delete session">×</button></li>`;
}

/* ---------- Food ---------- */

function foodScreen() {
  const day = dayFood(foodDay), today = foodDay === ymd();
  const recent = recentMeals();
  const weights = [...state.weights].sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
  const last = weights.at(-1), weekAgo = weights.find(w => w.date >= addDays(ymd(), -7));
  const limit = state.camp && state.camp.limitKg;
  return `<h1 class="title">Food</h1>
  <div class="daynav"><button class="btn" data-act="food-day" data-d="-1" aria-label="Previous day">‹</button>
    <b>${today ? 'Today' : esc(niceDate(foodDay))}</b>
    <button class="btn" data-act="food-day" data-d="1" ${today ? 'disabled' : ''} aria-label="Next day">›</button></div>
  <section class="card">${meter('Calories', day.kcal, state.targets.kcal)}${meter('Protein', day.protein, state.targets.protein, 'g')}</section>
  <form class="card" data-form="meal"><h2>Add food</h2>
    <label>What did you eat?<input name="name" required placeholder="e.g. Chicken and rice" autocomplete="off"></label>
    <div class="grid2"><label>Calories<input type="number" name="kcal" inputmode="numeric" min="0" max="5000"></label>
    <label>Protein (g)<input type="number" name="protein" inputmode="numeric" min="0" max="400"></label></div>
    <button class="btn primary wide">Add</button>
    ${recent.length ? `<p class="muted small">Eat it again:</p><div class="chips">${recent.map((m, i) =>
      `<button type="button" class="chip" data-act="meal-again" data-i="${i}">${esc(m.name)}</button>`).join('')}</div>` : ''}</form>
  <section class="card"><h2>${today ? 'Eaten today' : 'Eaten that day'}</h2>
    ${day.meals.length ? `<ul class="list">${day.meals.map(m => `<li class="row"><div><b>${esc(m.name)}</b>
      <p class="small muted">${+m.kcal || 0} kcal · ${+m.protein || 0} g protein</p></div>
      <button class="x" data-act="meal-del" data-id="${m.id}" aria-label="Delete">×</button></li>`).join('')}</ul>`
      : '<p class="muted">Nothing logged yet.</p>'}</section>
  <section class="card"><h2>Weight</h2>
    <form class="inline" data-form="weight"><input type="number" name="w" step="0.1" min="20" max="400" inputmode="decimal"
      placeholder="Today's weight (${state.unit})" required><button class="btn primary">Save</button></form>
    ${last ? `<div class="stats">${stat(fmtW(last.kg), 'latest')}${weekAgo && weekAgo !== last ? stat((last.kg - weekAgo.kg > 0 ? '+' : '') + fmtW(last.kg - weekAgo.kg), 'this week') : ''}
      ${limit ? stat(fmtW(Math.abs(last.kg - limit)), last.kg > limit ? 'over the limit' : 'under the limit') : ''}</div>` : ''}
    ${weights.length >= 2 ? lineChart(weights.map(w => ({ date: w.date, v: round1(fromKg(w.kg)) })), limit ? round1(fromKg(limit)) : null, 'Weight over time')
      : '<p class="muted small">Log your weight a couple of times to see a chart.</p>'}</section>
  <details class="card"><summary>Daily targets and units</summary>
    <form data-form="targets"><div class="grid2">
      <label>Calories a day<input type="number" name="kcal" value="${state.targets.kcal}" min="800" max="8000" required></label>
      <label>Protein a day (g)<input type="number" name="protein" value="${state.targets.protein}" min="20" max="500" required></label></div>
      <label>Weight unit<select name="unit"><option value="kg" ${state.unit === 'kg' ? 'selected' : ''}>Kilograms (kg)</option>
        <option value="lb" ${state.unit === 'lb' ? 'selected' : ''}>Pounds (lb)</option></select></label>
      <p class="muted small">Not sure? A common starting point for fighters is about 2 g of protein per kg of body weight. A coach or dietitian can set your calories.</p>
      <button class="btn primary wide">Save targets</button></form></details>`;
}

/* ---------- Camp ---------- */

function campScreen() {
  const c = state.camp;
  if (!c) return `<h1 class="title">Fight camp</h1>
    <section class="card"><h2>Got a fight booked?</h2><p>Add the date and you'll get a countdown and tips for each stage of camp, from the first hard weeks to the weigh-in.</p></section>
    ${campForm({})}${phaseList(null)}`;
  const s = campStatus(c), pace = cutPace(c), ph = s.phase;
  return `<h1 class="title">Fight camp</h1>
  <section class="card countdown"><div class="count big"><b>${Math.max(s.daysOut, 0)}</b><span>${s.daysOut === 1 ? 'day to go' : s.daysOut < 0 ? 'fight done' : 'days to go'}</span></div>
    <div><h2>${c.opponent ? 'vs ' + esc(c.opponent) : 'Fight night'}</h2><p class="muted">${esc(niceDate(c.date))}${c.cls ? ' · ' + esc(c.cls) : ''}</p>
    ${c.limitKg ? `<p class="small">Weight limit: <b>${fmtW(c.limitKg)}</b></p>` : ''}</div></section>
  ${pace ? weightPace(pace) : c.limitKg ? '<p class="card note">Log your weight on the Food tab to see how you\'re tracking against the limit.</p>' : ''}
  <section class="card phase now"><p class="eyebrow">Right now · ${esc(ph.when)}</p><h2>${esc(ph.name)}</h2><p>${esc(ph.goal)}</p>${phaseBody(ph)}</section>
  ${phaseList(ph)}
  <details class="card"><summary>Change fight details</summary>${campForm(c, true)}
    <button class="btn ghost wide danger" data-act="camp-clear">Remove this fight</button></details>`;
}

function weightPace(p) {
  if (p.toGo <= 0) return `<p class="card note good">You're already on weight. Keep it steady and keep eating well.</p>`;
  // Up to 1% a week is the safe pace in the camp tips; over 1.5% gets a warning
  const fast = p.pct > 1.5;
  const msg = fast ? 'That\'s faster than the safe pace of about 1% a week. Talk to your coach about the plan, or think about a different weight class.'
    : p.pct > 1 ? 'That\'s a little quicker than the ideal 1% a week, so start steady now and avoid a big cut at the end.'
    : 'That\'s a sensible pace.';
  return `<section class="card ${fast ? 'note warn' : 'note'}"><b>${fmtW(p.toGo)} to go</b>
    <p class="small">That's about ${fmtW(p.perWeek)} a week (${round1(p.pct)}% of your body weight). ${msg}</p></section>`;
}

const phaseBody = ph => `<h3>Training</h3><ul>${ph.train.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
  <h3>Food and weight</h3><ul>${ph.food.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
  <h3>Tips</h3><ul>${ph.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul>`;

function phaseList(current) {
  return `<section class="card"><h2>${current ? 'The whole camp' : 'How a camp works'}</h2>
    ${PHASES.map(p => `<details class="phase-row ${p === current ? 'on' : ''}"><summary><b>${esc(p.name)}</b><span class="muted small">${esc(p.when)}</span></summary>
      <p>${esc(p.goal)}</p>${phaseBody(p)}</details>`).join('')}</section>`;
}

function campForm(c, inline) {
  const lim = c.limitKg ? round1(fromKg(c.limitKg)) : '';
  return `<form class="${inline ? '' : 'card'}" data-form="camp">${inline ? '' : '<h2>Fight details</h2>'}
    <label>Fight date<input type="date" name="date" value="${esc(c.date || '')}" min="${ymd()}" required></label>
    <label>Opponent <span class="muted">(optional)</span><input name="opponent" value="${esc(c.opponent || '')}" autocomplete="off"></label>
    <div class="grid2"><label>Weight class <span class="muted">(optional)</span><input name="cls" value="${esc(c.cls || '')}" placeholder="e.g. Lightweight"></label>
    <label>Weight limit (${state.unit})<input type="number" name="limit" step="0.1" min="20" max="400" value="${lim}" inputmode="decimal"></label></div>
    <button class="btn primary wide">${inline ? 'Save changes' : 'Start my camp'}</button></form>`;
}

/* ---------- Clicks ---------- */

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act;
  if (learnAct(act, el)) return;
  switch (act) {
    case 'session-del':
      if (confirm('Delete this session?')) { state.sessions = state.sessions.filter(s => s.id !== el.dataset.id); save(); render(); }
      break;
    case 'meal-del': state.meals = state.meals.filter(m => m.id !== el.dataset.id); save(); render(); break;
    case 'meal-again': {
      const m = recentMeals()[+el.dataset.i];
      state.meals.push({ id: uid(), date: foodDay, name: m.name, kcal: m.kcal, protein: m.protein }); save(); render();
      break;
    }
    case 'food-day': foodDay = addDays(foodDay, +el.dataset.d); if (foodDay > ymd()) foodDay = ymd(); render(); break;
    case 'camp-clear': if (confirm('Remove this fight?')) { state.camp = null; save(); render(); } break;
  }
});

document.addEventListener('input', e => {
  if (e.target.name === 'rpe') $('#rpeOut').textContent = e.target.value;
});

/* ---------- Forms ---------- */

document.addEventListener('submit', e => {
  const form = e.target.closest('[data-form]');
  if (!form) return;
  e.preventDefault();
  const f = Object.fromEntries(new FormData(form));
  const num = v => v === '' || v == null ? 0 : +v;
  switch (form.dataset.form) {
    case 'session':
      state.sessions.push({ id: uid(), date: f.date, type: f.type, mins: num(f.mins), rounds: num(f.rounds), rpe: num(f.rpe), notes: f.notes.trim() });
      toast('Session saved. Nice work!');
      break;
    case 'meal':
      state.meals.push({ id: uid(), date: foodDay, name: f.name.trim(), kcal: num(f.kcal), protein: num(f.protein) });
      break;
    case 'weight': {
      const kg = Math.round(toKg(+f.w) * 100) / 100;
      state.weights = state.weights.filter(w => w.date !== ymd()).concat({ date: ymd(), kg });
      toast('Weight saved');
      break;
    }
    case 'targets':
      state.targets = { kcal: num(f.kcal), protein: num(f.protein) }; state.unit = f.unit;
      toast('Targets saved');
      break;
    case 'camp':
      state.camp = { date: f.date, opponent: f.opponent.trim(), cls: f.cls.trim(), limitKg: f.limit ? Math.round(toKg(+f.limit) * 100) / 100 : null, start: (state.camp && state.camp.start) || ymd() };
      toast('Camp is on. Let\'s go!');
      break;
    case 'learn': runLearn(f.q); return;
  }
  save(); render();
});

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.append(t);
  setTimeout(() => t.remove(), 2200);
}
