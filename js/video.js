/* Video check: pick a clip of pad or bag work, shadowboxing or sparring and get feedback on guard,
   punches, kicks, stance and footwork. Google's MediaPipe pose tracker (js/vendor/mediapipe, Apache-2.0)
   finds the body's joints in each frame on the phone, so the video never leaves it. The rules below
   turn those joint positions into coaching notes with timestamps you can tap.
   Route: #/video. Only position-based things are judged; timing, power and tactics need a coach
   (or the AI coach that may be added later). */

const MP_DIR = 'js/vendor/mediapipe';
const MAX_SECS = 180;            // longer clips: only the first 3 minutes are checked
let poseModel = null;            // MediaPipe PoseLandmarker, loaded the first time it's needed
let mpTs = 0;                    // detectForVideo needs ever-increasing timestamps

// Current check. The <video> element lives here so it survives re-renders.
const vc = { step: 'pick', kind: 'pads', stance: 'orthodox', url: '', video: null, aspect: 1, people: [],
  pickTime: 0, pick: 0, progress: 0, cancel: false, track: null, report: null, err: '', msg: '' };

const VC_KINDS = { pads: 'Pads or heavy bag', shadow: 'Shadowboxing', spar: 'Sparring or a fight' };

/* ---------- Pose model ---------- */

async function loadPoseModel() {
  if (poseModel) return poseModel;
  const base = new URL(MP_DIR, location.href).href;
  const { PoseLandmarker, FilesetResolver } = await import(base + '/vision_bundle.mjs');
  const files = await FilesetResolver.forVisionTasks(base + '/wasm');
  const opts = delegate => ({ baseOptions: { modelAssetPath: base + '/pose_landmarker_lite.task', delegate },
    runningMode: 'VIDEO', numPoses: 4 });
  // The graphics chip is much faster; fall back to the processor if it isn't available
  try { poseModel = await PoseLandmarker.createFromOptions(files, opts('GPU')); }
  catch (e) { poseModel = await PoseLandmarker.createFromOptions(files, opts('CPU')); }
  return poseModel;
}

// People in a frame, each as 33 joints [x, y, visibility]. x is scaled by the frame's
// width/height so distances are the same in every direction.
function detectPeople(src, aspect) {
  mpTs += 40;
  return poseModel.detectForVideo(src, mpTs).landmarks.map(L => L.map(p => [p.x * aspect, p.y, p.visibility]));
}

/* ---------- Geometry helpers (MediaPipe joint numbers) ---------- */

const J = { nose: 0, lSh: 11, rSh: 12, lEl: 13, rEl: 14, lWr: 15, rWr: 16, lHip: 23, rHip: 24, lKn: 25, rKn: 26, lAn: 27, rAn: 28 };
const midPt = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const gap = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const seen = (L, ...k) => k.every(i => L[i][2] > .5);
const median = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
const hipsOf = L => midPt(L[J.lHip], L[J.rHip]);
const torsoOf = L => gap(midPt(L[J.lSh], L[J.rSh]), hipsOf(L));
const clock = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

// Lead and rear joints: an orthodox fighter leads with the left side
function sides(stance) {
  const left = { sh: J.lSh, wr: J.lWr, an: J.lAn }, right = { sh: J.rSh, wr: J.rWr, an: J.rAn };
  return stance === 'southpaw' ? { lead: right, rear: left } : { lead: left, rear: right };
}

/* ---------- Video helpers ---------- */

// Phones (and some browsers) only decode a video's pictures while it's attached to the page,
// so it waits in a tiny invisible holder whenever it isn't on screen
function holdVideo(v) {
  let hold = document.getElementById('vcHold');
  if (!hold) {
    hold = document.createElement('div');
    hold.id = 'vcHold';
    hold.style.cssText = 'position:fixed;left:0;top:0;width:2px;height:2px;overflow:hidden;opacity:0;pointer-events:none';
    document.body.append(hold);
  }
  if (!v.isConnected) hold.append(v);
}

// Jump to a time and wait until that picture is ready
function seekTo(v, t) {
  return new Promise(res => {
    if (Math.abs(v.currentTime - t) < .001 && v.readyState >= 2) return res();
    const done = () => { clearTimeout(timer); v.removeEventListener('seeked', done); res(); };
    const timer = setTimeout(done, 3000);   // some phones skip the event on tiny seeks
    v.addEventListener('seeked', done);
    v.currentTime = t;
  });
}

