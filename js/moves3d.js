/* 3D mannequin demos. A wooden-mannequin figure built from simple shapes and posed in code,
   so there are no model files or licences to worry about. three.js (js/vendor) only loads
   when a technique with a 3D animation is first shown.
   A pose gives positions for the hips, fists and ankles plus body turn and lean; the elbows
   and knees are worked out with two-bone IK (the "pole" says which way they bend).
   The fighter faces +X, toward the bag, in orthodox stance. Units are metres. */

let THREE3 = null;
const loadThree = () => THREE3 ? Promise.resolve(THREE3)
  : import(new URL('js/vendor/three.module.min.js', location.href).href).then(m => (THREE3 = m));

// Segment lengths
const BODY = { thigh: .46, shin: .46, upper: .3, fore: .29, torso: .5, hipW: .1, shW: .19, neck: .1, head: .11 };

// yaw = which way the hips face, chestYaw = the shoulders (degrees from +X toward +Z);
// lean = forward tilt, tilt = sideways tilt toward the right shoulder (negative = toward the left);
// lPoint/rPoint = how much the foot points along the shin (0 = flat, 1 = toes fully pointed)
const G3 = { hip: [0, .93, .03], yaw: 35, chestYaw: 30, lean: 6, tilt: 0,
  lF: [.34, 1.52, -.08], rF: [.2, 1.48, .1], lA: [.3, .08, -.12], rA: [-.24, .14, .2],
  lElb: [0, -1, -.4], rElb: [0, -1, .5], lKn: [1, 0, -.3], rKn: [1, 0, .5], lPoint: 0, rPoint: .3 };
const pose3 = changes => Object.assign({}, G3, changes);

const J3 = pose3({ hip: [.2, .92, .02], yaw: 40, chestYaw: 45, lean: 6,
  lF: [.82, 1.55, -.08], rF: [.36, 1.5, .12], lA: [.55, .08, -.1], rA: [-.12, .14, .2], lElb: [0, -1, -.6] });
// Cross: hips and shoulders turn so the right shoulder drives forward, the back heel turns out
// (up on the ball of the foot), and the lead hand stays home by the face.
const C3 = pose3({ hip: [.11, .92, .03], yaw: 0, chestYaw: -10, lean: 10,
  lF: [.36, 1.52, -.14], rF: [.79, 1.48, .03], rA: [-.25, .15, .29], rKn: [1, 0, -.4], rElb: [0, -1, .3], rPoint: .2 });

// Lead hook: a small step in, then the elbow lifts and the fist swings out wide (HL3) and
// round into the side of the bag (H3) as the lead foot, hip and shoulder turn together.
const HL3 = pose3({ hip: [.18, .92, .02], yaw: 40, chestYaw: 40, lean: 8,
  lF: [.5, 1.52, -.3], rF: [.3, 1.5, .24], lA: [.42, .08, -.12], lElb: [0, .5, -1], lKn: [1, 0, -.1] });
const H3 = pose3({ hip: [.25, .92, 0], yaw: 60, chestYaw: 70, lean: 8,
  lF: [.82, 1.45, -.05], rF: [.33, 1.54, .27], lA: [.51, .13, -.21], lElb: [0, .4, -1], lKn: [.5, 0, 1], lPoint: .3 });

// Rear uppercut: dip toward the right side with the knees bent and the hand at chest height (UD3),
// then step in close, drive up from the legs as the back foot follows and turns, and the fist rises into the bag
// with the elbow bent about 90 degrees, lead hand by the face (UH3).
const UD3 = pose3({ hip: [.04, .86, .08], yaw: 30, chestYaw: 20, lean: 10, tilt: 10,
  lF: [.3, 1.48, .1], rF: [.3, 1.14, .16], rElb: [0, -1, 0], rPoint: .2 });
const UH3 = pose3({ hip: [.36, .93, .03], yaw: 0, chestYaw: -10, lean: 12,
  lF: [.6, 1.52, -.14], rF: [.78, 1.5, .04], lA: [.52, .08, -.12], rA: [-.12, .15, .27], rKn: [1, 0, -.4], rElb: [1, -1, 0], rPoint: .2 });

// Body shot (lead hook to the liver): step the lead foot off to the left of the bag as the knees
// bend to drop the level, head off the centre line (BD3), then pivot the back foot round to cut the
// angle, turn the hip and hook the fist into the side of the bag at belt height (BH3).
const BD3 = pose3({ hip: [.14, .74, -.3], yaw: 45, chestYaw: 40, lean: 18, tilt: -16,
  lF: [.52, 1, -.44], rF: [.54, 1.31, -.18], lA: [.44, .08, -.42], rA: [-.24, .14, .12], lElb: [0, -1, -.5], lKn: [1, 0, -.5], rPoint: .1 });
const BH3 = pose3({ hip: [.26, .72, -.26], yaw: 75, chestYaw: 85, lean: 4, tilt: -18,
  lF: [.88, .98, -.17], rF: [.58, 1.33, -.1], lA: [.52, .16, -.48], rA: [-.32, .15, -.04], lElb: [0, .2, -1], lKn: [.5, 0, 1], rKn: [1, 0, .3], lPoint: .3, rPoint: 0 });

// Teep: weight back on the rear leg, lift the lead knee high (TC3), then push the hips
// through and drive the ball of the foot straight into the bag (T3), leaning back slightly.
const TC3 = pose3({ hip: [-.06, .95, .08], yaw: 20, chestYaw: 25, lean: 0,
  lF: [.18, 1.57, -.04], rF: [.14, 1.5, .14], lA: [.35, .55, -.1], lKn: [1, .3, 0] });
