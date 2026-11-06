/* 3D mannequin demos. A wooden-mannequin figure built from simple shapes and posed in code,
   so there are no model files or licences to worry about. three.js (js/vendor) only loads
   when someone taps "3D view".
   A pose gives positions for the hips, fists and ankles plus body turn and lean; the elbows
   and knees are worked out with two-bone IK (the "pole" says which way they bend).
   The fighter faces +X, toward the bag, in orthodox stance. Units are metres. */

let THREE3 = null;
const loadThree = () => THREE3 ? Promise.resolve(THREE3)
  : import(new URL('js/vendor/three.module.min.js', location.href).href).then(m => (THREE3 = m));

// Segment lengths
const BODY = { thigh: .46, shin: .46, upper: .3, fore: .29, torso: .5, hipW: .1, shW: .19, neck: .1, head: .11 };

// yaw = which way the hips face, chestYaw = the shoulders (degrees from +X toward +Z); lean is forward tilt
const G3 = { hip: [0, .93, .03], yaw: 35, chestYaw: 30, lean: 6,
  lF: [.34, 1.52, -.08], rF: [.2, 1.48, .1], lA: [.3, .08, -.12], rA: [-.24, .1, .2],
  lElb: [0, -1, -.4], rElb: [0, -1, .5], lKn: [1, 0, -.3], rKn: [1, 0, .5] };
const pose3 = changes => Object.assign({}, G3, changes);

const J3 = pose3({ hip: [.07, .92, .02], yaw: 40, chestYaw: 45, lean: 8,
  lF: [.82, 1.5, -.08], rF: [.24, 1.48, .12], lA: [.42, .08, -.1], rA: [-.17, .1, .2], lElb: [0, -1, -.6] });
const RC3 = pose3({ hip: [.04, .97, 0], yaw: -10, chestYaw: 10, lean: -8,
  lF: [.34, 1.52, -.1], rF: [0, 1.2, .3], lA: [.32, .12, -.12], rA: [.25, .62, .12], rKn: [1, .6, .2], rElb: [0, -1, .6] });
const RK3 = pose3({ hip: [.02, .98, .02], yaw: -55, chestYaw: -20, lean: -22,
  lF: [.3, 1.55, -.12], rF: [-.25, .95, .35], lA: [.32, .12, -.12], rA: [.86, 1.08, -.22], rKn: [.3, 1, -.3], rElb: [0, -1, .3] });

// One 3D pose for each keyframe of the matching 2D demo in moves.js (same timing and cues)
const POSES3D = {
  jab: [G3, J3, J3, G3, G3],
  roundhouse: [G3, RC3, RK3, RK3, G3, G3],
};

const VIEWS = { side: [90, 10], front: [22, 8], behind: [205, 12], angle: [58, 14] }; // [azimuth, elevation] degrees

/* ---------- Pose maths ---------- */

const rad = d => d * Math.PI / 180;
const blend3 = (a, b, t) => Object.fromEntries(Object.keys(a).map(k =>
  [k, Array.isArray(a[k]) ? a[k].map((v, i) => v + (b[k][i] - v) * t) : a[k] + (b[k] - a[k]) * t]));

// Two-bone IK: from joint a, reach toward target with bones l1 and l2, bending toward pole
function ik(T, a, target, l1, l2, pole) {
  const to = target.clone().sub(a);
  const d = Math.max(.05, Math.min(to.length(), (l1 + l2) * .999)), dir = to.normalize();
  const x = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(l1 * l1 - x * x, 0));
  const bend = pole.clone().addScaledVector(dir, -pole.dot(dir)).normalize();
  return [a.clone().addScaledVector(dir, x).addScaledVector(bend, h), a.clone().addScaledVector(dir, d)];
}