// Bounding box and hip position of each person found in a frame
function personBoxes(people) {
  return people.map(L => {
    const pts = L.filter(p => p[2] > .5);
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    return { box: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)], hip: hipsOf(L), scale: torsoOf(L) };
  });
}

// Look for people at a few points in the clip; returns the first frame where someone shows up
async function findPeople(v) {
  const d = v.duration;
  for (const t of [Math.min(1, d * .2), d * .5, .05, d * .8]) {
    await seekTo(v, t);
    const people = detectPeople(v, vc.aspect).filter(L => seen(L, J.lSh, J.rSh, J.lHip, J.rHip));
    if (people.length) { vc.pickTime = t; return personBoxes(people); }
  }
  return [];
}

// Follow the chosen person: the pose whose hips are nearest to where they were last seen
function follow(people, last) {
  let best = null, bestGap = Infinity;
  for (const L of people) {
    if (!seen(L, J.lHip, J.rHip, J.lSh, J.rSh)) continue;
    const g = gap(hipsOf(L), last.hip);
    if (g < bestGap) { best = L; bestGap = g; }
  }
  return best && bestGap < 1.5 * last.scale ? best : null;
}

/* ---------- Flow ---------- */

async function vcPickFile(file) {
  vcReset();
  vc.url = URL.createObjectURL(file);
  vc.step = 'loading'; vc.msg = 'Opening your video…'; render();
  try {
    const v = document.createElement('video');
    Object.assign(v, { muted: true, playsInline: true, preload: 'auto', src: vc.url });
    v.setAttribute('playsinline', '');
    holdVideo(v);
    await new Promise((res, rej) => { v.onloadedmetadata = res; v.onerror = () => rej(new Error('video')); });
    await seekTo(v, .01);
    vc.video = v; vc.aspect = v.videoWidth / v.videoHeight || 1;
    vc.msg = 'Loading the body tracker…'; render();
    try { await loadPoseModel(); } catch (e) { throw new Error('model'); }
    vc.msg = 'Looking for you in the video…'; render();
    vc.people = await findPeople(v);
    if (!vc.people.length) throw new Error('nobody');
    if (vc.people.length === 1) return vcAnalyse(0);
    await seekTo(v, vc.pickTime);
    vc.step = 'choose'; render();
  } catch (e) {
    vc.err = { video: 'This video couldn\'t be opened. Try another clip, or record one with your phone\'s camera.',
      model: 'The body tracker couldn\'t start on this device. Check you\'re online the first time you use it, then try again.',
      nobody: 'Couldn\'t find anyone in this video. Try a clip where your whole body is in view, closer to the camera, in good light.' }[e.message]
      || 'Something went wrong reading this video. Try another clip.';
    vc.step = 'pick'; render();
  }
}

async function vcAnalyse(pick) {
  vc.pick = pick; vc.step = 'analysing'; vc.cancel = false; vc.progress = 0; render();
  const v = vc.video, dur = Math.min(v.duration, MAX_SECS), fps = dur <= 60 ? 10 : 6;
  holdVideo(v);
  let last = vc.people[pick];
  const frames = [];
  for (let t = .01; t <= dur; t += 1 / fps) {
    if (vc.cancel) { vcReset(); render(); return; }
    await seekTo(v, t);
    const L = follow(detectPeople(v, vc.aspect), last);
    if (L) last = { hip: hipsOf(L), scale: torsoOf(L) };
    frames.push({ t, L });
    vc.progress = t / dur; paintProgress();
    if (frames.length % 4 === 0) await new Promise(r => setTimeout(r));   // let the screen update
  }
  vc.track = { frames, fps, dur, cut: v.duration > MAX_SECS + .5 };
  vc.report = buildReport(vc.track, vc.kind, vc.stance);
  await seekTo(v, 0);
  vc.step = 'report'; render();
}

function vcReset() {
  if (vc.video) { vc.video.pause(); vc.video.remove(); }
  if (vc.url) URL.revokeObjectURL(vc.url);
  Object.assign(vc, { step: 'pick', url: '', video: null, people: [], track: null, report: null, err: '', cancel: false });
}

/* ---------- Turning joints into coaching notes ---------- */