const T3 = pose3({ hip: [.1, .98, .02], yaw: 10, chestYaw: 20, lean: -25,
  lF: [.08, 1.58, -.13], rF: [.12, 1.5, .12], lA: [.77, 1.22, -.05], lKn: [0, 1, 0] });

// Muay Thai round kick with the rear (right) leg: step out at an angle with the lead foot,
// pivot on its ball so the heel turns toward the bag, turn the hips right over, and swing the
// leg round from the side in a flat arc so the shin lands on the side of the bag.
const RSTEP3 = pose3({ hip: [.14, .94, -.08], yaw: 15, chestYaw: 15, lean: 4,
  lF: [.36, 1.52, -.16], rF: [.22, 1.47, .04], lA: [.4, .1, -.32], rA: [-.2, .16, .2], lKn: [1, 0, -.6], rPoint: .5 });
const RSWING3 = pose3({ hip: [.22, .97, -.14], yaw: -40, chestYaw: -20, lean: -4, tilt: -12,
  lF: [.3, 1.55, -.26], rF: [.3, 1.12, .38], lA: [.4, .12, -.32], rA: [.42, .7, .79],
  lKn: [-.2, 0, -1], rKn: [.5, .7, -.2], rElb: [0, -.3, 1], lPoint: .35, rPoint: .7 });
const RKICK3 = pose3({ hip: [.3, 1, -.2], yaw: -105, chestYaw: -60, lean: -12, tilt: -25,
  lF: [.25, 1.6, -.35], rF: [.26, .98, .08], lA: [.4, .12, -.32], rA: [1.06, 1.09, .38],
  lElb: [0, -1, -.5], rElb: [0, 0, 1], lKn: [-1, 0, -.3], rKn: [0, .5, -1], lPoint: .35, rPoint: .85 });

// Slip and roll: slip the head a hand-width off the centre line (SL3) by shifting the hips and
// tilting, sink through the knees and let the head travel under (RL3), then come up on the other
// side (RU3). The hands go with the head and the eyes stay on the target.
const SL3 = pose3({ hip: [.04, .9, .06], yaw: 40, chestYaw: 52, lean: 8, tilt: 10,
  rA: [-.24, .17, .2], rPoint: .2, lF: [.36, 1.47, .1], rF: [.22, 1.44, .26] });
const RL3 = pose3({ hip: [.04, .79, -.05], yaw: 40, chestYaw: 30, lean: 20, tilt: 0,
  rA: [-.24, .17, .2], rPoint: .15, lF: [.4, 1.4, -.08], rF: [.4, 1.38, .22], lElb: [0, -1, -.6], rElb: [0, -1, .6] });
const RU3 = pose3({ hip: [.05, .88, -.04], yaw: 35, chestYaw: 25, lean: 8, tilt: -12,
  rA: [-.24, .17, .2], rPoint: .2, lF: [.34, 1.5, -.22], rF: [.3, 1.45, 0] });

// Low kick: the same step and hip turn, but the leg is lifted only a little above the target
// (LSWING3), then the shin chops down and through the bag's thigh height (LKICK3). The body
// leans over the kick and the hands stay up, so it reads as a downward cut, not a body kick.
const LSWING3 = pose3({ hip: [.22, .95, -.14], yaw: -40, chestYaw: -20, lean: 2, tilt: -8,
  lF: [.36, 1.55, -.38], rF: [.42, .96, .3], lA: [.4, .145, -.32], rA: [.6, .75, .5],
  lKn: [-.2, 0, -1], rKn: [.5, .1, -.3], rElb: [0, -.3, 1], lPoint: .35, rPoint: .7 });
const LKICK3 = pose3({ hip: [.28, .95, -.2], yaw: -100, chestYaw: -55, lean: -6, tilt: -12,
  lF: [.36, 1.56, -.52], rF: [.26, .93, .08], lA: [.4, .145, -.32], rA: [1.0, .72, .36],
  lElb: [0, -1, -.5], rElb: [0, 0, 1], lKn: [-1, 0, -.3], rKn: [0, .5, -1], lPoint: .35, rPoint: .6 });

// Switch kick: the switch puts the feet in a southpaw stance, so the kick is the mirror image of
// the round kick: left and right swap, and everything on the other side of the centre line.
const mirrorPose3 = p => {
  const z = v => [v[0], v[1], -v[2]], out = { ...p, yaw: -p.yaw, chestYaw: -p.chestYaw, tilt: -p.tilt, hip: z(p.hip) };
  for (const [l, r] of [['lF', 'rF'], ['lA', 'rA'], ['lElb', 'rElb'], ['lKn', 'rKn']]) [out[l], out[r]] = [z(p[r]), z(p[l])];
  [out.lPoint, out.rPoint] = [p.rPoint, p.lPoint];
  return out;
};
const SW3 = mirrorPose3(RSTEP3), SWS3 = mirrorPose3(RSWING3), SWK3 = mirrorPose3(RKICK3);

// Clinch knee: close in with both hands on the sides of the bag, as if holding the back of the
// head (KC3), then pull down, drive the hips forward and bring the rear knee up into the bag at
// about hip height with the toes pointed down (KK3). The lead foot stays put, up on its ball.
const KC3 = pose3({ hip: [.42, .93, .02], yaw: 15, chestYaw: 5, lean: 8,
  lF: [.98, 1.5, -.25], rF: [.98, 1.5, .25], lA: [.62, .1, -.14], rA: [.2, .14, .18], lElb: [0, -1, -.3], rElb: [0, -1, .3], lPoint: .2 });
