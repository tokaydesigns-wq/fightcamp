/* Animated technique demos, drawn in SVG. No video or images, so they work offline.
   'side' demos are a stick figure seen from the side (orthodox, facing right).
   'top' demos show feet from above, with the opponent at the top.
   Each demo is a loop of keyframes: [pose, milliseconds to get there, cue text, highlighted part]. */

// Side-view joints: head, neck, hip, lead elbow/fist (lE, lF), rear elbow/fist (rE, rF),
// lead knee/ankle (lK, lA), rear knee/ankle (rK, rA)
const GUARD = { head: [150, 56], neck: [150, 80], hip: [146, 150], lE: [172, 114], lF: [178, 86], rE: [136, 116], rF: [158, 80],
  lK: [172, 194], lA: [186, 236], rK: [128, 194], rA: [112, 236] };
const pose = changes => Object.assign({}, GUARD, changes);

const JAB = pose({ head: [157, 60], neck: [156, 83], hip: [150, 150], lE: [206, 86], lF: [244, 84], rE: [140, 116], rF: [164, 80],
  lK: [182, 194], lA: [198, 236], rK: [132, 194], rA: [116, 236] });
const CROSS = pose({ head: [163, 62], neck: [161, 84], hip: [151, 150], lE: [178, 112], lF: [172, 84], rE: [198, 88], rF: [242, 84],
  lK: [178, 194], lA: [188, 236], rK: [140, 197], rA: [124, 232] });
const HOOK = pose({ head: [154, 62], neck: [153, 84], hip: [147, 150], lE: [184, 82], lF: [212, 92], rF: [160, 80], lK: [176, 194] });
// Round kick: step out, then the leg swings up and round nearly straight (not a knee lift)
const KICK_STEP = pose({ head: [154, 58], neck: [153, 82], hip: [152, 150], lK: [180, 194], lA: [200, 236], rK: [132, 196], rA: [116, 234] });
const KICK_SWING = pose({ head: [142, 62], neck: [144, 86], hip: [156, 152], rE: [130, 122], rF: [122, 140],
  lK: [176, 196], lA: [196, 234], rK: [178, 186], rA: [212, 206] });
const KICK = pose({ head: [130, 66], neck: [135, 88], hip: [150, 152], lE: [166, 112], lF: [170, 88], rE: [112, 128], rF: [98, 150],
  lK: [176, 196], lA: [196, 234], rK: [192, 140], rA: [238, 128] });
const TEEP_CHAMBER = pose({ head: [146, 58], neck: [146, 82], hip: [146, 152], lK: [188, 168], lA: [186, 206] });
const TEEP = pose({ head: [138, 60], neck: [140, 84], hip: [148, 154], lE: [166, 114], lF: [172, 88], lK: [196, 158], lA: [242, 148] });

// Top-down feet: [x, y, angle in degrees]. Orthodox: lead (left) foot in front, rear foot behind and to the right.
const feet = (lead, rear) => ({ lead, rear });