// Joint positions for a pose
function skeleton(T, p) {
  const V = a => new T.Vector3(...a), up = new T.Vector3(0, 1, 0);
  const facing = deg => new T.Vector3(Math.cos(rad(deg)), 0, Math.sin(rad(deg)));
  const rightOf = f => new T.Vector3(-f.z, 0, f.x);
  const H = V(p.hip), pr = rightOf(facing(p.yaw));
  const cf = facing(p.chestYaw), cr = rightOf(cf);
  const spine = up.clone().multiplyScalar(Math.cos(rad(p.lean))).addScaledVector(cf, Math.sin(rad(p.lean)));
  const chest = H.clone().addScaledVector(spine, BODY.torso);
  const s = {
    H, chest, cf,
    hipL: H.clone().addScaledVector(pr, -BODY.hipW), hipR: H.clone().addScaledVector(pr, BODY.hipW),
    shL: chest.clone().addScaledVector(cr, -BODY.shW), shR: chest.clone().addScaledVector(cr, BODY.shW),
    head: chest.clone().addScaledVector(spine, BODY.neck + BODY.head),
  };
  [s.elL, s.fiL] = ik(T, s.shL, V(p.lF), BODY.upper, BODY.fore, V(p.lElb));
  [s.elR, s.fiR] = ik(T, s.shR, V(p.rF), BODY.upper, BODY.fore, V(p.rElb));
  [s.knL, s.anL] = ik(T, s.hipL, V(p.lA), BODY.thigh, BODY.shin, V(p.lKn));
  [s.knR, s.anR] = ik(T, s.hipR, V(p.rA), BODY.thigh, BODY.shin, V(p.rKn));
  // Feet point the way the knee points, square to the shin
  const foot = (kn, an, pole) => {
    const shin = an.clone().sub(kn).normalize();
    return an.clone().addScaledVector(V(pole).addScaledVector(shin, -V(pole).dot(shin)).normalize(), .17);
  };
  s.toeL = foot(s.knL, s.anL, p.lKn); s.toeR = foot(s.knR, s.anR, p.rKn);
  return s;
}

/* ---------- Scene ---------- */