const KK3 = pose3({ hip: [.5, .98, .02], yaw: 15, chestYaw: 5, lean: -10,
  lF: [.95, 1.42, -.25], rF: [.95, 1.42, .25], lA: [.62, .1, -.14], rA: [.68, .86, .13], rKn: [1, .9, 0],
  lElb: [0, -1, -.3], rElb: [0, -1, .3], lPoint: .35, rPoint: .85 });

// Rear horizontal elbow: step in close (ES3), then turn the back heel, hips and shoulders through,
// further than on a cross, so the folded forearm swings level and the point of the elbow leads
// into the bag at head height. The fist ends by your own left ear; the lead hand guards the face (E3).
const ES3 = pose3({ hip: [.3, .92, .03], lF: [.64, 1.52, -.08], rF: [.5, 1.48, .1], lA: [.6, .08, -.12], rA: [.06, .14, .2] });
const E3 = pose3({ hip: [.35, .93, .04], yaw: -5, chestYaw: -40, lean: 10,
  lF: [.431, 1.6, -.21], rF: [.562, 1.477, -.116], lA: [.6, .08, -.12], rA: [.034, .138, .294],
  lElb: [0, -1, -.4], rElb: [.989, .093, .113], rKn: [1, 0, -.4], rPoint: .2 });

// Checking a kick: lift the lead knee up toward the lead elbow, shin turned a little out to meet
// the kick, tall on the standing leg (CK3). Then the foot goes straight back down and a cross
// counters (the cross poses).
const CK3 = pose3({ hip: [-.02, .97, .05], yaw: 35, chestYaw: 30, lean: 10,
  lF: [.37, 1.49, -.19], rF: [.2, 1.5, .08], lA: [.38, .62, -.34], lElb: [1, -.8, -.6], lKn: [.5, 1, .1], lPoint: .2 });

// ---- Batch 1 of the moves from the owner's clips: rear hooks, lead uppercut, lead and rising elbows ----
// Rear hook: the elbow comes up and out (RHL3), then the hips and shoulders turn through and the
// rear fist swings round into the right side of the bag, forearm level, back heel turned (RH3).
const RHL3 = pose3({ hip: [.14, .92, .04], yaw: 25, chestYaw: 15, lean: 8,
  lF: [.36, 1.52, -.12], rF: [.34, 1.5, .3], rElb: [0, .4, 1] });
const RH3 = pose3({ hip: [.28, .92, .02], yaw: -15, chestYaw: -35, lean: 8,
  lF: [.46, 1.5, -.16], rF: [.87, 1.5, .17], lA: [.32, .08, -.12], rA: [-.25, .15, .29], rKn: [1, 0, -.4], rElb: [0, .5, 1], rPoint: .2 });
// Rear hook to the body: bend the knees to drop the level about 10 cm (RBD3), then turn through and
// hook the rear fist into the side of the bag at belt height, lead hand at the chin (RBH3).
const RBD3 = pose3({ hip: [.14, .84, .06], yaw: 25, chestYaw: 15, lean: 12, tilt: 6,
  lF: [.36, 1.42, -.1], rF: [.36, 1.2, .26], rElb: [0, -1, .6] });
const RBH3 = pose3({ hip: [.36, .84, .02], yaw: -20, chestYaw: -40, lean: 10,
  lF: [.54, 1.38, -.12], rF: [.87, 1, .17], lA: [.32, .08, -.14], rA: [-.25, .15, .29], rKn: [1, 0, -.4], rElb: [0, -.5, 1], rPoint: .2 });
// Lead uppercut: dip a little toward the lead side with the hand low (LUD3), then drive up, turning
// the lead hip and foot, and the lead fist rises into the bag, rear hand at the chin (LUH3).
const LUD3 = pose3({ hip: [.06, .86, -.02], yaw: 45, chestYaw: 45, lean: 10, tilt: -10,
  lF: [.36, 1.16, -.18], rF: [.24, 1.46, .12], lElb: [0, -1, 0] });
const LUH3 = pose3({ hip: [.24, .93, 0], yaw: 55, chestYaw: 60, lean: 10,
  lF: [.795, 1.5, -.02], rF: [.44, 1.5, .16], lA: [.44, .1, -.12], lKn: [.5, 0, 1], lElb: [1, -1, 0], lPoint: .2 });
// Lead horizontal elbow: step in (ELS3), then turn the hips and shoulders right through and the
// point of the lead elbow lands on the bag at head height, fist by the opposite ear (EL3).
const ELS3 = pose3({ hip: [.3, .92, .03], lF: [.62, 1.52, -.08], rF: [.48, 1.5, .12], lA: [.5, .1, -.12], rA: [-.1, .14, .2] });
const EL3 = pose3({ hip: [.38, .93, .02], yaw: 60, chestYaw: 80, lean: 8,
  lF: [.64, 1.5, .14], rF: [.48, 1.52, .2], lA: [.5, .1, -.12], rA: [-.1, .14, .2], lKn: [.5, 0, 1], lElb: [1, .2, -.6], lPoint: .2 });
// Rising elbows: from close range, the elbow comes straight up the centre line and its point lands
// under the chin (on the bag, at chin height), fist up by the forehead, other hand guarding.
const ERL3 = pose3({ hip: [.42, .93, .02], yaw: 45, chestYaw: 50, lean: 4,
  lF: [.56, 1.8, -.06], rF: [.54, 1.52, .16], lA: [.5, .1, -.12], rA: [-.12, .14, .2], lElb: [1, .3, 0], lPoint: .2 });