const DEMOS = {
  jab: { type: 'side', hot: 'lead-arm', seq: [
    [GUARD, 700, 'Guard up, chin down'],
    [JAB, 160, 'Snap it straight out and step with it'],
    [JAB, 200, 'Lead shoulder up to cover your chin'],
    [GUARD, 240, 'Straight back on the same line'],
    [GUARD, 400, 'Guard up, chin down'] ] },
  cross: { type: 'side', hot: 'rear-arm', seq: [
    [GUARD, 700, 'Guard up, chin down'],
    [CROSS, 200, 'Pivot the back foot and turn the hip'],
    [CROSS, 220, 'Lead hand stays home by your face'],
    [GUARD, 260, 'Back to guard, ready to move'],
    [GUARD, 400, 'Guard up, chin down'] ] },
  hook: { type: 'side', hot: 'lead-arm', seq: [
    [GUARD, 700, 'Guard up, chin down'],
    [HOOK, 180, 'Elbow up, arm bent at about 90°'],
    [HOOK, 220, 'Turn the foot, hip and shoulder together'],
    [GUARD, 260, 'Rear hand stays glued to your cheek'],
    [GUARD, 400, 'Guard up, chin down'] ] },
  roundhouse: { type: 'side', hot: 'rear-leg', seq: [
    [GUARD, 700, 'Stance, hands up'],
    [KICK_STEP, 200, 'Step out at an angle with the lead foot'],
    [KICK_SWING, 180, 'Pivot on the ball of that foot, turn the hip right over'],
    [KICK, 170, 'Swing the leg round flat and hit with the shin'],
    [KICK, 300, 'Lean away, same-side arm swings down'],
    [GUARD, 340, 'Back to stance'],
    [GUARD, 400, 'Stance, hands up'] ] },
  teep: { type: 'side', hot: 'lead-leg', seq: [
    [GUARD, 650, 'Stance, hands up'],
    [TEEP_CHAMBER, 200, 'Lift the knee first'],
    [TEEP, 180, 'Push the hips through, ball of the foot'],
    [TEEP, 160, 'Push the hips through, ball of the foot'],
    [TEEP_CHAMBER, 160, 'Snap it back'],
    [GUARD, 240, 'Snap it back'],
    [GUARD, 400, 'Stance, hands up'] ] },
  angles: { type: 'top', ghost: true, line: true, seq: [
    [feet([150, 150, 10], [176, 194, 45]), 900, 'You are square, right on their line of attack'],
    [feet([186, 136, 10], [176, 194, 45]), 300, 'Step outside their lead foot', 'lead'],
    [feet([186, 136, 10], [176, 194, 45]), 250, 'Step outside their lead foot', 'lead'],
    [feet([186, 136, -20], [227, 168, 15]), 380, 'Pivot on the lead foot, swing the back foot round', 'rear'],
    [feet([186, 136, -20], [227, 168, 15]), 1100, 'Now you can hit them, and they have to turn to find you'],
    [feet([150, 150, 10], [176, 194, 45]), 600, 'Reset'] ] },
  distance: { type: 'top', reach: 95, seq: [
    [feet([150, 152, 10], [176, 202, 45]), 900, 'Wait just outside their reach'],
    [feet([150, 116, 10], [176, 166, 45]), 220, 'Push off the back foot, step in and strike', 'lead'],
    [feet([150, 116, 10], [176, 166, 45]), 300, 'Land your shots'],
    [feet([150, 152, 10], [176, 202, 45]), 260, 'Back out before they answer', 'rear'],
    [feet([150, 152, 10], [176, 202, 45]), 500, 'Wait just outside their reach'] ] },
};

/* ---------- Markup ---------- */

// The demo card for a technique, or '' if it has no animation yet
function moveDemo(id) {
  const d = DEMOS[id];
  if (!d) return '';
  // Moves with a 3D version open in 3D, because some (like the round kick) can't be read side-on
  return `<div class="demo" data-move="${id}"${POSES3D[id] ? ' data-start3d' : ''}>
    <svg class="demo-svg" viewBox="0 0 300 250" role="img" aria-label="Animation of the technique"></svg>
    <p class="demo-cue" aria-live="polite">${esc(d.seq[0][2])}</p>
    <div class="demo-ctl ${POSES3D[id] ? 'three' : ''}"><button class="btn" data-act="demo-play">${reducedMotion() ? '▶ Play' : 'Pause'}</button>
    <button class="btn" data-act="demo-slow">Slow-mo</button>
    ${POSES3D[id] ? '<button class="btn d3-btn" data-act="demo-3d">3D view</button>' : ''}</div></div>`;
}

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Drawing ---------- */

const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
// Blend two poses (objects of number arrays) by t from 0 to 1
const blend = (a, b, t) => Object.fromEntries(Object.keys(a).map(k => [k, a[k].map((v, i) => v + (b[k][i] - v) * t)]));
const pt = p => p.map(n => n.toFixed(1)).join(' ');

function drawSide(p, hot) {
  const limb = (a, b, c) => `M${pt(p[a])} L${pt(p[b])} L${pt(p[c])}`;
  const parts = {
    'rear-leg': limb('hip', 'rK', 'rA'), 'rear-arm': limb('neck', 'rE', 'rF'),
    'lead-leg': limb('hip', 'lK', 'lA'), 'lead-arm': limb('neck', 'lE', 'lF') };
  // Far-side limbs are drawn lighter and first, so the figure reads as 3D
  const cls = name => name === hot ? 'hot' : name.startsWith('rear') ? 'far' : '';
  const fist = (k, name) => `<circle class="fist ${cls(name)}" cx="${p[k][0]}" cy="${p[k][1]}" r="8"/>`;
  return `<line class="ground" x1="20" y1="240" x2="280" y2="240"/>
    <g class="fig">
      <path class="${cls('rear-leg')}" d="${parts['rear-leg']}"/><path class="${cls('rear-arm')}" d="${parts['rear-arm']}"/>${fist('rF', 'rear-arm')}
      <path d="M${pt(p.neck)} L${pt(p.hip)}"/>
      <path class="${cls('lead-leg')}" d="${parts['lead-leg']}"/><path class="${cls('lead-arm')}" d="${parts['lead-arm']}"/>${fist('lF', 'lead-arm')}
      <circle class="head" cx="${p.head[0]}" cy="${p.head[1]}" r="17"/>
    </g>`;
}

const foot = ([x, y, a], cls) => `<g class="foot ${cls}" transform="translate(${x} ${y}) rotate(${a})">
  <rect x="-11" y="-22" width="22" height="44" rx="11"/><circle cx="0" cy="-13" r="4"/></g>`;

