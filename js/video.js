/* Video check: pick a clip of pad or bag work, shadowboxing or sparring and get feedback on guard,
   punches, kicks, stance and footwork. Google's MediaPipe pose tracker (js/vendor/mediapipe, Apache-2.0)
   finds the body's joints in each frame on the phone, so the video never leaves it. The rules below
   turn those joint positions into coaching notes with timestamps you can tap.
   Route: #/video. Only position-based things are judged; timing, power and tactics need a coach
   (or the AI coach that may be added later). */

const MP_DIR = 'js/vendor/mediapipe';
const MAX_SECS = 180;            // longer clips: only the first 3 minutes are checked
let poseModel = null;            // MediaPipe PoseLandmarker, loaded the first time it's needed
const cropCv = document.createElement('canvas');   // a zoomed-in part of the frame for the tracker
const colorCv = document.createElement('canvas');  // a small copy of the frame for reading clothing colours

// Current check. The <video> element lives here so it survives re-renders.
const vc = { step: 'pick', kind: 'pads', stance: 'orthodox', url: '', video: null, aspect: 1, people: [],
  pickTime: 0, pick: 0, run: 0, progress: 0, cancel: false, track: null, report: null, err: '', msg: '' };

const VC_KINDS = { pads: 'Pads or heavy bag', shadow: 'Shadowboxing', spar: 'Sparring or a fight' };

/* ---------- Pose model ---------- */

async function loadPoseModel() {
  if (poseModel) return poseModel;
  const base = new URL(MP_DIR, location.href).href;
  const { PoseLandmarker, FilesetResolver } = await import(base + '/vision_bundle.mjs');
  const files = await FilesetResolver.forVisionTasks(base + '/wasm');
  const opts = delegate => ({ baseOptions: { modelAssetPath: base + '/pose_landmarker_lite.task', delegate },
    runningMode: 'IMAGE', numPoses: 4 });
  // The graphics chip is much faster; fall back to the processor if it isn't available
  try { poseModel = await PoseLandmarker.createFromOptions(files, opts('GPU')); }
  catch (e) { poseModel = await PoseLandmarker.createFromOptions(files, opts('CPU')); }
  return poseModel;
}

// People in a frame, each as 33 joints [x, y, visibility]. x is scaled by the frame's
// width/height so distances are the same in every direction (x runs 0 to aspect, y 0 to 1).
// `area` [x0, y0, x1, y1] zooms in on part of the frame first: the tracker finds small,
// far-away people much better that way.
function detectPeople(v, aspect, area) {
  if (!area) return poseModel.detect(v).landmarks.map(L => L.map(p => [p.x * aspect, p.y, p.visibility]));
  const [x0, y0, x1, y1] = area, W = v.videoWidth, H = v.videoHeight;
  const sx = x0 / aspect * W, sy = y0 * H, sw = (x1 - x0) / aspect * W, sh = (y1 - y0) * H;
  const k = Math.min(1, 640 / Math.max(sw, sh));
  cropCv.width = Math.round(sw * k); cropCv.height = Math.round(sh * k);
  cropCv.getContext('2d').drawImage(v, sx, sy, sw, sh, 0, 0, cropCv.width, cropCv.height);
  return poseModel.detect(cropCv).landmarks.map(L => L.map(p => [x0 + p.x * (x1 - x0), y0 + p.y * (y1 - y0), p.visibility]));
}