const ERR3 = pose3({ hip: [.46, .93, .02], yaw: -10, chestYaw: -50, lean: 4,
  lF: [.6, 1.52, -.16], rF: [.66, 1.85, .06], lA: [.44, .08, -.12], rA: [-.12, .15, .26], rKn: [1, 0, -.4], rElb: [1, .3, 0], rPoint: .2 });

// One 3D pose for each keyframe of the matching 2D demo in moves.js (same timing and cues)
const POSES3D = {
  jab: [G3, J3, J3, G3, G3],
  cross: [G3, C3, C3, G3, G3],
  hook: [G3, HL3, H3, H3, G3, G3],
  uppercut: [G3, UD3, UH3, UH3, G3, G3],
  body: [G3, BD3, BH3, BH3, G3, G3],
  teep: [G3, TC3, T3, T3, TC3, G3, G3],
  slip: [G3, SL3, RL3, RU3, G3, G3],
  'low-kick': [G3, RSTEP3, LSWING3, LKICK3, LKICK3, G3, G3],
  roundhouse: [G3, RSTEP3, RSWING3, RKICK3, RKICK3, G3, G3],
  'switch-kick': [G3, SW3, SWS3, SWK3, SWK3, G3, G3],
  clinch: [G3, KC3, KK3, KK3, KC3, G3],
  'hook-rear': [G3, RHL3, RH3, RH3, G3, G3],
  'body-rear': [G3, RBD3, RBH3, RBH3, G3, G3],
  'uppercut-lead': [G3, LUD3, LUH3, LUH3, G3, G3],
  'elbow-lead': [G3, ELS3, EL3, EL3, G3, G3],
  'elbow-rise-lead': [G3, ELS3, ERL3, ERL3, G3, G3],
  'elbow-rise-rear': [G3, ES3, ERR3, ERR3, G3, G3],
  check: [G3, CK3, CK3, G3, C3, C3, G3, G3],
  elbow: [G3, ES3, E3, E3, G3, G3],
};

// Right vs wrong: each move can also be played with one common mistake, so you can compare.
// Only the keyframes that change are listed; the rest are the same as the right version.
// (The red trail still shows the right path.)
const WRONG3D = {
  jab: { text: 'Rear hand drops as you jab', why: 'Your chin is open to their counter.',
    keys: { 1: { rF: [.3, 1.15, .22], rElb: [0, -1, .5] }, 2: { rF: [.3, 1.15, .22], rElb: [0, -1, .5] } } },
  cross: { text: 'Lead hand drops as you throw', why: 'Your chin is open to their left hook.',
    keys: { 1: { lF: [.32, 1.12, -.24], lElb: [0, -1, -.4] }, 2: { lF: [.32, 1.12, -.24], lElb: [0, -1, -.4] } } },
  hook: { text: 'Swinging it wide and loopy', why: 'It takes longer to land and they see it coming.',
    keys: { 1: { lF: [.42, 1.38, -.66], lElb: [0, -1, -.6] }, 2: { lF: [.8, 1.36, -.14], lElb: [0, -1, -.5] }, 3: { lF: [.8, 1.36, -.14], lElb: [0, -1, -.5] } } },
  uppercut: { text: 'Dropping the hand to the waist to load up', why: 'It shows the punch coming and opens your head.',
    keys: { 1: { rF: [.2, .96, .26] } } },
  body: { text: 'Reaching down by bending at the waist', why: 'Your head ends up low and in front, open to a knee or uppercut.',
    keys: { 1: { hip: [.14, .9, -.22], lean: 42, rF: [.48, 1.12, .16] }, 2: { hip: [.26, .9, -.2], lean: 36, rF: [.52, 1.12, .24] }, 3: { hip: [.26, .9, -.2], lean: 36, rF: [.52, 1.12, .24] } } },
  slip: { text: 'Ducking down and looking at the floor', why: 'You can\'t see the next punch coming.',
    keys: { 2: { hip: [.02, .82, 0], lean: 62, lF: [.58, 1.02, -.16], rF: [.58, 1.02, .24] } } },
  roundhouse: { text: 'Leaning back too far', why: 'You lose balance and power, and can\'t follow up.',
    keys: { 2: { lean: -20, tilt: -24 }, 3: { lean: -34, tilt: -40 }, 4: { lean: -34, tilt: -40 } } },
  'switch-kick': { text: 'Dropping your hands as you switch', why: 'They can hit you while you kick.',
    keys: { 1: { lF: [.3, 1.12, -.15], rF: [.3, 1.12, .3] }, 2: { rF: [.3, 1.1, .3] }, 3: { rF: [.3, 1.1, .3] }, 4: { rF: [.3, 1.1, .3] } } },
  'low-kick': { text: 'Dropping your hands', why: 'A low kick puts you in range, so they can hit you as you kick.',
    keys: { 2: { lF: [.36, 1.12, -.42] }, 3: { lF: [.4, 1.1, -.5] }, 4: { lF: [.4, 1.1, -.5] } } },
  teep: { text: 'Leaning back and falling off balance', why: 'There\'s no push behind it, and it\'s easy to sweep you.',
    keys: { 2: { lean: -36 }, 3: { lean: -36 } } },
  clinch: { text: 'Elbows open wide', why: 'They can slip their arms inside and break your hold.',
    keys: { 1: { lElb: [0, -.2, -1], rElb: [0, -.2, 1] }, 2: { lElb: [0, -.2, -1], rElb: [0, -.2, 1] }, 3: { lElb: [0, -.2, -1], rElb: [0, -.2, 1] }, 4: { lElb: [0, -.2, -1], rElb: [0, -.2, 1] } } },
  check: { text: 'Leaning away from the kick', why: 'You fall off balance and can\'t counter, or get knocked over.',
    keys: { 1: { lean: -14, tilt: 20, hip: [-.1, .95, .1] }, 2: { lean: -14, tilt: 20, hip: [-.1, .95, .1] } } },
  elbow: { text: 'Dropping the other hand as you throw', why: 'At this range, their elbow lands on your open face.',
    keys: { 2: { lF: [.5, 1.12, -.26] }, 3: { lF: [.5, 1.12, -.26] } } },
};
// The animations as they were before they were matched to the owner's own footage (Nov 2026),
// kept so either version can be picked per move. They play as `move + '~old'`, with their own timing.
const ORIGINAL3D = (() => {
  const J = pose3({ hip: [.07, .92, .02], yaw: 40, chestYaw: 45, lean: 8,
    lF: [.82, 1.5, -.08], rF: [.24, 1.48, .12], lA: [.42, .08, -.1], rA: [-.17, .14, .2], lElb: [0, -1, -.6] });
  const T = pose3({ hip: [.02, .98, .02], yaw: 10, chestYaw: 20, lean: -15,
    lF: [.08, 1.58, -.13], rF: [.12, 1.5, .12], lA: [.76, 1, -.05], lKn: [0, 1, 0] });
  const RK = { ...RKICK3, lean: -5 };
  const LK = { ...LKICK3, hip: [.3, .95, -.2], lean: 12, rA: [1.0, .55, .3] };
  const KK = { ...KK3, hip: [.38, .98, .02], lean: -6, rA: [.6, .64, .13], rKn: [1, .6, 0] };
  return {
    jab: { poses: [G3, J, J, G3, G3], ms: [700, 160, 200, 240, 400] },
    cross: { poses: POSES3D.cross, ms: [700, 200, 220, 260, 400] },
    teep: { poses: [G3, TC3, T, T, TC3, G3, G3], ms: [650, 200, 180, 160, 160, 240, 400] },
    roundhouse: { poses: [G3, RSTEP3, RSWING3, RK, RK, G3, G3], ms: [700, 240, 220, 200, 300, 340, 400] },
    'low-kick': { poses: [G3, RSTEP3, LSWING3, LK, LK, G3, G3], ms: [700, 240, 220, 180, 300, 340, 400] },
    'switch-kick': { poses: [G3, SW3, SWS3, mirrorPose3(RK), mirrorPose3(RK), G3, G3], ms: [700, 200, 200, 200, 300, 340, 400] },
    clinch: { poses: [G3, KC3, KK, KK, KC3, G3], ms: [700, 300, 240, 260, 240, 340] },
  };
})();
for (const [m, o] of Object.entries(ORIGINAL3D)) POSES3D[m + '~old'] = o.poses;