function drawTop(d, p, hot) {
  const opp = [150, 40];
  const inside = d.reach && Math.hypot(p.lead[0] - opp[0], p.lead[1] - opp[1]) < d.reach;
  const first = d.seq[0][0];
  return `${d.reach ? `<circle class="reach ${inside ? 'in' : ''}" cx="${opp[0]}" cy="${opp[1]}" r="${d.reach}"/>` : ''}
    ${d.line ? `<line class="oppline" x1="150" y1="60" x2="150" y2="246"/>` : ''}
    <circle class="opp" cx="${opp[0]}" cy="${opp[1]}" r="17"/>
    <text class="lbl" x="${opp[0] + 26}" y="${opp[1] + 4}">opponent</text>
    ${d.reach ? `<text class="lbl" x="${opp[0]}" y="${opp[1] + d.reach + 14}" text-anchor="middle">their reach</text>` : ''}
    ${d.ghost ? foot(first.lead, 'ghost') + foot(first.rear, 'ghost') : ''}
    ${foot(p.lead, hot === 'lead' ? 'hot' : '')}${foot(p.rear, hot === 'rear' ? 'hot' : '')}`;
}

/* ---------- Animation loop ---------- */

let demoRaf = 0;

// Called after every render(); runs one shared loop while any demo is on screen
function startDemos() {
  document.querySelectorAll('.demo[data-start3d]').forEach(el => {
    if (el._opened3d) return;
    el._opened3d = true;
    toggle3d(el, el.querySelector('[data-act="demo-3d"]'));
  });
  if (!demoRaf && document.querySelector('.demo')) demoRaf = requestAnimationFrame(demoTick);
}

function demoTick(now) {
  const els = document.querySelectorAll('.demo');
  if (!els.length) { demoRaf = 0; return; }
  els.forEach(el => drawDemo(el, now));
  sweep3d();
  demoRaf = requestAnimationFrame(demoTick);
}

// Playback state for one demo card, created the first time it's drawn or tapped
const demoState = (el, now) => el._st || (el._st = { start: now, playing: !reducedMotion(), slow: 1, at: 0, cue: '' });

function drawDemo(el, now) {
  const d = DEMOS[el.dataset.move];
  if (!d) return;
  const st = demoState(el, now);
  if (st.playing) st.at = now - st.start;
  else if (st.drawn) return;
  const total = d.seq.reduce((s, f) => s + f[1], 0) * st.slow;
  // Find which keyframe we're heading to (i), the one before it (prev) and how far along (k)
  let t = st.at % total, prev = d.seq.length - 1, i = 0, k = 1;
  for (; i < d.seq.length; i++) {
    const dur = d.seq[i][1] * st.slow;
    if (t <= dur) { k = ease(t / dur); break; }
    t -= dur; prev = i;
  }
  i = Math.min(i, d.seq.length - 1);
  const [, , cue, hot] = d.seq[i];
  if (cue !== st.cue) { el.querySelector('.demo-cue').textContent = st.cue = cue; }
  if (el._3d) { st.drawn = draw3d(el, prev, i, k); return; }
  const out = blend(d.seq[prev][0], d.seq[i][0], k);
  el.querySelector('svg').innerHTML = d.type === 'side' ? drawSide(out, d.hot) : drawTop(d, out, hot);
  st.drawn = true;
}

document.addEventListener('click', e => {
  const btn = e.target.closest('[data-act^="demo-"]');
  if (!btn) return;
  const el = btn.closest('.demo'), now = performance.now(), st = demoState(el, now);
  if (btn.dataset.act === 'demo-3d') { toggle3d(el, btn); return; }
  if (btn.dataset.act === 'demo-view') {
    if (!el._3d || !el._3d.ready) return;
    [el._3d.view.az, el._3d.view.el] = VIEWS[btn.dataset.view]; st.drawn = false; return;
  }
  if (btn.dataset.act === 'demo-play') {
    st.playing = !st.playing;
    if (st.playing) st.start = now - st.at; else st.drawn = false;
    btn.textContent = st.playing ? 'Pause' : '▶ Play';
  } else if (btn.dataset.act === 'demo-slow') {
    // Keep the same point in the loop when changing speed
    const total = DEMOS[el.dataset.move].seq.reduce((s, f) => s + f[1], 0);
    const frac = (st.at % (total * st.slow)) / (total * st.slow);
    st.slow = st.slow === 1 ? 3 : 1;
    st.at = frac * total * st.slow; st.start = now - st.at; st.drawn = false;
    btn.textContent = st.slow === 1 ? 'Slow-mo' : 'Normal';
    btn.classList.toggle('on', st.slow !== 1);
  }
});