// Per-frame measurements, in torso lengths (shoulders to hips) so they don't depend on how far
// away the camera is
function measure(track, stance) {
  const S = sides(stance);
  const tl = median(track.frames.filter(f => f.L).map(f => torsoOf(f.L))) || .2;
  return track.frames.map(({ t, L }) => {
    if (!L) return { t };
    const sh = midPt(L[J.lSh], L[J.rSh]), hp = hipsOf(L), m = { t, hip: hp };
    if (seen(L, J.nose, J.lSh, J.rSh)) {
      for (const side of ['lead', 'rear']) {
        const w = L[S[side].wr];
        if (w[2] > .5) m[side] = { reach: gap(w, L[J.nose]) / tl, low: (w[1] - sh[1]) / tl };
      }
    }
    for (const side of ['lead', 'rear']) {
      const a = L[S[side].an];
      if (a[2] > .5 && seen(L, J.lHip, J.rHip)) m[side + 'Leg'] = (hp[1] - a[1]) / tl;   // ankle height above hips
    }
    if (seen(L, J.lAn, J.rAn)) m.feet = { width: gap(L[J.lAn], L[J.rAn]) / tl, order: Math.sign(L[S.lead.an][0] - L[S.rear.an][0]) };
    m.lean = Math.atan2(sh[0] - hp[0], hp[1] - sh[1]) * 180 / Math.PI;
    m.tl = tl;
    return m;
  });
}

// Strikes: a hand leaves the guard (near the face) and reaches out; a foot rises toward hip height
function findStrikes(M) {
  const punches = [], kicks = [];
  for (const side of ['lead', 'rear']) {
    let homeAt = -9, cur = null;
    for (const m of M) {
      const h = m[side];
      if (!h) continue;
      if (h.reach < .75) {
        if (cur) { cur.back = m.t - cur.t; punches.push(cur); cur = null; }
        homeAt = m.t;
      } else if (h.reach > 1 && (cur || m.t - homeAt < .7)) {
        const other = m[side === 'lead' ? 'rear' : 'lead'];
        if (!cur || h.reach > cur.reach) cur = { side, t: m.t, reach: h.reach, otherOut: other ? other.reach > .8 : null, lean: m.lean };
      }
    }
    if (cur) punches.push(cur);
    let k = null;
    for (const m of M) {
      const y = m[side + 'Leg'];
      if (y == null) continue;
      if (y > -1 && (!k || y > k.height)) {
        const other = m[side === 'lead' ? 'rear' : 'lead'];
        k = { side, t: m.t, height: y, otherOut: other ? other.reach > .8 : null, start: k ? k.start : m.t };
      } else if (y < -1.3 && k) { kicks.push(k); k = null; }
    }
    if (k) kicks.push(k);
  }
  return { punches: punches.sort((a, b) => a.t - b.t), kicks: kicks.sort((a, b) => a.t - b.t) };
}

// Times where something was true for at least half a second (for timestamp chips)
function runs(M, test, minSecs = .5) {
  const out = []; let start = null, lastT = 0;
  for (const m of M) {
    if (test(m)) { if (start === null) start = m.t; lastT = m.t; }
    else if (start !== null) { if (lastT - start >= minSecs) out.push(start); start = null; }
  }
  if (start !== null && lastT - start >= minSecs) out.push(start);
  return out;
}