// A box around someone (hips and torso length), clamped to the frame: square where it fits, and
// as wide as the picture in a tall, upright phone video. Null when they already fill most of it.
function areaAround(hip, scale, aspect) {
  const hw = Math.min(2.6 * scale, aspect / 2), hh = Math.min(2.6 * scale, .5);
  if (hw * 2 > .8 * aspect && hh * 2 > .8) return null;
  const cx = Math.min(Math.max(hip[0], hw), aspect - hw), cy = Math.min(Math.max(hip[1] - .3 * scale, hh), 1 - hh);
  return [cx - hw, cy - hh, cx + hw, cy + hh];
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
  const left = { sh: J.lSh, el: J.lEl, wr: J.lWr, kn: J.lKn, an: J.lAn }, right = { sh: J.rSh, el: J.rEl, wr: J.rWr, kn: J.rKn, an: J.rAn };
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

// Jump to a time and wait until that picture is ready. Resolves false if it took too long
// (the picture may still be the old one)
function seekTo(v, t) {
  return new Promise(res => {
    if (Math.abs(v.currentTime - t) < .001 && v.readyState >= 2) return res(true);
    const done = e => { clearTimeout(timer); v.removeEventListener('seeked', done); res(!!e); };
    const timer = setTimeout(done, 3000);   // some phones skip the event on tiny seeks
    v.addEventListener('seeked', done);
    v.currentTime = t;
  });
}

// Play the clip from `from` and hand about `fps` frames a second to onFrame(time). If the tracker is slower
// than that, the video slows down to match. Stops early if this browser can't report frames or
// they stop arriving; the caller fills in whatever was missed.
function playFrames(v, from, dur, fps, onFrame) {
  if (!v.requestVideoFrameCallback) return Promise.resolve();
  return new Promise((res, rej) => {
    let lastT = -1, took = 0, finished = false, watchdog;
    const finish = err => {
      if (finished) return;
      finished = true; clearTimeout(watchdog);
      v.pause(); v.onended = null; v.playbackRate = 1;
      err instanceof Error ? rej(err) : res();
    };
    const arm = () => { clearTimeout(watchdog); watchdog = setTimeout(() => finish(), 3000); };
    const tick = (now, meta) => {
      if (finished) return;
      if (vc.cancel) return finish();
      const t = meta.mediaTime;
      if (t > dur) return finish();
      arm();
      if (t - lastT >= .9 / fps) {
        const start = performance.now();
        try { onFrame(t); } catch (e) { return finish(e); }
        lastT = t;
        took = took ? took * .8 + (performance.now() - start) / 5000 : (performance.now() - start) / 1000;
        const rate = Math.max(.1, Math.min(2, .7 / (fps * took)));
        if (Math.abs(rate - v.playbackRate) / v.playbackRate > .15) v.playbackRate = rate;
      }
      v.requestVideoFrameCallback(tick);
    };
    v.onended = () => finish();
    seekTo(v, from).then(() => {
      v.requestVideoFrameCallback(tick);
      arm();
      v.play().catch(() => finish());   // not allowed to play: the caller jumps through instead
    });
  });
}

// The slower way: jump to each moment in turn
async function seekFrames(v, times, onFrame) {
  for (const [n, t] of times.entries()) {
    if (vc.cancel) return;
    if (await seekTo(v, t)) onFrame(t);   // (a stale picture would be read as the wrong moment)
    if (n % 4 === 3) await new Promise(r => setTimeout(r));   // let the screen update
  }
}

/* ---------- Telling people apart by their clothes ---------- */

// A small copy of the current frame's pixels
function grabColors(v) {
  colorCv.width = 256; colorCv.height = Math.max(1, Math.round(256 / vc.aspect));
  const g = colorCv.getContext('2d', { willReadFrequently: true });
  g.drawImage(v, 0, 0, colorCv.width, colorCv.height);
  return { data: g.getImageData(0, 0, colorCv.width, colorCv.height).data, w: colorCv.width, h: colorCv.height };
}

// Average colour of a little square around a point (in the tracker's units), or null off-frame
function patchColor(img, p, r) {
  const cx = p[0] / vc.aspect * img.w, cy = p[1] * img.h, rp = Math.max(1, r * img.h);
  let n = 0; const sum = [0, 0, 0];
  for (let y = Math.round(cy - rp); y <= cy + rp; y++) for (let x = Math.round(cx - rp); x <= cx + rp; x++) {
    if (x < 0 || y < 0 || x >= img.w || y >= img.h) continue;
    const i = (y * img.w + x) * 4;
    sum[0] += img.data[i]; sum[1] += img.data[i + 1]; sum[2] += img.data[i + 2]; n++;
  }
  return n ? sum.map(c => c / n) : null;
}

// A person's colours: top (middle of the chest) and shorts or trousers (tops of the thighs)
function outfit(img, L) {
  const sh = midPt(L[J.lSh], L[J.rSh]), hp = hipsOf(L), tl = torsoOf(L), lerp = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
  const top = patchColor(img, lerp(sh, hp, .45), tl * .12);
  const legs = [[J.lHip, J.lKn], [J.rHip, J.rKn]].filter(([h, k]) => L[k][2] > .3).map(([h, k]) => patchColor(img, lerp(L[h], L[k], .3), tl * .08)).filter(Boolean);
  const bottom = legs.length ? [0, 1, 2].map(c => legs.reduce((s, x) => s + x[c], 0) / legs.length) : null;
  return { top, bottom };
}

// How different two colours look, 0 (same) to about 1. Mostly the shade of colour (teal vs black
// vs red), which gym lighting changes less than how light or dark it looks.
function colorGap(a, b) {
  const la = (a[0] + a[1] + a[2]) / 3, lb = (b[0] + b[1] + b[2]) / 3;
  const shade = Math.hypot(...a.map((c, i) => (c - la) - (b[i] - lb))) / (Math.max(la, lb) + 40);
  return Math.max(Math.abs(la - lb) / 255, shade * .8);
}

// How different two outfits look. Null when there's nothing to compare.
function outfitGap(a, b) {
  const d = [];
  for (const k of ['top', 'bottom']) if (a[k] && b[k]) d.push(colorGap(a[k], b[k]));
  return d.length ? Math.max(...d) : null;
}

// The typical outfit over many frames (arms, gloves and pads pass in front of the body, so any
// one frame can be off)
function usualOutfit(list) {
  const out = {};
  for (const k of ['top', 'bottom']) {
    const xs = list.map(o => o && o[k]).filter(Boolean);
    out[k] = xs.length ? [0, 1, 2].map(c => median(xs.map(x => x[c]))) : null;
  }
  return out;
}

// Bounding box, hip position, size and outfit of each person found in a frame
function personBoxes(people, img) {
  return people.map(L => {
    const pts = L.filter(p => p[2] > .5);
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    return { box: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)], hip: hipsOf(L), scale: torsoOf(L), outfit: img && outfit(img, L) };
  });
}

