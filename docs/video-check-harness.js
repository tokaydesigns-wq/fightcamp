/* Video check test helpers. NOT loaded by the app. Paste into the browser console on #/video
   (or eval it) to test the tracker and tune the rules in js/video.js.
   - mqTest(SCRIPT, az, el, stance): draws the 3D mannequin doing a known set of moves
     (SCRIPT: 3 jabs, 3 crosses, 2 roundhouses, 2 teeps) from a camera angle, runs the tracker on
     each frame and returns what findStrikes counted. Right answer: 6 punches (3 lead, 3 rear), 4 kicks.
   - retest(): re-runs the rules on every mannequin track made so far (after editing the rules,
     call reload() first to pull in the new measure/findStrikes/buildReport).
   - recordMannequin(SCRIPT): records the same thing as a real .webm (takes about 20 s, needs the
     page visible), to feed through the whole app with vcPickFile(file).
   - testClip(name): loads a clip from CLIP_BASE as a File, as if picked on a phone.
     (python's http.server can't serve byte ranges, so a clip must be loaded as a whole File.)
   - sheet(times): contact sheet of video frames with the tracked skeleton, over the page. */
window.CLIP_BASE = window.CLIP_BASE || 'http://localhost:8131/';
window.testClip = async (name, kind='pads', pickI) => { const b = await (await fetch(CLIP_BASE + name)).blob(); vc.kind = kind; window._t0 = performance.now(); vcPickFile(new File([b], name, {type:'video/webm'})); if (pickI != null) { (async () => { while (vc.step === 'loading') await new Promise(r=>setTimeout(r,300)); if (vc.step === 'choose') vcAnalyse(pickI); })(); } return b.size; };
window.st = () => ({step: vc.step, msg: vc.msg, err: vc.err, people: vc.people.map(p=>p.box.map(x=>x.toFixed(2)).join(',')), pickTime: vc.pickTime, p: vc.progress, secs: (performance.now()-_t0)/1000, rep: vc.report && {...vc.report, notes: vc.report.notes.map(n=>(n.good?'+ ':'- ')+n.area+': '+n.text+' '+n.times.map(t=>t.toFixed(1)).join(','))}, seen: vc.track && vc.track.frames.filter(f=>f.L).length, n: vc.track && vc.track.frames.length, dur: vc.track && vc.track.dur});
window.mannequin = async (script, az = 58, el = 10, fps = 10, W = 640, H = 360, stance = 'orthodox') => {
  const T = await loadThree(); await loadPoseModel();
  const gl = document.createElement('canvas'); gl.style.cssText = `position:fixed;left:0;top:0;width:${W}px;height:${H}px;opacity:.01;pointer-events:none`; document.body.append(gl);
  const sc = buildScene(T, gl, null, null); sc.view.az = az; sc.view.el = el;
  const c2 = document.createElement('canvas'); c2.width = W; c2.height = H; const g = c2.getContext('2d');
  const segs = []; let tt = 0;
  for (const [move, reps] of script) for (let r = 0; r < reps; r++) { const D = DEMOS[move].seq.map(f => f[1]); for (let i = 0; i < D.length; i++) { segs.push({ move, prev: (i - 1 + D.length) % D.length, i, t0: tt, d: D[i] / 1000 }); tt += D[i] / 1000; } }
  const frames = [], aspect = W / H;
  for (let t = .01; t < tt; t += 1 / fps) {
    const s = segs.find(s => t >= s.t0 && t < s.t0 + s.d); const u = (t - s.t0) / s.d;
    sc.pose(splinePose3(s.move, s.prev, s.i, u)); sc.render();
    g.save(); g.fillStyle = '#9aa3ad'; g.fillRect(0, 0, W, H); if (stance === 'southpaw') { g.translate(W, 0); g.scale(-1, 1); } g.drawImage(gl, 0, 0, W, H); g.restore();
    const people = poseModel.detect(c2).landmarks.map(L => L.map(p => [p.x * aspect, p.y, p.visibility]));
    if (frames.length % 10 === 9) await new Promise(r => setTimeout(r));
    frames.push({ t, L: people.find(L => seen(L, J.lHip, J.rHip, J.lSh, J.rSh)) || null, move: s.move });
  }
  sc.dispose(); gl.remove();
  return { track: { frames, fps, dur: tt, cut: false }, seenPct: frames.filter(f => f.L).length / frames.length };
};
window.mqTest = async (script, az, el, stance = 'orthodox') => { const r = await mannequin(script, az, el, 10, 640, 360, stance); window.mq = r; (window.TR = window.TR || {})[az + stance] = r.track; const rep = buildReport(r.track, 'pads', stance); const fs = findStrikes(measure(r.track, stance));
  return { az, stance, seen: r.seenPct.toFixed(2), punches: fs.punches.map(p => p.side[0] + p.t.toFixed(1)).join(' '), kicks: fs.kicks.map(k => k.side[0] + k.t.toFixed(1) + ':' + k.height.toFixed(1)).join(' '), notes: rep.notes.filter(n => !n.good).map(n => n.text.slice(0, 60) + ' ' + n.times.map(t=>t.toFixed(1)).join(',')) }; };