function buildScene(T, canvas, hot) {
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  const scene = new T.Scene(), camera = new T.PerspectiveCamera(32, 1, .1, 30);

  scene.add(new T.HemisphereLight(0xffffff, 0x8a7f74, 1.7));
  const sun = new T.DirectionalLight(0xffffff, 2.2);
  sun.position.set(2, 4, 3); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -1.6, right: 1.6, top: 1.6, bottom: -1.6 });
  scene.add(sun);

  const floor = new T.Mesh(new T.CircleGeometry(1.5, 48), new T.ShadowMaterial({ opacity: .22 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const ring = new T.Mesh(new T.RingGeometry(1.47, 1.5, 64), new T.MeshBasicMaterial({ color: 0x888888, transparent: true, opacity: .35 }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = .002; scene.add(ring);

  // Heavy bag in front of the fighter, so you can see where the shots land
  const bag = new T.Mesh(new T.CylinderGeometry(.17, .17, 1, 24), new T.MeshStandardMaterial({ color: 0x7a2630, roughness: .6 }));
  bag.position.set(.97, 1.15, 0); bag.castShadow = true; scene.add(bag);
  const chain = new T.Mesh(new T.CylinderGeometry(.008, .008, .5, 6), new T.MeshStandardMaterial({ color: 0x777777 }));
  chain.position.set(.97, 1.9, 0); scene.add(chain);

  const mat = c => new T.MeshStandardMaterial({ color: c, roughness: .55 });
  const wood = mat(0xd9b48c), joint = mat(0xb0845a), glove = mat(0x26262c), red = mat(0xd62839);
  const add = m => { m.castShadow = true; scene.add(m); return m; };
  const cap = (r, len, m) => add(new T.Mesh(new T.CapsuleGeometry(r, len, 6, 14), m));
  const ball = (r, m) => add(new T.Mesh(new T.SphereGeometry(r, 20, 14), m));
  const isHot = part => part === hot;

  const parts = {
    torso: cap(.12, .3, wood), hips: cap(.1, .1, wood), shoulders: cap(.07, .26, wood), neck: cap(.045, .06, wood),
    head: ball(.11, wood), face: ball(.05, joint),
    upperL: cap(.045, .22, isHot('lead-arm') ? red : wood), foreL: cap(.04, .21, isHot('lead-arm') ? red : wood),
    upperR: cap(.045, .22, isHot('rear-arm') ? red : wood), foreR: cap(.04, .21, isHot('rear-arm') ? red : wood),
    gloveL: ball(.075, isHot('lead-arm') ? red : glove), gloveR: ball(.075, isHot('rear-arm') ? red : glove),
    thighL: cap(.07, .34, isHot('lead-leg') ? red : wood), shinL: cap(.055, .36, isHot('lead-leg') ? red : wood),
    thighR: cap(.07, .34, isHot('rear-leg') ? red : wood), shinR: cap(.055, .36, isHot('rear-leg') ? red : wood),
    footL: cap(.04, .12, isHot('lead-leg') ? red : wood), footR: cap(.04, .12, isHot('rear-leg') ? red : wood),
    elL: ball(.05, joint), elR: ball(.05, joint), knL: ball(.07, joint), knR: ball(.07, joint),
  };

  const UP = new T.Vector3(0, 1, 0), tmp = new T.Vector3();
  const place = (m, a, b) => {
    m.position.copy(a).add(b).multiplyScalar(.5);
    m.quaternion.setFromUnitVectors(UP, tmp.copy(b).sub(a).normalize());
  };
  const pose = p => {
    const s = skeleton(T, p), P = parts;
    place(P.torso, s.H, s.chest); place(P.hips, s.hipL, s.hipR); place(P.shoulders, s.shL, s.shR);
    place(P.neck, s.chest, s.head); P.head.position.copy(s.head);
    P.face.position.copy(s.head).addScaledVector(s.cf, .075);
    place(P.upperL, s.shL, s.elL); place(P.foreL, s.elL, s.fiL); P.gloveL.position.copy(s.fiL); P.elL.position.copy(s.elL);
    place(P.upperR, s.shR, s.elR); place(P.foreR, s.elR, s.fiR); P.gloveR.position.copy(s.fiR); P.elR.position.copy(s.elR);
    place(P.thighL, s.hipL, s.knL); place(P.shinL, s.knL, s.anL); place(P.footL, s.anL, s.toeL); P.knL.position.copy(s.knL);
    place(P.thighR, s.hipR, s.knR); place(P.shinR, s.knR, s.anR); place(P.footR, s.anR, s.toeR); P.knR.position.copy(s.knR);
  };

  const view = { az: VIEWS.angle[0], el: VIEWS.angle[1] };
  const target = new T.Vector3(.3, 1, 0);
  const render = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * renderer.getPixelRatio())) { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
    const r = 4.1, a = rad(view.az), e = rad(view.el);
    camera.position.set(target.x + r * Math.cos(e) * Math.cos(a), target.y + r * Math.sin(e), target.z + r * Math.cos(e) * Math.sin(a));
    camera.lookAt(target);
    renderer.render(scene, camera);
  };
  const dispose = () => {
    scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    renderer.dispose(); renderer.forceContextLoss();
  };
  return { pose, render, view, dispose };
}

/* ---------- Opening and closing the 3D view ---------- */

const viewers = new Set();

// Swap a demo card between the 2D drawing and the 3D mannequin
async function toggle3d(el, btn) {
  if (el._3d) { close3d(el); btn.textContent = '3D view'; return; }
  const box = document.createElement('div');
  box.className = 'demo3d';
  box.innerHTML = `<canvas aria-label="3D animation of the technique. Drag sideways to turn it."></canvas>
    <p class="d3-msg">Loading 3D…</p>
    <div class="d3-views">${['side', 'front', 'behind'].map(v => `<button data-act="demo-view" data-view="${v}">${v[0].toUpperCase() + v.slice(1)}</button>`).join('')}</div>`;
  el.querySelector('svg').style.display = 'none';
  el.querySelector('svg').after(box);
  btn.textContent = '2D view';
  el._3d = { ready: false, box };
  try {
    const T = await loadThree();
    if (!box.isConnected) return;
    const v = buildScene(T, box.querySelector('canvas'), DEMOS[el.dataset.move].hot);
    Object.assign(el._3d, v, { ready: true });
    viewers.add(el._3d);
    box.querySelector('.d3-msg').remove();
    dragToTurn(box.querySelector('canvas'), el);
    el._st.drawn = false;
  } catch (e) {
    box.querySelector('.d3-msg').textContent = '3D isn\'t available on this device.';
  }
}

function close3d(el) {
  const v = el._3d;
  if (v.ready) { v.dispose(); viewers.delete(v); }
  v.box.remove();
  el.querySelector('svg').style.display = '';
  el._3d = null; el._st.drawn = false;
}

// Sideways drags turn the figure; up-and-down swipes still scroll the page
function dragToTurn(canvas, el) {
  let x0 = null;
  canvas.addEventListener('pointerdown', e => { x0 = e.clientX; });
  canvas.addEventListener('pointermove', e => {
    if (x0 === null || !el._3d) return;
    el._3d.view.az += (e.clientX - x0) * .5; x0 = e.clientX; el._st.drawn = false;
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(n => canvas.addEventListener(n, () => { x0 = null; }));
}

// Draw the 3D pose for keyframe i (blending from prev); called by the shared loop in moves.js
function draw3d(el, prev, i, k) {
  const v = el._3d, poses = POSES3D[el.dataset.move];
  if (!v.ready) return false;
  v.pose(blend3(poses[prev], poses[i], k));
  v.render();
  return true;
}

// Free the graphics memory of 3D views that are no longer on screen (after the page re-renders)
function sweep3d() {
  for (const v of viewers) if (!v.box.isConnected) { v.dispose(); viewers.delete(v); }
}