// Everyone in the frame: the whole picture plus three overlapping slices (the tracker mostly
// finds only the biggest person in a wide shot)
function detectEveryone(v) {
  const a = vc.aspect, people = [];
  for (const area of [null, [0, 0, a * .6, 1], [a * .2, 0, a * .8, 1], [a * .4, 0, a, 1]]) {
    for (const L of detectPeople(v, a, area)) {
      if (!seen(L, J.lSh, J.rSh, J.lHip, J.rHip)) continue;
      // The same person found twice (in the whole frame and a slice): keep one
      if (!people.some(P => gap(hipsOf(P), hipsOf(L)) < .8 * torsoOf(P))) people.push(L);
    }
  }
  return people;
}

// Look for people at a few points in the clip and keep the moment where the most are in view
// (the tracker can miss someone in any one frame)
async function findPeople(v) {
  const d = v.duration;
  let best = [], bestImg = null;
  for (const t of [.05, Math.min(1, d * .2), d * .5, d * .8]) {
    if (!(await seekTo(v, t))) continue;
    const people = detectEveryone(v);
    // Tiny "people" next to a big one are almost always a poster or a bit of the background
    const big = Math.max(0, ...people.map(torsoOf));
    const real = people.filter(L => torsoOf(L) > big * .3 && torsoOf(L) > .04);
    if (real.length > best.length) { vc.pickTime = t; best = real; bestImg = grabColors(v); }
  }
  return personBoxes(best, bestImg);
}

// Follow the chosen person: the pose of about the same size, dressed the same, whose hips are
// nearest to where they were last seen. The longer they've been out of sight, the further they
// may have moved. `look` is their outfit and `img` the frame's colours (to tell them apart from
// a pad holder or sparring partner standing right next to them).
function follow(people, last, away, look, img) {
  let best = null, bestScore = Infinity;
  for (const L of people) {
    if (!seen(L, J.lHip, J.rHip, J.lSh, J.rSh)) continue;
    const size = torsoOf(L) / last.scale;
    const g = gap(hipsOf(L), last.hip) / last.scale;
    if (g > .5 + .6 * Math.min(away, 1.5)) continue;   // better to lose them for a moment than follow someone else
    const dress = look && img ? outfitGap(look, outfit(img, L)) : null;
    if (dress != null && dress > .4) continue;   // clearly different clothes: someone else
    // Someone nearer or further from the camera looks bigger or smaller. Bending and turning
    // change the size a bit too, so allow more when the clothes clearly match.
    const roomy = dress != null && dress < .15;
    if (size < (roomy ? .65 : .8) || size > (roomy ? 1.5 : 1.25)) continue;
    const score = g + (dress || 0) * 4;
    if (score < bestScore) { best = L; bestScore = score; }
  }
  return best;
}

/* ---------- Flow ---------- */

async function vcPickFile(file) {
  vcReset();
  const run = vc.run;   // a newer pick (or Reset) changes vc.run; this one then stops quietly
  const still = x => { if (run !== vc.run) throw new Error('stale'); return x; };
  vc.url = URL.createObjectURL(file);
  vc.step = 'loading'; vc.msg = 'Opening your video…'; render();
  try {
    const v = vc.video = document.createElement('video');
    Object.assign(v, { muted: true, playsInline: true, preload: 'auto', src: vc.url });
    v.setAttribute('playsinline', '');
    holdVideo(v);
    await new Promise((res, rej) => {
      v.onloadedmetadata = res; v.onerror = () => rej(new Error('video'));
      setTimeout(() => rej(new Error('video')), 20000);   // some phones never say they can't open it
    });
    // Some recordings (often from apps and screen recorders) don't say how long they are until
    // you jump to the end
    if (!isFinite(v.duration)) {
      await new Promise(res => { v.ondurationchange = () => isFinite(v.duration) && res(); setTimeout(res, 5000); v.currentTime = 1e9; });
      v.ondurationchange = null;
      if (!isFinite(v.duration)) throw new Error('video');
    }
    still(await seekTo(v, .01));
    vc.aspect = v.videoWidth / v.videoHeight || 1;
    vc.msg = 'Loading the body tracker…'; render();
    try { await loadPoseModel(); } catch (e) { throw new Error('model'); }
    still(); vc.msg = 'Looking for you in the video…'; render();
    vc.people = still(await findPeople(v));
    if (!vc.people.length) throw new Error('nobody');
    if (vc.people.length === 1) return vcAnalyse(0);
    still(await seekTo(v, vc.pickTime));
    vc.step = 'choose'; render();
  } catch (e) {
    if (run !== vc.run) return;
    vc.err = { video: 'This video couldn\'t be opened. Try another clip, or record one with your phone\'s camera.',
      model: 'The body tracker couldn\'t start on this device. Check you\'re online the first time you use it, then try again.',
      nobody: 'Couldn\'t find anyone in this video. Try a clip where your whole body is in view, closer to the camera, in good light.' }[e.message]
      || 'Something went wrong reading this video. Try another clip.';
    vc.step = 'pick'; render();
  }
}

// Run a check, keeping the screen on, and come back to the start with a message if it fails
async function vcAnalyse(pick) {
  const run = vc.run;
  try { if ('wakeLock' in navigator) vc.wake = await navigator.wakeLock.request('screen'); } catch (e) { /* not allowed */ }
  try { await analyseClip(pick); }
  catch (e) {
    if (run === vc.run) { vcReset(); vc.err = 'Something went wrong while checking this video. Try again, or try a shorter clip.'; render(); }
  }
  if (vc.wake) { vc.wake.release().catch(() => {}); vc.wake = null; }
}

