/* Round timer: get-ready countdown, rounds and rests, with a bell, a 10-second warning,
   vibration, and the screen kept awake while it runs. Route: #/timer or #/timer/ROUNDS-WORKSECS-RESTSECS */

const timer = { phase: 'idle', round: 1, left: 0, endsAt: 0, running: false, warned: false };
const PREP = 5;

const fmtClock = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const tset = () => state.timer;

// Start fresh with these settings (from a drill link or the settings form)
function timerSetup(rounds, work, rest) {
  state.timer = { rounds, work, rest }; save();
  timerReset();
}
function timerReset() {
  Object.assign(timer, { phase: 'idle', round: 1, left: tset().work, running: false, warned: false });
  releaseWake();
}

/* ---------- Sounds, vibration, wake lock ---------- */

let actx, wake;
// A short bell made with the Web Audio API, so there's no sound file to download
function bell(times = 1, pitch = 880) {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    for (let i = 0; i < times; i++) {
      const t = actx.currentTime + i * 0.32, o = actx.createOscillator(), g = actx.createGain();
      o.type = 'triangle'; o.frequency.value = pitch;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.6, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      o.connect(g).connect(actx.destination); o.start(t); o.stop(t + 0.3);
    }
  } catch (e) { /* no sound available */ }
  if (times && navigator.vibrate) navigator.vibrate(times > 1 ? [250, 120, 250] : 400);
}
async function keepAwake() {
  try { if ('wakeLock' in navigator && !wake) wake = await navigator.wakeLock.request('screen'); } catch (e) { /* not allowed */ }
}
function releaseWake() { if (wake) { wake.release().catch(() => {}); wake = null; } }
// Phones drop the wake lock when you switch apps; take it back when you return
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && timer.running) { wake = null; keepAwake(); }
});

/* ---------- Ticking ---------- */

function nextPhase() {
  const s = tset();
  if (timer.phase === 'prep' || timer.phase === 'rest') {
    if (timer.phase === 'rest') timer.round++;
    timer.phase = 'work'; timer.left = s.work; timer.warned = false; bell(1);
  } else if (timer.round >= s.rounds) {
    timer.phase = 'done'; timer.running = false; timer.left = 0; bell(3); releaseWake();
    return;
  } else if (s.rest > 0) {
    timer.phase = 'rest'; timer.left = s.rest; bell(2, 660);
  } else {
    timer.round++; timer.left = s.work; timer.warned = false; bell(1);
  }
  timer.endsAt = Date.now() + timer.left * 1000;
}

function timerTick() {
  if (!timer.running) return;
  // Loop in case the phone slept through more than one phase
  while (timer.running && Date.now() >= timer.endsAt) nextPhase();
  if (!timer.running) return paintTimer();
  timer.left = Math.ceil((timer.endsAt - Date.now()) / 1000);
  if (timer.phase === 'work' && timer.left <= 10 && !timer.warned && tset().work > 20) { timer.warned = true; bell(2, 1320); }
  paintTimer();
}
setInterval(timerTick, 200);

function timerToggle() {
  if (timer.phase === 'done') timerReset();
  if (timer.running) {
    timer.running = false; timer.left = Math.max(1, Math.ceil((timer.endsAt - Date.now()) / 1000)); releaseWake();
  } else {
    if (timer.phase === 'idle') { timer.phase = 'prep'; timer.left = PREP; }
    timer.running = true; timer.endsAt = Date.now() + timer.left * 1000; keepAwake();
    bell(0); // wakes up the sound system during the tap, so later bells can play
  }
  paintTimer();
}

/* ---------- Screen ---------- */

const PHASE_LABEL = { idle: 'Ready when you are', prep: 'Get ready', work: 'Fight!', rest: 'Rest', done: 'Done. Great work!' };

function phaseLength() {
  const s = tset();
  return { prep: PREP, work: s.work, rest: s.rest, idle: s.work, done: 1 }[timer.phase];
}