function buildReport(track, kind, stance) {
  const M = measure(track, stance), seenFrames = M.filter(m => m.hip).length;
  const cover = seenFrames / Math.max(M.length, 1);
  const { punches, kicks } = findStrikes(M);
  const kicking = t => kicks.some(k => t >= k.start - .2 && t <= k.t + .5);
  const punching = (t, side) => punches.some(p => p.side === side && t >= p.t - .4 && t <= p.t + (p.back || .5));
  const notes = [], drills = new Set();
  const note = (area, good, text, times = [], drill) => { notes.push({ area, good, text, times: times.slice(0, 5) }); if (!good && drill) drills.add(drill); };
  const pct = (a, b) => b ? Math.round(a / b * 100) : 0;

  // Guard: a hand counts as dropped when it sits well below the shoulders while not punching or kicking
  const guardFrames = M.filter(m => m.lead && m.rear && !kicking(m.t));
  const dropped = side => guardFrames.filter(m => m[side].low > .6 && !punching(m.t, side));
  const up = pct(guardFrames.length - guardFrames.filter(m => (m.lead.low > .6 && !punching(m.t, 'lead')) || (m.rear.low > .6 && !punching(m.t, 'rear'))).length, guardFrames.length);
  for (const [side, label] of [['rear', 'Your rear hand'], ['lead', 'Your lead hand']]) {
    const share = pct(dropped(side).length, guardFrames.length);
    if (guardFrames.length >= 10 && share >= 25) {
      note('Guard', false, `${label} sits below your shoulders about ${share}% of the time. Keep it up by your ${side === 'rear' ? 'cheek' : 'face'}.`,
        runs(M, m => m[side] && m[side].low > .6 && !punching(m.t, side) && !kicking(m.t)), 'slip');
    }
  }
  if (guardFrames.length >= 10 && up >= 85) note('Guard', true, `Hands stayed up ${up}% of the time. Good habit.`);
  for (const side of ['lead', 'rear']) {
    const mine = punches.filter(p => p.side === side && p.otherOut !== null);
    const lazy = mine.filter(p => p.otherOut);
    if (mine.length >= 3 && lazy.length / mine.length >= .3) {
      note('Guard', false, `When you punch with your ${side} hand, the other hand drifts away from your face (${lazy.length} of ${mine.length} punches). Keep it home.`,
        lazy.map(p => p.t), side === 'rear' ? 'cross' : 'jab');
    }
  }

  // Punches
  const lead = punches.filter(p => p.side === 'lead').length, rear = punches.length - lead;
  if (punches.length) {
    note('Punches', true, `${punches.length} punch${punches.length === 1 ? '' : 'es'} picked up: ${lead} with the lead hand, ${rear} with the rear hand.`);
    const slow = track.fps >= 8 ? punches.filter(p => p.back > .6) : [];
    if (punches.length >= 3 && slow.length / punches.length >= .3) {
      note('Punches', false, `Some punches hang out before coming back. Snap them straight back to guard.`, slow.map(p => p.t), 'jab');
    }
    const usual = median(M.filter(m => m.lean != null).map(m => m.lean));
    const over = punches.filter(p => Math.abs(p.lean - usual) > 18);
    if (over.length >= 2) note('Punches', false, `You lean over on some punches. Keep your head over your knees and let the feet close the distance.`, over.map(p => p.t), 'distance');
  } else if (kind !== 'spar') {
    note('Punches', false, 'No punches picked up. Make sure your arms are in view and the camera is steady.');
  }

  // Kicks
  if (kicks.length) {
    const h = k => k.height > .9 ? 'head' : k.height > -.3 ? 'body' : 'low';
    const count = c => kicks.filter(k => h(k) === c).length;
    const parts = ['low', 'body', 'head'].filter(count).map(c => `${count(c)} ${c} height`).join(', ');
    note('Kicks', true, `${kicks.length} kick${kicks.length === 1 ? '' : 's'} or knee${kicks.length === 1 ? '' : 's'} picked up: ${parts}.`);
    const open = kicks.filter(k => k.otherOut);
    if (open.length && open.length / kicks.length >= .5) {
      note('Kicks', false, `Your guard drops when you kick (${open.length} of ${kicks.length}). The arm on the kicking side can swing down, but keep the other hand by your face.`,
        open.map(k => k.t), 'roundhouse');
    }
  }

  // Stance and balance
  const widths = M.filter(m => m.feet && !kicking(m.t)).map(m => m.feet.width);
  if (widths.length >= 10) {
    const w = median(widths);
    if (w < .55) note('Stance', false, 'Your feet look close together, which makes you easy to push off balance. Widen to about shoulder width plus a step. (The camera angle affects this one.)', [], 'angles');
    else if (w > 1.9) note('Stance', false, 'Your stance looks very wide, which slows your feet down. Bring your feet in a little. (The camera angle affects this one.)', [], 'angles');
    else note('Stance', true, 'Stance width looks solid.');
  }
  const leans = M.filter(m => m.lean != null).map(m => m.lean);
  if (leans.length >= 10 && Math.abs(median(leans)) > 22) note('Stance', false, 'You lean heavily for most of the clip. Stay stacked over your hips so you can move either way.', [], 'distance');

  // Footwork: the lead and rear feet swapping sides means crossed feet (or a stance switch)
  const order = median(M.filter(m => m.feet && m.feet.width > .2).map(m => m.feet.order));
  const crossed = runs(M, m => m.feet && order && m.feet.width > .2 && m.feet.order === -order && !kicking(m.t), .2);
  if (crossed.length) note('Footwork', false, 'Your feet crossed (or you switched stance) here. Step with the foot nearest the direction you move first.', crossed, 'angles');
  if (kind === 'spar' && seenFrames > 20) {
    const pts = M.filter(m => m.hip), dist = pts.slice(1).reduce((s, m, i) => s + gap(m.hip, pts[i].hip), 0) / (pts[0].tl || .2);
    const perSec = dist / Math.max(track.dur, 1);
    if (perSec < .25) note('Footwork', false, 'You stayed in one spot most of the time. Keep your feet moving and change angles.', [], 'angles');
    else note('Footwork', true, 'Good, you kept moving.');
  }

  return { cover, up: guardFrames.length >= 10 ? up : null, punches: punches.length, kicks: kicks.length, notes, drills: [...drills] };
}