async function analyseClip(pick) {
  vc.pick = pick; vc.step = 'analysing'; vc.cancel = false; vc.progress = 0; render();
  const v = vc.video, dur = Math.min(v.duration, MAX_SECS), fps = dur <= 60 ? 10 : 6;
  holdVideo(v);
  const frames = [];   // kept in time order
  // Their outfit: from the frame they were picked in at first, then the usual outfit over the
  // first moments after it (one frame can have a glove or pad in front of the chest)
  const pick0 = vc.people[pick].outfit, early = [];
  let look = pick0 && (pick0.top || pick0.bottom) ? pick0 : null;
  // Clothes only help if theirs clearly differ from everyone else's in the video (two people in
  // black can't be told apart that way)
  const distinct = look && vc.people.length > 1 && vc.people.every((p, i) => i === pick || !p.outfit || (outfitGap(look, p.outfit) ?? 0) > .25);
  const onFrame = t => {
    let i = frames.length;
    while (i && frames[i - 1].t > t) i--;
    // Follow from the nearest moment where they were seen (or where they were picked)
    let last = vc.people[pick], lastT = vc.pickTime;
    for (const f of frames) if (f.L && Math.abs(f.t - t) < Math.abs(lastT - t)) { last = { hip: hipsOf(f.L), scale: torsoOf(f.L) }; lastT = f.t; }
    const away = Math.abs(t - lastT), area = areaAround(last.hip, last.scale * (1 + Math.min(away, 2) * .5), vc.aspect);
    const img = look && grabColors(v);
    let L = area && follow(detectPeople(v, vc.aspect, area), last, away, look, img);
    let everyone = null;
    if (!L) {
      // Not found close up: look at the whole picture and its slices (the tracker often only
      // spots the biggest person in a wide shot)
      everyone = detectEveryone(v);
      L = follow(everyone, last, away, look, img);
    }
    // Lost them for a while, or following someone whose clothes don't look right (they slipped
    // behind a partner and the tracker slid onto the partner): look at everyone and switch to the
    // person who clearly wears their clothes, if nobody else does
    const dressNow = L && look ? outfitGap(look, outfit(img, L)) : null;
    if (look && distinct && ((!L && away > .5) || (dressNow != null && dressNow > .25))) {
      everyone = everyone || detectEveryone(v);
      const c = everyone.filter(P => seen(P, J.lHip, J.rHip, J.lSh, J.rSh) && torsoOf(P) / last.scale > .6 && torsoOf(P) / last.scale < 1.6)
        .map(P => ({ P, d: outfitGap(look, outfit(img, P)) })).filter(x => x.d != null).sort((a, b) => a.d - b.d);
      if (c.length && c[0].d < .2 && (c.length === 1 || c[1].d - c[0].d > .08) && (dressNow == null || dressNow - c[0].d > .1)) L = c[0].P;
    }
    const lookNow = L && img ? outfit(img, L) : null;
    if (lookNow && Math.abs(t - vc.pickTime) < 1.5 && early.length < 15) { early.push(lookNow); if (early.length >= 3) look = usualOutfit(early); }
    frames.splice(i, 0, { t, L, look: lookNow });
    vc.live = L;
    vc.progress = Math.min(frames.length / (dur * fps), 1); paintProgress();
  };
  // Playing the video through is much quicker than jumping frame by frame (each jump decodes
  // from the last keyframe), so play it from the moment they were picked and look at frames as
  // they go by. Then jump to any moments that were missed (a busy phone can skip frames),
  // working back from the pick for the part before it, so each step starts from a known place.
  await playFrames(v, vc.pickTime, dur, fps, onFrame);
  const missed = [];
  for (let t = .01; t <= dur; t += 1 / fps) if (!frames.some(f => Math.abs(f.t - t) < .6 / fps)) missed.push(t);
  missed.sort((a, b) => (a < vc.pickTime) - (b < vc.pickTime) || (a < vc.pickTime ? b - a : a - b));
  if (!vc.cancel) await seekFrames(v, missed, onFrame);
  if (vc.cancel) { vcReset(); render(); return; }
  if (look && distinct) dropOthers(frames, vc.pickTime);
  if (frames.filter(f => f.L).length < frames.length * .15) {
    vcReset();
    vc.err = "Couldn't follow you through the video. Try a clip where your whole body stays in view, closer to the camera, in good light.";
    render(); return;
  }
  vc.track = { frames, fps: frames.length / Math.max(dur, .1), dur, cut: v.duration > MAX_SECS + .5 };
  vc.report = buildReport(vc.track, vc.kind, vc.stance);
  await seekTo(v, 0);
  vc.step = 'report'; render();
}