function timerScreen(arg) {
  const m = /^(\d+)-(\d+)-(\d+)$/.exec(arg || '');
  if (m && !timer.running && timer.phase !== 'prep') {
    const [r, w, rest] = m.slice(1).map(Number);
    const s = tset();
    if (s.rounds !== r || s.work !== w || s.rest !== rest || timer.phase === 'done') timerSetup(r, w, rest);
  }
  if (timer.phase === 'idle') timer.left = tset().work;
  const s = tset();
  const opt = (vals, cur, label) => vals.map(v => `<option value="${v}" ${v === cur ? 'selected' : ''}>${label(v)}</option>`).join('');
  return `<button class="back" data-act="timer-back">‹ Back</button>
  <h1 class="title">Round timer</h1>
  <section class="card timer" id="tmr">
    <div class="ring"><svg viewBox="0 0 200 200" aria-hidden="true"><circle class="track" cx="100" cy="100" r="88"/>
      <circle class="prog" cx="100" cy="100" r="88" pathLength="100"/></svg>
      <div class="ring-in"><b class="t-left"></b><span class="t-phase"></span></div></div>
    <p class="t-round"></p>
    <div class="t-btns"><button class="btn primary t-go" data-act="timer-go"></button>
      <button class="btn" data-act="timer-reset">Reset</button></div>
  </section>
  <form class="card" data-form="timer"><h2>Rounds and times</h2>
    <div class="grid3">
      <label>Rounds<select name="rounds">${opt([1, 2, 3, 4, 5, 6, 8, 10, 12], s.rounds, v => v)}</select></label>
      <label>Round<select name="work">${opt([30, 60, 90, 120, 180, 240, 300], s.work, fmtClock)}</select></label>
      <label>Rest<select name="rest">${opt([0, 15, 30, 45, 60, 90, 120], s.rest, v => v ? fmtClock(v) : 'None')}</select></label>
    </div>
    <button class="btn wide">Set timer</button>
    <p class="muted small">Bell at the start and end of each round, a double beep with 10 seconds left. Turn your volume up. The screen stays on while the timer runs.</p>
  </form>`;
}

// Updates the timer card in place (no full re-render), so it can tick smoothly
function paintTimer() {
  const el = document.getElementById('tmr');
  if (!el) return;
  const s = tset(), len = phaseLength() || 1;
  el.dataset.phase = timer.phase;
  el.querySelector('.t-left').textContent = fmtClock(Math.max(0, timer.left));
  el.querySelector('.t-phase').textContent = PHASE_LABEL[timer.phase];
  el.querySelector('.t-round').textContent = timer.phase === 'done'
    ? `${s.rounds} ${s.rounds === 1 ? 'round' : 'rounds'} finished` : `Round ${timer.round} of ${s.rounds}`;
  el.querySelector('.prog').style.strokeDashoffset = timer.phase === 'idle' || timer.phase === 'done' ? 0 : 100 - (timer.left / len) * 100;
  el.querySelector('.t-go').textContent = timer.running ? 'Pause' : timer.phase === 'idle' ? 'Start' : timer.phase === 'done' ? 'Start again' : 'Resume';
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act^="timer-"]');
  if (!el) return;
  switch (el.dataset.act) {
    case 'timer-go': timerToggle(); break;
    case 'timer-reset': timerReset(); paintTimer(); break;
    case 'timer-back': history.length > 1 ? history.back() : (location.hash = '#/train'); break;
    case 'timer-open': location.hash = `#/timer/${el.dataset.r}-${el.dataset.w}-60`; break;
  }
});

// Drill doses like "3 rounds × 2 min" get a timer button
function drillTimerBtn(dose) {
  const m = /(\d+) rounds × (\d+) min/.exec(dose);
  return m ? `<button class="tbtn" data-act="timer-open" data-r="${m[1]}" data-w="${m[2] * 60}" aria-label="Open the round timer for ${m[1]} rounds of ${m[2]} minutes">⏱</button>` : '';
}