window.retest = () => Object.entries(TR).map(([k, tr]) => { const st = k.replace(/[0-9]/g, ''); const fs = findStrikes(measure(tr, st)); const rep = buildReport(tr, 'pads', st); return k + ' | P ' + fs.punches.map(p => p.side[0] + p.t.toFixed(1)).join(' ') + ' | K ' + fs.kicks.map(k => k.side[0] + k.t.toFixed(1)).join(' ') + ' | ' + rep.notes.filter(n => !n.good).map(n => n.text.slice(0, 40)).join(' / '); });
window.reload = async () => { const src = await (await fetch('js/video.js?' + Date.now())).text(); for (const f of ['measure', 'findStrikes', 'buildReport', 'runs']) { const i = src.indexOf('function ' + f + '('); let d = 0, j = src.indexOf('{', i); for (; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}' && !--d) break; } (0, eval)(src.slice(i, j + 1).replace('function ' + f, 'window.' + f + ' = function')); } return 'reloaded'; };
window.SCRIPT = [['jab', 3], ['cross', 3], ['roundhouse', 2], ['teep', 2]];
'harness ready';
window.sheet = async (times, cols = 2) => { const v = vc.video, W = 360, H = Math.round(360 / vc.aspect); const rows = Math.ceil(times.length / cols); const c = document.createElement('canvas'); c.width = W * cols; c.height = H * rows; const g = c.getContext('2d');
  for (const [i, t] of times.entries()) { const ox = (i % cols) * W, oy = Math.floor(i / cols) * H; await seekTo(v, t); g.drawImage(v, ox, oy, W, H); const f = vc.track.frames.reduce((b, f) => Math.abs(f.t - t) < Math.abs(b.t - t) ? f : b); if (f.L) { g.strokeStyle = '#0f0'; g.lineWidth = 2; for (const [a, b] of BONES) { if (f.L[a][2] < .2 || f.L[b][2] < .2) continue; g.beginPath(); g.moveTo(ox + f.L[a][0] / vc.aspect * W, oy + f.L[a][1] * H); g.lineTo(ox + f.L[b][0] / vc.aspect * W, oy + f.L[b][1] * H); g.stroke(); } } g.fillStyle = '#ff0'; g.font = '18px sans-serif'; g.fillText(t.toFixed(2), ox + 4, oy + 20); }
  let img = document.getElementById('sheetImg'); if (!img) { img = document.createElement('img'); img.id = 'sheetImg'; img.style.cssText = 'position:fixed;left:0;top:0;z-index:999;width:100vw;background:#000'; document.body.append(img); } img.src = c.toDataURL('image/jpeg', .85); return 'ok'; };
// Record the mannequin doing `script` into a real webm video (real time, 30 fps)
window.recordMannequin = async (script, az = 58, el = 10, W = 640, H = 360) => {
  const T = await loadThree();
  const gl = document.createElement('canvas'); gl.style.cssText = `position:fixed;left:0;top:0;width:${W}px;height:${H}px;opacity:.01;pointer-events:none`; document.body.append(gl);
  const sc = buildScene(T, gl, null, null); sc.view.az = az; sc.view.el = el;
  const c2 = document.createElement('canvas'); c2.width = W; c2.height = H; const g = c2.getContext('2d');
  const segs = []; let tt = 0;
  for (const [move, reps] of script) for (let r = 0; r < reps; r++) { const D = DEMOS[move].seq.map(f => f[1]); for (let i = 0; i < D.length; i++) { segs.push({ move, prev: (i - 1 + D.length) % D.length, i, t0: tt, d: D[i] / 1000 }); tt += D[i] / 1000; } }
  const draw = t => { const s = segs.find(s => t >= s.t0 && t < s.t0 + s.d) || segs[segs.length - 1]; sc.pose(splinePose3(s.move, s.prev, s.i, Math.min((t - s.t0) / s.d, 1))); sc.render(); g.fillStyle = '#9aa3ad'; g.fillRect(0, 0, W, H); g.drawImage(gl, 0, 0, W, H); };
  draw(0);
  const stream = c2.captureStream(30), rec = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8', videoBitsPerSecond: 2e6 }), chunks = [];
  rec.ondataavailable = e => chunks.push(e.data);
  const done = new Promise(r => rec.onstop = r);
  rec.start(); const t0 = performance.now();
  await new Promise(res => { const loop = () => { const t = (performance.now() - t0) / 1000; if (t > tt + .3) return res(); draw(t); requestAnimationFrame(loop); }; loop(); });
  rec.stop(); await done; sc.dispose(); gl.remove();
  return new File(chunks, 'mannequin.webm', { type: 'video/webm' });
};
// A phone clip saved in the app folder (e.g. "Test videos", which git ignores), as if picked on a phone
window.testClipMp4 = async (name, kind = 'pads', pickI, dir = '/Test%20videos/') => { const b = await (await fetch(dir + encodeURIComponent(name))).blob(); vc.kind = kind; window._t0 = performance.now(); vcPickFile(new File([b], name, { type: 'video/mp4' })); if (pickI != null) { (async () => { while (vc.step === 'loading') await new Promise(r => setTimeout(r, 300)); if (vc.step === 'choose') vcAnalyse(pickI); })(); } return b.size; };
// Who was followed: time, hip position and top colour every half second
window.trackSum = () => vc.track.frames.filter((f, i) => i % 5 == 0).map(f => f.t.toFixed(1) + (f.L ? ':' + hipsOf(f.L)[0].toFixed(2) + ' ' + (f.look && f.look.top || []).map(Math.round).join(',') : ':-')).join('\n');
window.waitReport = async () => { while (vc.step !== 'report' && vc.step !== 'pick') await new Promise(r => setTimeout(r, 500)); return [vc.step, vc.err, Math.round((performance.now() - _t0) / 1000) + 's', vc.report && vc.report.notes.map(n => (n.good ? '+ ' : n.good === null ? 'i ' : '- ') + n.text.slice(0, 90) + ' ' + n.times.map(t => t.toFixed(1))), vc.report && 'seen ' + vc.report.cover.toFixed(2)]; };