/* ---------- Screen ---------- */

function videoScreen() {
  const head = banner('video', 'Video check', 'Film your pads, bag work or sparring. Get notes on your technique.');
  if (vc.step === 'loading') return head + `<section class="card center"><div class="spin"></div><p>${esc(vc.msg)}</p></section>`;
  if (vc.step === 'analysing') return head + `<section class="card" id="vcProg"><h2>Checking your technique…</h2>
    <div class="bar"><i style="width:0%"></i></div><p class="muted small vc-at"></p>
    <button class="btn ghost wide" data-act="vc-cancel">Cancel</button></section>`;
  if (vc.step === 'choose') return head + `<section class="card"><h2>Which one is you?</h2>
    <p class="muted small">There's more than one person in this video. Tap yourself.</p>
    <div class="vc-stage" id="vcStage"><canvas class="vc-ov"></canvas>
      ${vc.people.map((p, i) => { const [x0, y0, x1, y1] = p.box, a = vc.aspect;
        return `<button class="vc-person" data-act="vc-pick" data-i="${i}" style="left:${x0 / a * 100}%;top:${y0 * 100}%;width:${(x1 - x0) / a * 100}%;height:${(y1 - y0) * 100}%"><span>${i + 1}</span></button>`; }).join('')}
    </div><button class="btn ghost wide" data-act="vc-reset">Choose a different video</button></section>`;
  if (vc.step === 'report') return head + reportView();
  return head + `${vc.err ? `<p class="card note warn">${esc(vc.err)}</p>` : ''}
  <section class="card"><h2>Check a clip</h2>
    <label>What's in the video?<select data-vc="kind">${Object.entries(VC_KINDS).map(([k, l]) => `<option value="${k}" ${vc.kind === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    <label>Your stance<select data-vc="stance"><option value="orthodox" ${vc.stance === 'orthodox' ? 'selected' : ''}>Orthodox (left foot forward)</option>
      <option value="southpaw" ${vc.stance === 'southpaw' ? 'selected' : ''}>Southpaw (right foot forward)</option></select></label>
    <label class="btn primary wide vc-file">🎥 Choose or record a video<input type="file" accept="video/*" data-vc="file" hidden></label>
    <p class="muted small center">Your video stays on your phone. Nothing is uploaded.</p></section>
  <section class="card"><h2>For the best results</h2><ul>
    <li>Get your whole body in the shot, head to feet.</li>
    <li>Prop the phone up so the camera stays still.</li>
    <li>Film side-on or at an angle, in good light, close enough to fill about half the height of the frame.</li>
    <li>Short clips work best: 10 to 60 seconds. Longer ones are checked for the first 3 minutes.</li>
  </ul></section>`;
}

function reportView() {
  const r = vc.report, groups = {};
  r.notes.forEach(n => (groups[n.area] = groups[n.area] || []).push(n));
  const chip = t => `<button class="chip" data-act="vc-seek" data-t="${t.toFixed(2)}">${clock(t)}</button>`;
  return `<section class="card"><div class="vc-stage" id="vcStage"><canvas class="vc-ov"></canvas></div>
    <p class="muted small center">Red lines show what the tracker saw. Tap a time below to jump there.</p>
    <div class="stats">${stat(r.punches, 'punches', 'glove')}${stat(r.kicks, 'kicks')}${stat(r.up == null ? '–' : r.up + '%', 'hands up', 'chart')}</div></section>
  ${r.cover < .6 ? `<p class="card note warn">I could only see you clearly in ${Math.round(r.cover * 100)}% of the clip, so these notes are rough. Try the filming tips for a better read.</p>` : ''}
  ${vc.track.cut ? '<p class="card note">Only the first 3 minutes were checked.</p>' : ''}
  ${Object.entries(groups).map(([area, ns]) => `<section class="card"><h2>${esc(area)}</h2><ul class="vc-notes">${ns.map(n =>
    `<li class="${n.good ? 'good' : 'fix'}"><b>${n.good ? '✓' : '!'}</b><div><p>${esc(n.text)}</p>${n.times.length ? `<div class="chips">${n.times.map(chip).join('')}</div>` : ''}</div></li>`).join('')}</ul></section>`).join('')
    || '<p class="card">Nothing stood out. Try a longer clip with more punches and kicks.</p>'}
  ${r.drills.length ? `<section class="card"><h2>What to drill</h2><div class="picks">${r.drills.map(id => techById(id)).filter(Boolean)
    .map(t => `<button class="pick" data-act="vc-drill" data-id="${t.id}">${esc(t.name)}</button>`).join('')}</div></section>` : ''}
  <p class="muted small center">This is an automatic check from body tracking. It measures positions, not timing or power, and the camera angle can fool it. A coach's eye still beats it.</p>
  <button class="btn wide" data-act="vc-reset">Check another video</button>`;
}

// Put the video element into the page after each render and keep the skeleton overlay drawn
function mountVideo() {
  const stage = document.getElementById('vcStage');
  if (!stage || !vc.video) return;
  const v = vc.video;
  v.controls = vc.step === 'report';
  if (v.parentNode !== stage) stage.prepend(v);
  stage.style.aspectRatio = vc.aspect;
  // Listeners are added once per video; they always draw into whichever stage is on screen now
  if (!v._drawing) {
    v._drawing = true;
    const draw = () => drawOverlay(document.querySelector('#vcStage canvas'));
    ['seeked', 'timeupdate', 'loadeddata'].forEach(e => v.addEventListener(e, draw));
    if (v.requestVideoFrameCallback) { const loop = () => { draw(); v.requestVideoFrameCallback(loop); }; v.requestVideoFrameCallback(loop); }
  }
  drawOverlay(stage.querySelector('canvas'));
}

const BONES = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28]];

function drawOverlay(cv) {
  if (!cv || !cv.isConnected) return;
  const w = cv.clientWidth, h = cv.clientHeight;
  if (cv.width !== w) { cv.width = w; cv.height = h; }
  const g = cv.getContext('2d');
  g.clearRect(0, 0, w, h);
  const skeleton = (L, color) => {
    g.strokeStyle = color; g.lineWidth = 3; g.lineCap = 'round';
    for (const [a, b] of BONES) {
      if (L[a][2] < .5 || L[b][2] < .5) continue;
      g.beginPath(); g.moveTo(L[a][0] / vc.aspect * w, L[a][1] * h); g.lineTo(L[b][0] / vc.aspect * w, L[b][1] * h); g.stroke();
    }
  };
  if (vc.step === 'report' && vc.track) {
    const t = vc.video.currentTime, f = vc.track.frames.reduce((b, f) => Math.abs(f.t - t) < Math.abs(b.t - t) ? f : b);
    if (f.L) skeleton(f.L, '#ff2d55');
  }
}

function paintProgress() {
  const el = document.getElementById('vcProg');
  if (!el) return;
  el.querySelector('.bar i').style.width = Math.round(vc.progress * 100) + '%';
  el.querySelector('.vc-at').textContent = `${clock(vc.progress * Math.min(vc.video.duration, MAX_SECS))} of ${clock(Math.min(vc.video.duration, MAX_SECS))}`;
}

/* ---------- Events ---------- */

document.addEventListener('change', e => {
  const k = e.target.dataset && e.target.dataset.vc;
  if (!k) return;
  if (k === 'file') { if (e.target.files[0]) vcPickFile(e.target.files[0]); }
  else vc[k] = e.target.value;
});

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act^="vc-"]');
  if (!el) return;
  switch (el.dataset.act) {
    case 'vc-pick': vcAnalyse(+el.dataset.i); break;
    case 'vc-cancel': vc.cancel = true; break;
    case 'vc-reset': vcReset(); render(); scrollTo(0, 0); break;
    case 'vc-seek': vc.video.pause(); vc.video.currentTime = Math.max(0, +el.dataset.t - .3); document.getElementById('vcStage').scrollIntoView({ behavior: 'smooth' }); break;
    case 'vc-drill': {
      const t = techById(el.dataset.id);
      learn = { q: t.name, tech: t, fighter: null, name: '', wiki: null };
      location.hash = '#/learn';
      break;
    }
  }
});