// Second check on who was followed: compare each moment's outfit with the person picked (their
// usual outfit around the moment they were picked), smoothed over about a second because arms,
// gloves and pads pass in front of the body. Moments that look like someone else are dropped:
// that was a pad holder or partner the tracker slipped onto.
function dropOthers(frames, pickTime) {
  const near = frames.filter(f => f.L && f.look && Math.abs(f.t - pickTime) < 1.5);
  if (near.length < 3) return;
  const ref = usualOutfit(near.map(f => f.look));
  const d = frames.map(f => f.L && f.look ? outfitGap(ref, f.look) : null);
  const bad = frames.map((f, i) => {
    if (!f.L) return false;
    const around = frames.map((g, j) => Math.abs(g.t - f.t) <= .6 ? d[j] : null).filter(x => x != null);
    return around.length >= 3 && median(around) > .25;
  });
  frames.forEach((f, i) => { if (bad[i]) f.L = null; });
}

function vcReset() {
  if (vc.video) { vc.video.pause(); vc.video.remove(); }
  if (vc.url) URL.revokeObjectURL(vc.url);
  vc.run++;
  Object.assign(vc, { step: 'pick', url: '', video: null, people: [], track: null, report: null, live: null, err: '', cancel: false });
}

/* ---------- Turning joints into coaching notes ---------- */

// Per-frame measurements, in torso lengths (shoulders to hips) so they don't depend on how far
// away the camera is
function measure(track, stance) {
  const S = sides(stance);
  // Their size (torso length) around each moment, over about two seconds: walking toward or away
  // from the camera changes it, so each frame is compared with its neighbours, not the whole clip
  const seenF = track.frames.filter(f => f.L).map(f => ({ t: f.t, s: torsoOf(f.L) }));
  const sizeAt = t => median(seenF.filter(x => Math.abs(x.t - t) <= 1).map(x => x.s)) || median(seenF.map(x => x.s)) || .2;
  const M = track.frames.map(({ t, L }) => {
    if (!L) return { t };
    const tl = sizeAt(t), size = torsoOf(L) / tl;
    if (size < .7 || size > 1.4) return { t };   // a garbled frame: the tracker lost the shape
    const sh = midPt(L[J.lSh], L[J.rSh]), hp = hipsOf(L), m = { t, hip: hp };
    // Hands: how far below the shoulders (for the guard) and, when the face is in view, how far
    // from it (for punches). A hand hanging by the hips is often half hidden, so accept less.
    if (seen(L, J.lSh, J.rSh)) {
      const face = L[J.nose][2] > .5;
      for (const side of ['lead', 'rear']) {
        const w = L[S[side].wr], el = L[S[side].el], s0 = L[S[side].sh];
        // straight: 1 when shoulder, elbow and wrist are in a line, whatever the camera angle
        if (w[2] > (face ? .5 : .3)) m[side] = { reach: face && w[2] > .5 ? gap(w, L[J.nose]) / tl : null, low: (w[1] - sh[1]) / tl,
          straight: el[2] > .5 ? gap(s0, w) / (gap(s0, el) + gap(el, w) || 1) : null };
        else if (w[2] > .3) m[side] = { reach: null, low: (w[1] - sh[1]) / tl, straight: null };
      }
    }
    for (const side of ['lead', 'rear']) {
      const a = L[S[side].an], k = L[S[side].kn];
      // A kicking foot moves fast and blurs, so the tracker is often unsure of it: accept less
      if (a[2] > .2 && seen(L, J.lHip, J.rHip)) m[side + 'Leg'] = (hp[1] - a[1]) / tl;   // ankle height above hips
      if (k[2] > .3 && seen(L, J.lHip, J.rHip)) m[side + 'Knee'] = (hp[1] - k[1]) / tl;   // knee height above hips
    }
    // Which foot is in front, judged by the way they face (nose ahead of the shoulders), so
    // turning round while circling a partner doesn't look like crossing the feet
    const face = L[J.nose][2] > .5 && Math.abs(L[J.nose][0] - sh[0]) > .15 * tl ? Math.sign(L[J.nose][0] - sh[0]) : 0;
    if (seen(L, J.lAn, J.rAn)) m.feet = { width: gap(L[J.lAn], L[J.rAn]) / tl, order: Math.sign(L[S.lead.an][0] - L[S.rear.an][0]) * face };
    m.lean = Math.atan2(sh[0] - hp[0], hp[1] - sh[1]) * 180 / Math.PI;
    m.tl = tl;
    return m;
  });
  // A body bent far more than usual is almost always the tracker muddling two people together
  const usual = median(M.filter(m => m.hip).map(m => m.lean));
  return M.map(m => m.hip && Math.abs(m.lean - usual) > 50 ? { t: m.t } : m);
}