// Combinations use the 3D poses of the moves they're made of, frame for frame (see COMBOS in moves.js)
for (const c of COMBOS) POSES3D[c.id] = DEMOS[c.id].frames.map(([m, i]) => m ? POSES3D[m][i] : G3);
for (const [move, w] of Object.entries(WRONG3D)) POSES3D[move + '~wrong'] = POSES3D[move].map((p, i) => w.keys[i] ? Object.assign({}, p, w.keys[i]) : p);

const VIEWS = { side: [90, 10], front: [22, 8], behind: [205, 12], angle: [58, 14] }; // [azimuth, elevation] degrees
// Moves that show a faint trail of the striking foot or fist's path, from keyframe a to b.
// It makes the shape of the strike obvious: a round kick's foot travels in an arc, a teep's in a line.
const TRAILS = { jab: [0, 1], cross: [0, 1], hook: [0, 2], 'hook-rear': [0, 2], uppercut: [1, 2], 'uppercut-lead': [1, 2], body: [1, 2], 'body-rear': [1, 2],
  'elbow-lead': [1, 2], 'elbow-rise-lead': [1, 2], 'elbow-rise-rear': [1, 2], teep: [0, 2], roundhouse: [1, 3], 'switch-kick': [1, 3], 'low-kick': [1, 3], slip: [0, 3],
  clinch: [1, 2], elbow: [1, 2] };
const TRAIL_JOINT = { 'rear-leg': 'anR', 'lead-leg': 'anL', 'rear-arm': 'fiR', 'lead-arm': 'fiL', head: 'head' };
// ...except moves that strike with the knee or elbow, where the trail follows that joint
const TRAIL_JOINT_MOVE = { clinch: 'knR', elbow: 'elR', 'elbow-lead': 'elL', 'elbow-rise-lead': 'elL', 'elbow-rise-rear': 'elR' };

function trailPoints(T, move, hot) {
  const [a, b] = TRAILS[move], joint = TRAIL_JOINT_MOVE[move] || TRAIL_JOINT[hot], pts = [];
  for (let i = a; i < b; i++) for (let k = 0; k < 1; k += .1) pts.push(skeleton(T, splinePose3(move, i, i + 1, k))[joint]);
  pts.push(skeleton(T, splinePose3(move, b - 1, b, 1))[joint]);
  return pts;
}

// The angle each move opens at: the round kick reads best from the kicking side, a little above,
// where you see the leg come round (from behind it looks like a push kick)
// the hook from above and in front, to see the fist curve round; the teep from the lead-leg side,
// to see the knee lift then the straight push
const START_VIEW = { 'hook-rear': [145, 40], 'body-rear': [130, 25], 'uppercut-lead': [-70, 12], 'elbow-lead': [-50, 15],
  'elbow-rise-lead': [-80, 8], 'elbow-rise-rear': [80, 8], check: [-70, 12], roundhouse: [110, 26], 'switch-kick': [-110, 26], 'low-kick': [95, 8], hook: [35, 40], uppercut: [70, 12], body: [-40, 30], teep: [-75, 12], slip: [205, 14],
  clinch: [75, 12], elbow: [75, 40] };

/* ---------- Pose maths ---------- */

const rad = d => d * Math.PI / 180;

// Smooth 3D motion along the same curve as the 2D (splinePose in moves.js). The feet are
// handled as offsets from the hips with their own length, so a leg swings round the hip in an
// arc (as a real leg does) instead of sliding in a straight line, which looked like a knee lift.
const relCache = {}, durCache = {};
function relPoses(move) {
  return relCache[move] || (relCache[move] = POSES3D[move].map(p => {
    const r = Object.assign({}, p);
    for (const k of ['lA', 'rA']) { r[k] = p[k].map((v, i) => v - p.hip[i]); r[k + 'Len'] = Math.hypot(...r[k]); }
    return r;
  }));
}
// A foot that's on the floor at both ends of a step is worked out on the floor instead (from the
// hips, a planted foot drifts as the body turns over it): it stays put, pivots on the ball of the
// foot (the toes stay where they are and the heel turns), or steps, lifting a little on the way.
const toeCache = new WeakMap();
const toesOf = p => toeCache.get(p) || toeCache.set(p, (s => ({ lA: s.toeL, rA: s.toeR }))(skeleton(THREE3, p))).get(p);
const lerp3 = (a, b, e) => a.map((v, i) => v + (b[i] - v) * e);
function splinePose3(move, a, b, u) {
  const base = move.split('~')[0];
  const D = durCache[move] || (durCache[move] = move.endsWith('~old') ? ORIGINAL3D[base].ms : DEMOS[base].seq.map(f => f[1]));
  const p = splinePose(relPoses(move), D, a, b, u), out = Object.assign({}, p);
  const pa = POSES3D[move][a], pb = POSES3D[move][b], e = u * u * (3 - 2 * u);
  for (const k of ['lA', 'rA']) {
    if (pa[k][1] < .22 && pb[k][1] < .22) {
      const moved = Math.hypot(...pa[k].map((v, i) => v - pb[k][i]));
      const ta = toesOf(pa)[k].toArray(), tb = toesOf(pb)[k].toArray();
      if (moved < .03) out[k] = lerp3(pa[k], pb[k], e);
      else if (Math.hypot(...ta.map((v, i) => v - tb[i])) < .06) {
        // pivot: turn the heel round the toes, keeping the foot its own length
        const oa = pa[k].map((v, i) => v - ta[i]), ob = pb[k].map((v, i) => v - tb[i]), o = lerp3(oa, ob, e);
        const len = Math.hypot(...oa) + (Math.hypot(...ob) - Math.hypot(...oa)) * e, ol = Math.hypot(...o) || 1;
        out[k] = lerp3(ta, tb, e).map((v, i) => v + o[i] / ol * len);
      } else {
        out[k] = lerp3(pa[k], pb[k], e);
        out[k][1] += Math.sin(Math.PI * u) * Math.min(.05, moved * .25);
      }
      continue;
    }
    const len = Math.hypot(...p[k]);
    out[k] = p.hip.map((h, i) => h + p[k][i] / len * p[k + 'Len']);
  }
  return out;
}

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
  const spine = up.clone().addScaledVector(cf, Math.tan(rad(p.lean))).addScaledVector(cr, Math.tan(rad(p.tilt))).normalize();
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
  // Feet point the way the knee points, square to the shin, or further along it when pointed
  const foot = (kn, an, pole, point) => {
    const shin = an.clone().sub(kn).normalize();
    const flat = V(pole).addScaledVector(shin, -V(pole).dot(shin)).normalize();
    return an.clone().addScaledVector(flat.multiplyScalar(1 - point).addScaledVector(shin, point).normalize(), .17);
  };
  s.toeL = foot(s.knL, s.anL, p.lKn, p.lPoint); s.toeR = foot(s.knR, s.anR, p.rKn, p.rPoint);
  return s;
}

/* ---------- Scene ---------- */