// Strikes: a hand leaves the guard (near the face) and reaches out; a foot rises toward hip height
function findStrikes(M) {
  // Where each hand usually sits (its distance from the face), and whether a hand has left it
  const G = {};
  // (only from moments the hand is up: for someone who drops their hands, home is still the face)
  for (const side of ['lead', 'rear']) {
    const seenHand = M.filter(m => m[side] && m[side].reach != null), upHere = seenHand.filter(m => m[side].low < .6);
    G[side] = upHere.length >= 5 && upHere.length >= seenHand.length / 2 ? median(upHere.map(m => m[side].reach)) : .55;
  }
  const away = (h, side) => (h.reach != null && h.reach > G[side] + .3) || h.low > .6;
  const punches = [], kicks = [];
  for (const side of ['lead', 'rear']) {
    // A punch: the arm straightens and the fist moves well away from where it sits in guard
    // (the usual distance from the face for this hand, so it works at any camera angle)
    const guard = G[side];
    // (a hand hanging down by the hips is straight too, so it must be about shoulder height;
    // a dead-straight arm needs less distance, as a punch toward the camera looks short)
    const out = h => h.low < .6 && (h.straight == null ? h.reach > guard + .3
      : (h.straight > .88 && h.reach > guard + .25) || (h.straight > .95 && h.reach > guard + .1));
    const os = side === 'lead' ? 'rear' : 'lead';
    let cur = null;
    for (const m of M) {
      const h = m[side], o = m[os] && m[os].reach != null ? m[os] : null;
      if (!h || h.reach == null) {
        // Lost sight of the hand mid-punch: end it there (how fast it came back is unknown)
        if (cur && m.t - cur.seen > .6) { punches.push(cur); cur = null; }
        continue;
      }
      if (cur) cur.seen = m.t;
      // (when the other hand is the one reaching further, this one is just turning with the body)
      if (out(h) && !(o && o.reach - G[os] > h.reach - guard)) {
        if (!cur) cur = { side, start: m.t, reach: 0, seen: m.t };
        if (h.reach > cur.reach) Object.assign(cur, { t: m.t, reach: h.reach, rise: h.reach - guard, otherOut: o ? away(o, os) : null, lean: m.lean });
      } else if (cur && (h.reach < guard + .15 || h.low > .6)) { cur.back = m.t - cur.t; punches.push(cur); cur = null; }   // back home, or dropped
    }
    if (cur) punches.push(cur);
    // The tracker can briefly lose an arm mid-punch, splitting one punch in two: peaks closer
    // together than a real double jab are one punch
    for (let i = punches.length - 1; i > 0; i--) {
      const a = punches[i - 1], b = punches[i];
      if (a.side === side && b.side === side && b.t - a.t < .35) { if (b.reach > a.reach) Object.assign(a, b, { start: a.start }); punches.splice(i, 1); }
    }
    // A kick (or knee): one foot rises well above the standing foot. A single odd frame is
    // usually the tracker slipping, so it needs two frames in a row unless the foot gets high.
    const other = side === 'lead' ? 'rear' : 'lead';
    // Usual height of this foot compared with the other (in stance, the one nearer the camera
    // can sit a little higher in the picture)
    const both = key => M.filter(m => m[side + key] != null && m[other + key] != null).map(m => m[side + key] - m[other + key]);
    const base = median(both('Leg')), baseK = median(both('Knee'));
    let k = null;
    // (one frame is enough only when the foot itself gets up high; a lone knee blip is usually the tracker)
    const close = () => { if (k && (k.n >= 2 || k.high)) kicks.push(k); k = null; };
    for (const m of M) {
      // (a standing foot up near the hips is the tracker guessing, e.g. with the feet out of shot)
      const y = m[side + 'Leg'], yo = m[other + 'Leg'] != null && m[other + 'Leg'] < -.6 ? m[other + 'Leg'] : null;
      const yk = m[side + 'Knee'], yko = m[other + 'Knee'];
      if (y == null && yk == null) { if (k && m.t - k.last > .25) close(); continue; }
      // A kick lifts the foot; a knee strike lifts the knee to about hip height
      const footUp = y != null && y > -1.1 && (yo == null ? y > -.3 : y - yo - base > .4);
      const kneeUp = yk != null && yk > -.3 && yko != null && yk - yko - baseK > .4;
      if (footUp || kneeUp) {
        if (!k) k = { side, start: m.t, n: 0, height: -9 };
        k.n++; k.last = m.t; if (footUp && y > -.2) k.high = true;
        const hgt = Math.max(footUp ? y : -9, kneeUp ? yk : -9);
        if (hgt > k.height) Object.assign(k, { t: m.t, height: hgt, bothDown: m.lead && m.rear ? m.lead.low > .6 && m.rear.low > .6 : null });
      } else if (k) close();
    }
    close();
  }
  // Arms swing and straighten during a kick; those aren't punches. And seen side-on, the
  // other arm can look stretched out too, so two "punches" at once count as the bigger one.
  const real = punches.filter(p => !kicks.some(k => p.t >= k.start - .5 && p.t <= k.t + .5))
    .filter((p, _, all) => !all.some(q => q !== p && Math.abs(q.t - p.t) < .25 && (q.rise > p.rise || (q.rise === p.rise && q.side === 'rear'))));
  // One kick read twice (both legs at once, or the knee lifting then the foot): keep the higher.
  // Two real kicks are rarely less than half a second apart.
  const kicked = kicks.filter(k => !kicks.some(q => q !== k && q.start <= k.last + .5 && k.start <= q.last + .5 && (q.height > k.height || (q.height === k.height && q.t < k.t))));
  return { punches: real.sort((a, b) => a.t - b.t), kicks: kicked.sort((a, b) => a.t - b.t) };
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
  const punching = (t, side) => punches.some(p => p.side === side && t >= p.t - .4 && t <= p.t + Math.min(p.back || .5, 1));
  const notes = [], drills = new Set();
  const note = (area, good, text, times = [], drill) => { notes.push({ area, good, text, times: times.slice(0, 5) }); if (good === false && drill) drills.add(drill); };
  const pct = (a, b) => b ? Math.round(a / b * 100) : 0;

  // Guard: a hand counts as dropped when it sits well below the shoulders while not punching or
  // kicking. Each hand is judged whenever it can be seen (one is often hidden behind the body).
  const low = (m, side) => m[side] && m[side].low > .6 && !punching(m.t, side);
  const handFrames = side => M.filter(m => m[side] && !kicking(m.t));
  const guardFrames = M.filter(m => (m.lead || m.rear) && !kicking(m.t));
  const up = pct(guardFrames.filter(m => !low(m, 'lead') && !low(m, 'rear')).length, guardFrames.length);
  // Filmed side-on, the tracker can't reliably tell the left arm from the right (the shoulders
  // overlap), so it doesn't say which hand, or judge the hand that isn't punching
  const sideOn = median(track.frames.filter(f => f.L).map(f => gap(f.L[J.lSh], f.L[J.rSh]) / torsoOf(f.L))) < .45;
  const share = side => handFrames(side).length >= 10 ? pct(handFrames(side).filter(m => low(m, side)).length, handFrames(side).length) : 0;
  const lowLead = share('lead'), lowRear = share('rear');
  if (lowLead >= 20 && lowRear >= 20) {
    note('Guard', false, `Both hands drop below your shoulders about ${Math.round((lowLead + lowRear) / 2)}% of the time. Keep them up by your face.`,
      runs(M, m => (low(m, 'lead') || low(m, 'rear')) && !kicking(m.t)), 'slip');
  } else {
    for (const [side, label, lowShare] of [['rear', 'Your rear hand', lowRear], ['lead', 'Your lead hand', lowLead]]) {
      if (lowShare >= 20) note('Guard', false, sideOn ? `One of your hands sits below your shoulders about ${lowShare}% of the time. Keep both hands up by your face.`
        : `${label} sits below your shoulders about ${lowShare}% of the time. Keep it up by your ${side === 'rear' ? 'cheek' : 'face'}.`,
        runs(M, m => low(m, side) && !kicking(m.t)), 'slip');
    }
  }
  if (guardFrames.length >= 10 && up >= 85) note('Guard', true, `Hands stayed up ${up}% of the time. Good habit.`);
  if (guardFrames.length < 10) note('Guard', null, "Couldn't see your hands clearly enough to check your guard. Film with your body turned a little toward the camera.");
  const mine = punches.filter(p => p.otherOut !== null), lazy = mine.filter(p => p.otherOut);
  if (!sideOn && mine.length >= 3 && lazy.length / mine.length >= .3) {
    note('Guard', false, `When you punch, the other hand drifts away from your face (${lazy.length} of ${mine.length} punches). Keep it home by your chin.`,
      lazy.map(p => p.t), 'jab');
  }

  // Punches
  const lead = punches.filter(p => p.side === 'lead').length, rear = punches.length - lead;
  if (punches.length) {
    note('Punches', true, `${punches.length} punch${punches.length === 1 ? '' : 'es'} picked up${sideOn ? '' : `: ${lead} with the lead hand, ${rear} with the rear hand`}.`);
    const slow = track.fps >= 8 ? punches.filter(p => p.back > .6) : [];
    if (punches.length >= 3 && slow.length / punches.length >= .3) {
      note('Punches', false, `Some punches hang out before coming back. Snap them straight back to guard.`, slow.map(p => p.t), 'jab');
    }
    const usual = median(M.filter(m => m.lean != null).map(m => m.lean));
    const over = punches.filter(p => Math.abs(p.lean - usual) > 18);
    if (over.length >= 2) note('Punches', false, `You lean over on some punches. Keep your head over your knees and let the feet close the distance.`, over.map(p => p.t), 'distance');
  } else if (kind !== 'spar') {
    note('Punches', false, 'No punches picked up. Make sure your arms are in view, and film from the side or at an angle: punches straight at the camera are hard to see.');
  }

  // Kicks
  if (kicks.length) {
    const h = k => k.height > .9 ? 'head' : k.height > -.3 ? 'body' : 'low';
    const count = c => kicks.filter(k => h(k) === c).length;
    const parts = ['low', 'body', 'head'].filter(count).map(c => `${count(c)} ${c} height`).join(', ');
    note('Kicks', true, `${kicks.length} kick${kicks.length === 1 ? '' : 's'} or knee${kicks.length === 1 ? '' : 's'} picked up: ${parts}.`);
    const open = kicks.filter(k => k.bothDown);
    if (open.length && open.length / kicks.length >= .5) {
      note('Kicks', false, `Both hands drop when you kick (${open.length} of ${kicks.length}). The arm on the kicking side can swing down, but keep the other hand by your face.`,
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

  // Footwork: crossed feet. The feet swap ends AND pass close together (narrower than the usual
  // stance), briefly. A switch step, switch kick or switch knee also swaps the feet, but lands
  // them a full stance apart, so it isn't counted (nor is anything just before a kick or knee).
  const order = median(M.filter(m => m.feet && m.feet.width > .5 && m.feet.order).map(m => m.feet.order));
  const usualW = median(widths);
  const switching = t => kicks.some(k => t >= k.start - 1 && t <= k.last + .6);
  const crossing = m => m.feet && order && m.feet.order === -order && m.feet.width > .25 && m.feet.width < .7 * usualW && !switching(m.t);
  const crossed = [];
  for (let i = 0; i < M.length; i++) {
    if (!crossing(M[i])) continue;
    let j = i;
    while (j + 1 < M.length && (crossing(M[j + 1]) || !M[j + 1].feet)) j++;
    const len = M[j].t - M[i].t;
    if (len >= .2 && len <= 1.2) crossed.push(M[i].t);   // longer than that is a change of stance
    i = j;
  }
  if (crossed.length) note('Footwork', false, 'Your feet crossed here. Step with the foot nearest the direction you move first, so they never pass each other.', crossed, 'angles');
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
    <div class="vc-stage" id="vcStage"><canvas class="vc-ov"></canvas></div>
    <div class="bar"><i style="width:${Math.round(vc.progress * 100)}%"></i></div><p class="muted small vc-at"></p>
    <p class="muted small">Keep this screen open until it's done.</p>
    <button class="btn ghost wide" data-act="vc-cancel">Cancel</button></section>`;
  if (vc.step === 'choose') return head + `<section class="card"><h2>Which one is you?</h2>
    <p class="muted small">There's more than one person in this video. Tap yourself.</p>
    <div class="vc-stage" id="vcStage"><canvas class="vc-ov"></canvas>
      ${vc.people.map((p, i) => { const a = vc.aspect, [bx0, y0, bx1, y1] = p.box;
        // Boxes round just the joints are thin; widen them so they're easy to tap
        const pad = Math.max(0, (y1 - y0) * .4 - (bx1 - bx0)) / 2, x0 = Math.max(0, bx0 - pad), x1 = Math.min(a, bx1 + pad);
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
    <div class="stats">${stat(r.punches, 'punches', 'glove')}${stat(r.kicks, 'kicks', 'kick')}${stat(r.up == null ? '–' : r.up + '%', 'hands up', 'chart')}</div></section>
  ${r.cover < .6 ? `<p class="card note warn">I could only see you clearly in ${Math.round(r.cover * 100)}% of the clip, so these notes are rough. Try the filming tips for a better read.</p>` : ''}
  ${vc.track.cut ? '<p class="card note">Only the first 3 minutes were checked.</p>' : ''}
  ${Object.entries(groups).map(([area, ns]) => `<section class="card"><h2>${esc(area)}</h2><ul class="vc-notes">${ns.map(n =>
    `<li class="${n.good ? 'good' : n.good === null ? 'info' : 'fix'}"><b>${n.good ? '✓' : n.good === null ? 'i' : '!'}</b><div><p>${esc(n.text)}</p>${n.times.length ? `<div class="chips">${n.times.map(chip).join('')}</div>` : ''}</div></li>`).join('')}</ul></section>`).join('')
    || '<p class="card">Nothing stood out. Try a longer clip with more punches and kicks.</p>'}
  ${r.drills.length ? `<section class="card"><h2>What to drill</h2><div class="picks">${r.drills.map(id => techById(id)).filter(Boolean)
    .map(t => `<button class="pick" data-act="vc-drill" data-id="${t.id}">${esc(t.name)}</button>`).join('')}</div></section>` : ''}
  <p class="muted small center">This is an automatic check from body tracking. It measures positions, not timing or power, and the camera angle can fool it. A coach's eye still beats it.</p>
  <button class="btn wide" data-act="vc-reset">Check another video</button>`;
}

// Put the video element into the page after each render and keep the skeleton overlay drawn
function mountVideo() {
  const stage = document.getElementById('vcStage');
  if (!vc.video) return;
  // Off this screen (or on one without a picture) the video waits in the hidden holder, so a
  // check keeps going if you switch tabs
  if (!stage) return holdVideo(vc.video);
  const v = vc.video;
  v.controls = vc.step === 'report';
  if (v.parentNode !== stage) stage.prepend(v);
  stage.style.aspectRatio = vc.aspect;
  // Upright phone videos would fill the whole screen: cap the height, keeping the shape
  stage.style.maxWidth = `min(100%, calc(50vh * ${vc.aspect}))`;
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
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  const g = cv.getContext('2d');
  g.clearRect(0, 0, w, h);
  const skeleton = (L, color) => {
    g.strokeStyle = color; g.lineWidth = 3; g.lineCap = 'round';
    for (const [a, b] of BONES) {
      if (L[a][2] < .2 || L[b][2] < .2) continue;   // (a fast-moving leg is often marked unsure)
      g.beginPath(); g.moveTo(L[a][0] / vc.aspect * w, L[a][1] * h); g.lineTo(L[b][0] / vc.aspect * w, L[b][1] * h); g.stroke();
    }
  };
  if (vc.step === 'analysing' && vc.live) skeleton(vc.live, '#ff2d55');
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

// Phones drop the screen wake lock when you switch apps; take it back if a check is running
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState !== 'visible' || vc.step !== 'analysing' || !('wakeLock' in navigator)) return;
  try { vc.wake = await navigator.wakeLock.request('screen'); } catch (e) { /* not allowed */ }
});

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
    case 'vc-pick': if (vc.step === 'choose') vcAnalyse(+el.dataset.i); break;   // (once, even if tapped twice)
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