function buildScene(T, canvas, hot, move) {
  const trail = TRAILS[move] && trailPoints(T, move, hot);
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
  // Phones have very dense screens; 1.5x is plenty sharp and much less work per frame
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = true;
  const scene = new T.Scene(), camera = new T.PerspectiveCamera(32, 1, .1, 30);

  scene.add(new T.HemisphereLight(0xffffff, 0x8a7f74, 1.7));
  const sun = new T.DirectionalLight(0xffffff, 2.2);
  sun.position.set(2, 4, 3); sun.castShadow = true;
  sun.shadow.mapSize.set(512, 512);
  Object.assign(sun.shadow.camera, { left: -1.6, right: 1.6, top: 1.6, bottom: -1.6 });
  scene.add(sun);

  const floor = new T.Mesh(new T.CircleGeometry(1.5, 48), new T.ShadowMaterial({ opacity: .22 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const ring = new T.Mesh(new T.RingGeometry(1.47, 1.5, 64), new T.MeshBasicMaterial({ color: 0x888888, transparent: true, opacity: .35 }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = .002; scene.add(ring);

  // Heavy bag in front of the fighter, so you can see where the shots land
  // It hangs from the top of its chain and swings a little when a strike lands.
  // (low kicks need it lower; a combination with a low kick gets a longer bag, for head and leg)
  const lowKick = move === 'low-kick', comboLow = !!(DEMOS[move] && DEMOS[move].combo && DEMOS[move].combo.moves.includes('low-kick'));
  const bagY = lowKick ? .85 : comboLow ? 1 : 1.15, bagH = comboLow ? 1.3 : 1, swing = new T.Group();
  swing.position.set(1.04, bagY + bagH / 2 + .5, 0); scene.add(swing);
  const bag = new T.Mesh(new T.CylinderGeometry(.17, .17, bagH, 24), new T.MeshStandardMaterial({ color: 0x7a2630, roughness: .6 }));
  bag.position.y = -.5 - bagH / 2; bag.castShadow = true; swing.add(bag);
  const chain = new T.Mesh(new T.CylinderGeometry(.008, .008, .5, 6), new T.MeshStandardMaterial({ color: 0x777777 }));
  chain.position.y = -.25; swing.add(chain);

  // The strike's path: a see-through red tube with an arrowhead at the end
  if (trail) {
    const curve = new T.CatmullRomCurve3(trail), glow = new T.MeshBasicMaterial({ color: 0xd62839, transparent: true, opacity: .35, depthWrite: false });
    scene.add(new T.Mesh(new T.TubeGeometry(curve, 48, .018, 8), glow));
    const tip = new T.Mesh(new T.ConeGeometry(.045, .12, 12), glow);
    tip.position.copy(curve.getPoint(1));
    tip.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), curve.getTangent(1));
    scene.add(tip);
  }

  const mat = c => new T.MeshStandardMaterial({ color: c, roughness: .55 });
  const wood = mat(0xd9b48c), joint = mat(0xb0845a), glove = mat(matchMedia('(prefers-color-scheme: dark)').matches ? 0x4a4a56 : 0x26262c), red = mat(0xd62839);
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

  // Which limb is red can change during a combination: one per strike
  const LIMBS = { 'lead-arm': ['upperL', 'foreL', 'gloveL'], 'rear-arm': ['upperR', 'foreR', 'gloveR'], 'lead-leg': ['thighL', 'shinL', 'footL'], 'rear-leg': ['thighR', 'shinR', 'footR'] };
  let hotNow = hot;
  const setHot = h => {
    if (h === hotNow) return;
    hotNow = h;
    for (const [limb, names] of Object.entries(LIMBS)) for (const k of names) parts[k].material = limb === h ? red : k.startsWith('glove') ? glove : wood;
  };

  const UP = new T.Vector3(0, 1, 0), tmp = new T.Vector3();
  const place = (m, a, b) => {
    m.position.copy(a).add(b).multiplyScalar(.5);
    m.quaternion.setFromUnitVectors(UP, tmp.copy(b).sub(a).normalize());
  };
  // The bag swings like a pendulum (about 2 seconds a swing, settling quickly). A fist, shin or
  // foot, knee or elbow that reaches it while moving toward it gives it a push, once per strike.
  const bob = { x: 0, z: 0, vx: 0, vz: 0, t: 0, prev: null, hit: {} };
  const STRIKERS = [['fiL', .075], ['fiR', .075], ['elL', .05], ['elR', .05], ['knL', .07], ['knR', .07], ['anL', .055], ['anR', .055],
    ['toeL', .04], ['toeR', .04], ['shinL', .06], ['shinR', .06]]
    .filter(([j]) => !(move === 'clinch' && j.startsWith('fi')));   // in the clinch the gloves only hold the bag
  const swingBag = s => {
    s = Object.assign({}, s, { shinL: s.knL.clone().lerp(s.anL, .6), shinR: s.knR.clone().lerp(s.anR, .6) });
    const now = performance.now(), dt = bob.t ? Math.min((now - bob.t) / 1000, .05) : 0;
    bob.t = now;
    if (dt > 0 && bob.prev) for (const [j, r] of STRIKERS) {
      const p = s[j], q = bob.prev[j], dx = 1.04 - p.x, dz = -p.z, d = Math.hypot(dx, dz) || 1;
      if (p.y < bagY - bagH / 2 - .05 || p.y > bagY + bagH / 2 + .05 || d - .17 - r > .03 || now - (bob.hit[j] || 0) < 400 || Object.values(bob.hit).some(h => now - h < 150)) continue;   // (once per strike; combinations can land a few tenths apart)
      const toward = ((p.x - q.x) * dx + (p.z - q.z) * dz) / d / dt;   // speed toward the bag, m/s
      if (toward < .2) continue;
      bob.hit[j] = now;
      const push = Math.min((.15 + .05 * toward) * (/^(fi|el)/.test(j) ? 1 : 2), .6);   // a leg hits harder than a fist or elbow
      bob.vx += push * dx / d; bob.vz += push * dz / d;
    }
    bob.vx += (-10.9 * bob.x - 1.8 * bob.vx) * dt; bob.vz += (-10.9 * bob.z - 1.8 * bob.vz) * dt;
    bob.x = Math.max(-.15, Math.min(.15, bob.x + bob.vx * dt)); bob.z = Math.max(-.15, Math.min(.15, bob.z + bob.vz * dt));
    swing.rotation.z = bob.x; swing.rotation.x = -bob.z;
    bob.prev = Object.fromEntries(STRIKERS.map(([j]) => [j, s[j].clone()]));
  };
  const pose = p => {
    const s = skeleton(T, p), P = parts;
    swingBag(s);
    place(P.torso, s.H, s.chest); place(P.hips, s.hipL, s.hipR); place(P.shoulders, s.shL, s.shR);
    place(P.neck, s.chest, s.head); P.head.position.copy(s.head);
    P.face.position.copy(s.head).addScaledVector(s.cf, .075);
    place(P.upperL, s.shL, s.elL); place(P.foreL, s.elL, s.fiL); P.gloveL.position.copy(s.fiL); P.elL.position.copy(s.elL);
    place(P.upperR, s.shR, s.elR); place(P.foreR, s.elR, s.fiR); P.gloveR.position.copy(s.fiR); P.elR.position.copy(s.elR);
    place(P.thighL, s.hipL, s.knL); place(P.shinL, s.knL, s.anL); place(P.footL, s.anL, s.toeL); P.knL.position.copy(s.knL);
    place(P.thighR, s.hipR, s.knR); place(P.shinR, s.knR, s.anR); place(P.footR, s.anR, s.toeR); P.knR.position.copy(s.knR);
  };

  const [az, el] = START_VIEW[move] || VIEWS.angle, view = { az, el };
  // Southpaw: the whole scene is mirrored (left and right swap), and so is the camera angle, so
  // each view shows the mirror image of the orthodox one
  let mirror = false;
  const setMirror = m => { mirror = m; scene.scale.z = m ? -1 : 1; };
  setMirror(!!(typeof state !== 'undefined' && state.southpaw));
  const target = new T.Vector3(.3, 1, 0);
  // Only resize when the card's size changes. (Comparing pixel sizes instead resized on every
  // frame on phones with a fractional pixel ratio, which made the animation stutter.)
  let size = '';
  const render = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (w + 'x' + h !== size) { size = w + 'x' + h; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
    const r = 4.1, a = rad(mirror ? -view.az : view.az), e = rad(view.el);
    camera.position.set(target.x + r * Math.cos(e) * Math.cos(a), target.y + r * Math.sin(e), target.z + r * Math.cos(e) * Math.sin(a));
    camera.lookAt(target);
    renderer.render(scene, camera);
  };
  const dispose = () => {
    scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    renderer.dispose(); renderer.forceContextLoss();
  };
  return { pose, render, view, dispose, bob, setMirror, setHot };   // (bob: the bag swing, read by tests)
}

/* ---------- Opening and closing the 3D view ---------- */

const viewers = new Set();

// Swap a demo card's 2D drawing for the 3D mannequin. If 3D can't run on this phone, the card
// quietly keeps the 2D drawing instead.
async function open3d(el) {
  if (el._3d) return;
  const box = document.createElement('div');
  box.className = 'demo3d';
  box.innerHTML = `<canvas aria-label="3D animation of the technique. Drag sideways to turn it."></canvas>
    <p class="d3-msg">Loading 3D…</p>
    <div class="d3-views">${['side', 'front', 'behind'].map(v => `<button data-act="demo-view" data-view="${v}">${v[0].toUpperCase() + v.slice(1)}</button>`).join('')}</div>`;
  el.querySelector('svg').style.display = 'none';
  el.querySelector('svg').after(box);
  el._3d = { ready: false, box };
  try {
    const T = await loadThree();
    if (!box.isConnected) return;
    const v = buildScene(T, box.querySelector('canvas'), DEMOS[el.dataset.move].hot, el.dataset.move);
    Object.assign(el._3d, v, { ready: true });
    viewers.add(el._3d);
    box.querySelector('.d3-msg').remove();
    dragToTurn(box.querySelector('canvas'), el);
    demoState(el, performance.now()).drawn = false;
  } catch (e) {
    // (no 3D: keep the 2D drawing, and drop the right/wrong switch, which only works in 3D)
    if (el._3d && el._3d.box === box) { close3d(el); el.querySelector('.rw')?.remove(); el._wrong = false; }
  }
}

function close3d(el) {
  const v = el._3d;
  if (v.ready) { v.dispose(); viewers.delete(v); }
  v.box.remove();
  el.querySelector('svg').style.display = '';
  el._3d = null; demoState(el, performance.now()).drawn = false;
}

// Sideways drags turn the figure; up-and-down swipes still scroll the page
function dragToTurn(canvas, el) {
  let x0 = null;
  canvas.addEventListener('pointerdown', e => { x0 = e.clientX; });
  canvas.addEventListener('pointermove', e => {
    if (x0 === null || !el._3d) return;
    el._3d.view.az += (e.clientX - x0) * .5 * (state.southpaw ? -1 : 1); x0 = e.clientX; el._st.drawn = false;
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(n => canvas.addEventListener(n, () => { x0 = null; }));
}

// Draw the 3D pose for keyframe i (blending from prev); called by the shared loop in moves.js
function draw3d(el, prev, i, k) {
  const v = el._3d;
  if (!v.ready) return false;
  const d = DEMOS[el.dataset.move];
  if (d.combo || d.perStep) v.setHot(d.seq[i][3] || null);
  v.pose(splinePose3(el.dataset.move + (el._wrong ? '~wrong' : ''), prev, i, k));
  v.render();
  return true;
}

// Free the graphics memory of 3D views that are no longer on screen (after the page re-renders)
function sweep3d() {
  for (const v of viewers) if (!v.box.isConnected) { v.dispose(); viewers.delete(v); }
}
