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
// Hook: the elbow comes up and the fist swings out wide first, then round to the target
const HOOK_LOAD = pose({ head: [151, 58], neck: [151, 82], lE: [182, 96], lF: [196, 84], rF: [160, 80] });
const HOOK = pose({ head: [154, 62], neck: [153, 84], hip: [147, 150], lE: [184, 82], lF: [212, 92], rF: [160, 80], lK: [176, 194] });
// Rear uppercut: dip a little toward the rear side with the knees bent and the hand at chest
// height (UPPER_DIP), then drive up from the legs, the hip turns and the fist rises under the chin
const UPPER_DIP = pose({ head: [146, 66], neck: [147, 90], hip: [143, 158], rE: [134, 128], rF: [168, 106],
  lK: [174, 200], lA: [186, 236], rK: [130, 200], rA: [112, 236] });
const UPPER_HIT = pose({ head: [156, 58], neck: [155, 82], hip: [150, 150], lE: [172, 118], lF: [170, 88], rE: [178, 114], rF: [186, 76],
  lK: [176, 194], lA: [188, 236], rK: [136, 196], rA: [124, 232] });
// Round kick: step out, then the leg swings up and round nearly straight (not a knee lift)
const KICK_STEP = pose({ head: [154, 58], neck: [153, 82], hip: [152, 150], lK: [180, 194], lA: [200, 236], rK: [132, 196], rA: [116, 234] });
const KICK_SWING = pose({ head: [142, 62], neck: [144, 86], hip: [156, 152], rE: [138, 124], rF: [146, 163],
  lK: [176, 196], lA: [196, 234], rK: [186, 182], rA: [222, 196] });
const KICK = pose({ head: [130, 66], neck: [135, 88], hip: [150, 152], lE: [166, 112], lF: [170, 88], rE: [128, 124], rF: [136, 162],
  lK: [176, 196], lA: [196, 234], rK: [192, 140], rA: [238, 128] });
// Switch kick: a small hop swaps the feet (the lead foot goes back), then the lead leg kicks like a
// round kick. Side-on, that's the round kick with the two legs and two arms swapped.
const swapSides = p => ({ ...p, lE: p.rE, lF: p.rF, rE: p.lE, rF: p.lF, lK: p.rK, lA: p.rA, rK: p.lK, rA: p.lA });
const SWITCH = pose({ head: [150, 50], neck: [150, 74], hip: [147, 144], lK: [130, 188], lA: [116, 228], rK: [172, 188], rA: [188, 228] });
const SWITCH_SWING = swapSides(KICK_SWING), SWITCH_KICK = swapSides(KICK);
// Checking a kick: the lead knee comes up toward the lead elbow, then the foot goes down and a cross counters
const CHECK = pose({ head: [148, 58], neck: [148, 82], hip: [146, 150], lE: [170, 124], lF: [176, 94], lK: [188, 170], lA: [196, 214] });
// Body shot: bend the knees to drop the level (head off to the side, hand low), then the hip
// turns and the lead fist hooks into the ribs at belt height while the rear hand guards the chin
const BODY_DIP = pose({ head: [175, 79], neck: [168, 102], hip: [150, 170], lE: [178, 132], lF: [198, 142], rE: [154, 120], rF: [180, 96],
  lK: [196, 193], lA: [214, 236], rK: [150, 221], rA: [108, 236] });
const BODY_HIT = pose({ head: [181, 79], neck: [174, 102], hip: [156, 170], lE: [208, 128], lF: [238, 140], rE: [158, 118], rF: [184, 96],
  lK: [202, 192], lA: [218, 236], rK: [152, 221], rA: [110, 230] });
// Low kick: same step and turn as the round kick, but the leg starts higher and chops DOWN into the thigh
const LOW_SWING = pose({ head: [146, 66], neck: [147, 90], hip: [154, 154], rE: [142, 128], rF: [150, 167],
  lK: [176, 196], lA: [196, 234], rK: [188, 184], rA: [232, 176] });
const LOW_KICK = pose({ head: [140, 74], neck: [143, 97], hip: [150, 156], lE: [166, 116], lF: [170, 92], rE: [136, 134], rF: [142, 172],
  lK: [176, 196], lA: [196, 234], rK: [190, 184], rA: [232, 200] });
const TEEP_CHAMBER = pose({ head: [146, 58], neck: [146, 82], hip: [146, 152], lK: [188, 168], lA: [186, 206] });
const TEEP = pose({ head: [138, 60], neck: [140, 84], hip: [148, 154], lE: [166, 114], lF: [172, 88], lK: [196, 158], lA: [242, 148] });

// Slip and roll: a small dip to slip off the line (SLIP), sink low through the knees (ROLL), then come
// up on the other side with the hands still up (ROLL_UP). In this side view you see the dip and lean.
const SLIP = pose({ head: [153, 64], neck: [152, 87], hip: [146, 153], lE: [176, 118], lF: [182, 92], rF: [162, 86],
  lK: [174, 196], rK: [130, 196] });
const ROLL = pose({ head: [162, 78], neck: [157, 101], hip: [142, 170], lE: [181, 131], lF: [185, 105], rE: [143, 137], rF: [165, 109],
  lK: [188, 192], lA: [186, 236], rK: [153, 220], rA: [112, 236] });
const ROLL_UP = pose({ head: [158, 70], neck: [155, 93], hip: [141, 158], lE: [178, 124], lF: [182, 98], rE: [140, 126], rF: [162, 92],
  lK: [178, 192], rK: [134, 200] });

// Clinch knee: step in with both hands up on their head (CLINCH), then lean back a little, drive
// the hips forward and bring the rear knee up to hip height (KNEE)
const CLINCH = pose({ head: [172, 58], neck: [170, 82], hip: [164, 150], lE: [206, 98], lF: [228, 66], rE: [202, 104], rF: [226, 72],
  lK: [186, 192], lA: [198, 236], rK: [146, 194], rA: [132, 236] });
const KNEE = pose({ head: [166, 58], neck: [167, 82], hip: [170, 150], lE: [198, 106], lF: [232, 86], rE: [194, 110], rF: [228, 92],
  lK: [186, 194], lA: [196, 236], rK: [212, 132], rA: [206, 176] });
// Rear horizontal elbow: step in close (ELBOW_STEP), then turn through so the rear elbow comes
// level at head height with the fist folded back by the face (ELBOW)
const ELBOW_STEP = Object.fromEntries(Object.entries(GUARD).map(([k, [x, y]]) => [k, [x + 16, y]]));
const ELBOW = pose({ head: [170, 58], neck: [168, 82], hip: [160, 150], lE: [178, 118], lF: [188, 84], rE: [206, 72], rF: [172, 70],
  lK: [186, 192], lA: [200, 236], rK: [146, 196], rA: [128, 232] });

// Top-down feet: [x, y, angle in degrees]. Orthodox: lead (left) foot in front, rear foot behind and to the right.
const feet = (lead, rear) => ({ lead, rear });

const DEMOS = {
  jab: { type: 'side', hot: 'lead-arm', seq: [
    [GUARD, 700, 'Guard up, chin down'],
    [JAB, 160, 'Snap it straight out and step with it'],
    [JAB, 120, 'Lead shoulder up to cover your chin'],
    [GUARD, 220, 'Straight back on the same line'],
    [GUARD, 400, 'Guard up, chin down'] ] },
  cross: { type: 'side', hot: 'rear-arm', seq: [
    [GUARD, 700, 'Guard up, chin down'],
    [CROSS, 200, 'Pivot the back foot and turn the hip'],
    [CROSS, 80, 'Lead hand stays home by your face'],
    [GUARD, 180, 'Back to guard, ready to move'],
    [GUARD, 400, 'Guard up, chin down'] ] },
  hook: { type: 'side', hot: 'lead-arm', seq: [
    [GUARD, 700, 'Guard up, chin down'],
    [HOOK_LOAD, 140, 'Elbow up, arm bent at about 90°'],
    [HOOK, 160, 'Turn the foot, hip and shoulder together'],
    [HOOK, 240, 'Rear hand stays glued to your cheek'],
    [GUARD, 260, 'Back to guard'],
    [GUARD, 400, 'Guard up, chin down'] ] },
  uppercut: { type: 'side', hot: 'rear-arm', seq: [
    [GUARD, 700, 'Guard up, chin down'],
    [UPPER_DIP, 200, 'Dip to your right and bend the knees, hand stays close'],
    [UPPER_HIT, 170, 'Drive up from the legs and turn the hip, palm facing you'],
    [UPPER_HIT, 220, 'Lead hand stays home by your face'],
    [GUARD, 260, 'Straight back to guard'],
    [GUARD, 400, 'Guard up, chin down'] ] },
  body: { type: 'side', hot: 'lead-arm', seq: [
    [GUARD, 700, 'Guard up, chin down'],
    [BODY_DIP, 240, 'Step the lead foot off to the left and bend the knees'],
    [BODY_HIT, 180, 'Pivot the back foot to cut the angle, hook into the liver'],
    [BODY_HIT, 240, 'Rear hand stays up by your chin'],
    [GUARD, 300, 'Stand back up to guard'],
    [GUARD, 400, 'Guard up, chin down'] ] },
  slip: { type: 'side', hot: 'head', seq: [
    [GUARD, 700, 'Guard up, eyes on them'],
    [SLIP, 170, 'Slip: move your head just off the line, inches not feet'],
    [ROLL, 260, 'Bend the knees and roll under, hands stay up'],
    [ROLL_UP, 240, 'Come up on the other side, eyes never leave them'],
    [GUARD, 260, 'Back in guard, ready to counter'],
    [GUARD, 400, 'Guard up, eyes on them'] ] },
  roundhouse: { type: 'side', hot: 'rear-leg', seq: [
    [GUARD, 700, 'Stance, hands up'],
    [KICK_STEP, 120, 'Step out at an angle with the lead foot'],
    [KICK_SWING, 110, 'Pivot on the ball of that foot, turn the hip right over'],
    [KICK, 100, 'Swing the leg round flat and hit with the shin'],
    [KICK, 260, 'Lean away, same-side arm swings just past the leg'],
    [GUARD, 300, 'Back to stance'],
    [GUARD, 400, 'Stance, hands up'] ] },
  check: { type: 'side', hot: 'lead-leg', perStep: true, seq: [
    [GUARD, 700, 'Stance, hands up', null],
    [CHECK, 160, 'Kick coming: lift the lead knee up toward your elbow', 'lead-leg'],
    [CHECK, 320, 'Shin turned a little out, stay tall on the standing leg', 'lead-leg'],
    [GUARD, 180, 'Put the foot straight back down', null],
    [CROSS, 200, 'And counter straight away', 'rear-arm'],
    [CROSS, 220, 'Cross lands while they\'re on one leg', 'rear-arm'],
    [GUARD, 260, 'Back to guard', null],
    [GUARD, 400, 'Stance, hands up', null] ] },
  'switch-kick': { type: 'side', hot: 'lead-leg', seq: [
    [GUARD, 700, 'Stance, hands up'],
    [SWITCH, 110, 'Small quick hop: lead foot back, rear foot forward'],
    [SWITCH_SWING, 100, 'Kick straight off the switch, turn the hip over'],
    [SWITCH_KICK, 90, 'Swing the leg round flat and hit with the shin'],
    [SWITCH_KICK, 220, 'Other hand up, same-side arm swings just past the leg'],
    [GUARD, 260, 'Land back in your stance'],
    [GUARD, 400, 'Stance, hands up'] ] },
  'low-kick': { type: 'side', hot: 'rear-leg', seq: [
    [GUARD, 700, 'Stance, hands up'],
    [KICK_STEP, 110, 'Step out at an angle with the lead foot'],
    [LOW_SWING, 100, 'Turn the hip over and lift the leg a little above your target'],
    [LOW_KICK, 90, 'Chop down through the thigh, hit with the lower shin'],
    [LOW_KICK, 180, 'Lean over it, lead hand guards your face, kick goes through'],
    [GUARD, 200, 'Back to stance'],
    [GUARD, 400, 'Stance, hands up'] ] },
  teep: { type: 'side', hot: 'lead-leg', seq: [
    [GUARD, 650, 'Stance, hands up'],
    [TEEP_CHAMBER, 200, 'Lift the knee first'],
    [TEEP, 180, 'Push the hips through, ball of the foot'],
    [TEEP, 160, 'Push the hips through, ball of the foot'],
    [TEEP_CHAMBER, 160, 'Snap it back'],
    [GUARD, 240, 'Snap it back'],
    [GUARD, 400, 'Stance, hands up'] ] },
  clinch: { type: 'side', hot: 'rear-leg', seq: [
    [GUARD, 700, 'Stance, hands up'],
    [CLINCH, 300, 'Close in, hands on the back of the head'],
    [KNEE, 160, 'Pull down, drive the hips forward, knee up'],
    [KNEE, 260, 'Lean back a little, toes pointed down'],
    [CLINCH, 240, 'Foot down, keep hold'],
    [GUARD, 340, 'Push off back to stance'] ] },
  elbow: { type: 'side', hot: 'rear-arm', seq: [
    [GUARD, 700, 'Guard up, chin down'],
    [ELBOW_STEP, 240, 'Step in close: elbows are for short range'],
    [ELBOW, 180, 'Turn the back heel, hips and shoulders, elbow leads'],
    [ELBOW, 260, 'Forearm level, fist by your ear, lead hand guards your face'],
    [GUARD, 300, 'Back to guard'],
    [GUARD, 400, 'Guard up, chin down'] ] },
  angles: { type: 'top', ghost: true, line: true, seq: [
    [feet([150, 150, 10], [176, 194, 45]), 900, 'You are right on their line of attack'],
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

// Combinations: existing moves played back to back. Each move's own opening hold and closing
// hold are dropped and its return to guard is kept short, so one strike flows into the next.
// The striking limb lights up per strike (the 4th item of each step).
const COMBOS = [
  { id: 'combo-12', name: '1-2', moves: ['jab', 'cross'] },
  { id: 'combo-123', name: '1-2-3', moves: ['jab', 'cross', 'hook'] },
  { id: 'combo-12-low', name: '1-2, low kick', moves: ['jab', 'cross', 'low-kick'] },
  { id: 'combo-123-kick', name: '1-2-3, body kick', moves: ['jab', 'cross', 'hook', 'roundhouse'] },
  { id: 'combo-body', name: 'Jab, body, hook', moves: ['jab', 'body', 'hook'] },
  { id: 'combo-upper', name: 'Jab, uppercut, hook', moves: ['jab', 'uppercut', 'hook'] },
];
const SHORT_NAME = { jab: 'Jab', cross: 'Cross', hook: 'Hook', uppercut: 'Uppercut', body: 'Body shot', roundhouse: 'Body kick', 'low-kick': 'Low kick' };
// Which frames of each move a combination uses: [move, index into that move's frames] in order
const comboFrames = c => [['', -1], ...c.moves.flatMap(m => DEMOS[m].seq.slice(1, -1).map((_, i) => [m, i + 1])), ['', -1]];
for (const c of COMBOS) {
  const steps = comboFrames(c);
  DEMOS[c.id] = { type: 'side', hot: null, combo: c, frames: steps, seq: steps.map(([m, i], k) => {
    if (!m) return [GUARD, k ? 600 : 700, k ? 'Back to guard, hands up' : `${c.name}: stance, hands up`];
    const [pose, ms, cue] = DEMOS[m].seq[i], next = steps[k + 1][0];
    // (between strikes the return to guard is quick: the next one starts on the way back)
    return [pose, next && next !== m ? Math.min(ms, 200) : ms, `${SHORT_NAME[m]}: ${cue}`, DEMOS[m].hot];
  }) };
}

/* ---------- Markup ---------- */

// Batch 1 of the moves from the owner's clips. The 2D drawings are only a backup for phones that
// can't run 3D, so they reuse the nearest existing drawing with the arms swapped.
const swapArms = p => ({ ...p, lE: p.rE, lF: p.rF, rE: p.lE, rF: p.lF });
Object.assign(DEMOS, {
  'hook-rear': { type: 'side', hot: 'rear-arm', seq: [
    [GUARD, 700, 'Guard up, chin down'],
    [swapArms(HOOK_LOAD), 140, 'Elbow comes up and out, arm bent'],
    [swapArms(HOOK), 160, 'Turn the back heel, hip and shoulder through'],
    [swapArms(HOOK), 240, 'Forearm level, lead hand glued to your face'],
    [GUARD, 260, 'Back to guard'],
    [GUARD, 400, 'Guard up, chin down'] ] },
  'body-rear': { type: 'side', hot: 'rear-arm', seq: [
    [GUARD, 700, 'Guard up, chin down'],
    [swapArms(BODY_DIP), 240, 'Bend the knees to drop your level'],
    [swapArms(BODY_HIT), 180, 'Turn through and hook the rear fist into the ribs'],
    [swapArms(BODY_HIT), 240, 'Lead hand stays up by your chin'],
    [GUARD, 300, 'Stand back up to guard'],
    [GUARD, 400, 'Guard up, chin down'] ] },
  'uppercut-lead': { type: 'side', hot: 'lead-arm', seq: [
    [GUARD, 700, 'Guard up, chin down'],
    [swapArms(UPPER_DIP), 200, 'Dip a little to your left, hand stays close'],
    [swapArms(UPPER_HIT), 170, 'Drive up and turn the lead hip, fist rises under the chin'],
    [swapArms(UPPER_HIT), 220, 'Rear hand stays home by your face'],
    [GUARD, 260, 'Straight back to guard'],
    [GUARD, 400, 'Guard up, chin down'] ] },
  'elbow-lead': { type: 'side', hot: 'lead-arm', seq: [
    [GUARD, 700, 'Guard up, chin down'],
    [swapArms(DEMOS.elbow.seq[1][0]), 240, 'Step in close: elbows are for short range'],
    [swapArms(DEMOS.elbow.seq[2][0]), 180, 'Turn the hips and shoulders right through, elbow leads'],
    [swapArms(DEMOS.elbow.seq[2][0]), 260, 'Forearm level, fist by your right ear, rear hand guards'],
    [GUARD, 300, 'Back to guard'],
    [GUARD, 400, 'Guard up, chin down'] ] },
  'elbow-rise-lead': { type: 'side', hot: 'lead-arm', seq: [
    [GUARD, 700, 'Guard up, chin down'],
    [swapArms(DEMOS.elbow.seq[1][0]), 240, 'Step in close'],
    [swapArms(DEMOS.elbow.seq[2][0]), 170, 'Drive the lead elbow straight up the middle'],
    [swapArms(DEMOS.elbow.seq[2][0]), 240, 'Point lands under the chin, fist by your forehead'],
    [GUARD, 300, 'Back to guard'],
    [GUARD, 400, 'Guard up, chin down'] ] },
  'elbow-rise-rear': { type: 'side', hot: 'rear-arm', seq: [
    [GUARD, 700, 'Guard up, chin down'],
    [DEMOS.elbow.seq[1][0], 240, 'Step in close'],
    [DEMOS.elbow.seq[2][0], 170, 'Turn the back heel and drive the rear elbow straight up'],
    [DEMOS.elbow.seq[2][0], 240, 'Point lands under the chin, lead hand guards your face'],
    [GUARD, 300, 'Back to guard'],
    [GUARD, 400, 'Guard up, chin down'] ] },
});

// Batch 2: driving knees, switch knee and rear teep (2D backups reuse the clinch and teep drawings)
const KNEE2D = DEMOS.clinch.seq[2][0], STEP2D = DEMOS.clinch.seq[1][0];
Object.assign(DEMOS, {
  'knee-rear': { type: 'side', hot: 'rear-leg', seq: [
    [GUARD, 700, 'Stance, hands up'],
    [STEP2D, 220, 'Step in and reach for the head'],
    [KNEE2D, 180, 'Pull down and drive the hips forward, rear knee up'],
    [KNEE2D, 220, 'Lean back a little, toes pointed down'],
    [GUARD, 300, 'Foot back down to stance'],
    [GUARD, 400, 'Stance, hands up'] ] },
  'knee-lead': { type: 'side', hot: 'lead-leg', seq: [
    [GUARD, 700, 'Stance, hands up'],
    [swapSides(STEP2D), 180, 'Small skip to shift your weight back'],
    [swapSides(KNEE2D), 150, 'Lead knee drives up and through, hips forward'],
    [swapSides(KNEE2D), 220, 'Pull down, lean back, toes pointed'],
    [GUARD, 300, 'Foot back down to stance'],
    [GUARD, 400, 'Stance, hands up'] ] },
  'knee-switch': { type: 'side', hot: 'lead-leg', seq: [
    [GUARD, 700, 'Stance, hands up'],
    [SWITCH, 160, 'Quick switch of the feet'],
    [swapSides(KNEE2D), 160, 'Knee straight off the switch, hips forward'],
    [swapSides(KNEE2D), 220, 'Pull down, lean back a little'],
    [GUARD, 300, 'Land back in your stance'],
    [GUARD, 400, 'Stance, hands up'] ] },
  'teep-rear': { type: 'side', hot: 'rear-leg', seq: [
    [GUARD, 650, 'Stance, hands up'],
    [swapSides(TEEP_CHAMBER), 240, 'Rear knee comes up in front, weight on the lead foot'],
    [swapSides(TEEP), 200, 'Push the hips through, ball of the foot into the target'],
    [swapSides(TEEP), 160, 'Lean back a little, hands by your face'],
    [swapSides(TEEP_CHAMBER), 180, 'Pull the leg straight back'],
    [GUARD, 240, 'Back to stance'],
    [GUARD, 400, 'Stance, hands up'] ] },
});

// Batch 3: side kicks and oblique kicks (2D backups reuse the teep drawings)
Object.assign(DEMOS, {
  'side-kick': { type: 'side', hot: 'lead-leg', seq: [
    [GUARD, 650, 'Stance, hands up'],
    [TEEP_CHAMBER, 220, 'Chamber the lead knee up across your body'],
    [TEEP, 180, 'Turn the hips over and drive the heel straight out'],
    [TEEP, 200, 'Lean your head away, hands stay up'],
    [TEEP_CHAMBER, 180, 'Pull the leg straight back'],
    [GUARD, 240, 'Back to stance'],
    [GUARD, 400, 'Stance, hands up'] ] },
  'side-kick-rear': { type: 'side', hot: 'rear-leg', seq: [
    [GUARD, 650, 'Stance, hands up'],
    [swapSides(TEEP_CHAMBER), 240, 'Pivot on the lead foot and chamber the rear knee'],
    [swapSides(TEEP), 200, 'Hips turn right over, heel drives straight out'],
    [swapSides(TEEP), 200, 'Lean away, hands up'],
    [swapSides(TEEP_CHAMBER), 200, 'Pull the leg back'],
    [GUARD, 260, 'Turn back to stance'],
    [GUARD, 400, 'Stance, hands up'] ] },
  oblique: { type: 'side', hot: 'lead-leg', seq: [
    [GUARD, 700, 'Stance, hands up'],
    [TEEP_CHAMBER, 200, 'Lift the lead knee, toes turned out'],
    [TEEP, 150, 'Stomp down and forward with the sole, just above their knee'],
    [TEEP, 220, 'Weight stays over your standing leg'],
    [GUARD, 300, 'Straight back to stance'],
    [GUARD, 400, 'Stance, hands up'] ] },
  'oblique-rear': { type: 'side', hot: 'rear-leg', seq: [
    [GUARD, 700, 'Stance, hands up'],
    [swapSides(TEEP_CHAMBER), 200, 'Lift the rear knee, toes turned out'],
    [swapSides(TEEP), 150, 'Stomp down and forward into their lead thigh'],
    [swapSides(TEEP), 220, 'Hands up, weight over the lead leg'],
    [GUARD, 300, 'Back to stance'],
    [GUARD, 400, 'Stance, hands up'] ] },
});

// Batch 4: spinning and flying kicks (2D backups reuse the side-kick and round-kick drawings)
Object.assign(DEMOS, {
  'spin-side': { type: 'side', hot: 'rear-leg', seq: [
    [GUARD, 650, 'Stance, hands up'],
    [GUARD, 120, 'Turn your head first, look over your right shoulder'],
    [swapSides(TEEP_CHAMBER), 120, 'Pivot on the lead foot, back to the target, knee up'],
    [swapSides(TEEP), 140, 'Drive the heel straight back into the target'],
    [swapSides(TEEP), 200, 'Lean away, hands up'],
    [swapSides(TEEP_CHAMBER), 220, 'Pull the leg back and finish the turn'],
    [GUARD, 260, 'Face them in your stance'],
    [GUARD, 400, 'Stance, hands up'] ] },
  'spin-hook': { type: 'side', hot: 'rear-leg', seq: [
    [GUARD, 650, 'Stance, hands up'],
    [GUARD, 120, 'Turn your head first, look over your right shoulder'],
    [swapSides(TEEP_CHAMBER), 120, 'Pivot on the lead foot, back to the target'],
    [KICK, 140, 'Swing the heel across at head height'],
    [swapSides(TEEP_CHAMBER), 160, 'Bend the knee and pull the heel through'],
    [GUARD, 220, 'Finish the turn to face them'],
    [GUARD, 260, 'Hands up, in your stance'],
    [GUARD, 400, 'Stance, hands up'] ] },
  'fly-rear': { type: 'side', hot: 'rear-leg', seq: [
    [GUARD, 650, 'Stance, hands up'],
    [KICK_STEP, 200, 'Step in and sink a little'],
    [SWITCH, 140, 'Jump up, knees tucked'],
    [KICK, 120, 'Turn over in the air, shin into the target'],
    [KICK, 160, 'Hands up, eyes on the target'],
    [GUARD, 220, 'Land soft on the balls of your feet, knees bent'],
    [GUARD, 400, 'Stance, hands up'] ] },
  'fly-lead': { type: 'side', hot: 'lead-leg', seq: [
    [GUARD, 650, 'Stance, hands up'],
    [SWITCH, 200, 'Switch your feet as you step in and sink'],
    [SWITCH, 140, 'Jump up, knees tucked'],
    [SWITCH_KICK, 120, 'Turn over in the air, lead shin into the target'],
    [SWITCH_KICK, 160, 'Hands up, eyes on the target'],
    [GUARD, 220, 'Land soft, knees bent, back in your stance'],
    [GUARD, 400, 'Stance, hands up'] ] },
});

// Techniques with more than one animation (lead and rear versions, the combinations): the card
// shows a row of buttons to pick which one plays. [animation id, button label], first one shown first.
const PICKS = {
  combos: COMBOS.map(c => [c.id, c.name]),
  hook: [['hook', 'Lead hook'], ['hook-rear', 'Rear hook']],
  body: [['body', 'Lead hook (liver)'], ['body-rear', 'Rear hook']],
  uppercut: [['uppercut', 'Rear uppercut'], ['uppercut-lead', 'Lead uppercut']],
  elbow: [['elbow', 'Rear horizontal'], ['elbow-lead', 'Lead horizontal'], ['elbow-rise-lead', 'Lead rising'], ['elbow-rise-rear', 'Rear rising']],
  clinch: [['clinch', 'Clinch knee'], ['knee-rear', 'Rear driving knee'], ['knee-lead', 'Lead driving knee'], ['knee-switch', 'Switch knee']],
  teep: [['teep', 'Lead teep'], ['teep-rear', 'Rear teep']],
  'side-kick': [['side-kick', 'Lead side kick'], ['side-kick-rear', 'Rear side kick']],
  oblique: [['oblique', 'Lead oblique kick'], ['oblique-rear', 'Rear oblique kick']],
  spinning: [['spin-side', 'Turning side kick'], ['spin-hook', 'Spinning hook kick']],
  flying: [['fly-rear', 'Rear flying round kick'], ['fly-lead', 'Lead flying round kick']],
};

// The demo card for a technique, or '' if it has no animation yet
function moveDemo(techId) {
  const pick = PICKS[techId], id = pick ? pick[0][0] : techId;
  const d = DEMOS[id];
  if (!d) return '';
  // Moves with a 3D version are shown in 3D only (the 2D drawing is kept as a backup for phones
  // that can't run 3D). Footwork has no 3D version, so it stays a 2D diagram of the feet.
  return `<div class="demo" data-move="${id}"${POSES3D[id] ? ' data-start3d' : ''}>
    <button class="stance-chip${state.southpaw ? ' on' : ''}" data-act="demo-stance" aria-label="Stance: ${state.southpaw ? 'southpaw' : 'orthodox'}. Tap to switch">${state.southpaw ? 'Southpaw' : 'Orthodox'} ⇄</button>
    <svg class="demo-svg" viewBox="0 0 300 250" role="img" aria-label="Animation of the technique"></svg>
    <p class="demo-cue" aria-live="polite">${esc(d.seq[0][2])}</p>
    ${pick ? `<div class="combo-pick" role="group" aria-label="Pick a version">${pick.map(([pid, label]) => `<button class="${pid === id ? 'on' : ''}" data-act="demo-combo" data-id="${pid}" aria-pressed="${pid === id}">${esc(label)}</button>`).join('')}</div>` : ''}
    ${WRONG3D[id] || pick ? `<div class="rw" role="group" aria-label="Right way or common mistake"${WRONG3D[id] ? '' : ' hidden'}><button class="on" data-act="demo-right" aria-pressed="true">✓ Right</button><button data-act="demo-wrong" aria-pressed="false">✗ Common mistake</button></div>` : ''}
    <div class="demo-ctl"><button class="btn" data-act="demo-play">${reducedMotion() ? '▶ Play' : 'Pause'}</button>
    <button class="btn" data-act="demo-slow">Slow-mo</button></div></div>`;
}

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Drawing ---------- */

// Apply f to every number in a set of poses (objects of numbers or number arrays)
const mapPose = (ps, f) => Object.fromEntries(Object.keys(ps[1]).map(k => [k, Array.isArray(ps[1][k])
  ? ps[1][k].map((_, j) => f(...ps.map(p => p[k][j]))) : f(...ps.map(p => p[k]))]));

// Two keyframes count as the same pose if all their numbers match (a "hold")
const poseKey = new WeakMap();
const samePose = (p, q) => {
  for (const o of [p, q]) if (!poseKey.has(o)) poseKey.set(o, JSON.stringify(o));
  return poseKey.get(p) === poseKey.get(q);
};

// Smooth motion: a curve (Hermite spline) through the keyframes, so movement flows through
// in-between poses instead of stopping at each one, and only eases to a stop at held poses.
// P = poses, D = milliseconds to reach each pose, going from pose a to pose b, u from 0 to 1.
function splinePose(P, D, a, b, u) {
  const n = P.length, pa = P[a], pb = P[b];
  if (samePose(pa, pb)) return pa;
  const a0 = P[(a - 1 + n) % n], b1 = P[(b + 1) % n], db = D[b], da = D[a], db1 = D[(b + 1) % n];
  const stopA = samePose(a0, pa), stopB = samePose(b1, pb);
  const s2 = u * u, s3 = s2 * u;
  const h00 = 2 * s3 - 3 * s2 + 1, h10 = s3 - 2 * s2 + u, h01 = -2 * s3 + 3 * s2, h11 = s3 - s2;
  return mapPose([a0, pa, pb, b1], (q0, q1, q2, q3) => {
    const ma = stopA ? 0 : (q2 - q0) / (da + db), mb = stopB ? 0 : (q3 - q1) / (db + db1);
    return h00 * q1 + h10 * db * ma + h01 * q2 + h11 * db * mb;
  });
}
const pt = p => p.map(n => n.toFixed(1)).join(' ');

// Southpaw: every animation is drawn as a mirror image, and "left" and "right" swap in the cues
const mirrorSide = p => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, [300 - v[0], v[1]]]));
const mirrorFoot = ([x, y, a]) => [300 - x, y, -a];
const mirrorWords = s => s.replace(/\b(left|right|Left|Right)\b/g, w => ({ left: 'right', right: 'left', Left: 'Right', Right: 'Left' })[w]);

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
      <circle class="head ${hot === 'head' ? 'hot' : ''}" cx="${p.head[0]}" cy="${p.head[1]}" r="17"/>
    </g>`;
}

const foot = ([x, y, a], cls) => `<g class="foot ${cls}" transform="translate(${x} ${y}) rotate(${a})">
  <rect x="-11" y="-22" width="22" height="44" rx="11"/><circle cx="0" cy="-13" r="4"/></g>`;

function drawTop(d, p, hot, mirror) {
  const opp = [150, 40];
  if (mirror) p = { lead: mirrorFoot(p.lead), rear: mirrorFoot(p.rear) };
  const inside = d.reach && Math.hypot(p.lead[0] - opp[0], p.lead[1] - opp[1]) < d.reach;
  const first = mirror ? { lead: mirrorFoot(d.seq[0][0].lead), rear: mirrorFoot(d.seq[0][0].rear) } : d.seq[0][0];
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
    open3d(el);
  });
  if (!demoRaf && document.querySelector('.demo')) demoRaf = requestAnimationFrame(demoTick);
}

function demoTick(now) {
  const els = document.querySelectorAll('.demo');
  if (!els.length) { sweep3d(); demoRaf = 0; return; }   // (frees the 3D view of the page you just left)
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
    if (t <= dur) { k = t / dur; break; }
    t -= dur; prev = i;
  }
  i = Math.min(i, d.seq.length - 1);
  // (showing the mistake: the cue says what's wrong and why, the whole time)
  const [, , cue1, hot] = d.seq[i], w = el._wrong && WRONG3D[el.dataset.move], cue0 = w ? `✗ ${w.text}. ${w.why}` : cue1;
  const cue = state.southpaw ? mirrorWords(cue0) : cue0;
  if (cue !== st.cue) { el.querySelector('.demo-cue').textContent = st.cue = cue; }
  if (el._3d) { st.drawn = draw3d(el, prev, i, k); return; }
  d._P = d._P || d.seq.map(f => f[0]); d._D = d._D || d.seq.map(f => f[1]);
  const out = splinePose(d._P, d._D, prev, i, k);
  el.querySelector('svg').innerHTML = d.type === 'side' ? drawSide(state.southpaw ? mirrorSide(out) : out, hot || d.hot) : drawTop(d, out, hot, state.southpaw);
  st.drawn = true;
}

document.addEventListener('click', e => {
  const btn = e.target.closest('[data-act^="demo-"]');
  if (!btn) return;
  const el = btn.closest('.demo'), now = performance.now(), st = demoState(el, now);
  if (btn.dataset.act === 'demo-combo') {
    // Swap which version (or combination) this card plays, and start it from the top
    el.dataset.move = btn.dataset.id;
    el.querySelectorAll('.combo-pick button').forEach(b => { const on = b === btn; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    // (back to the right way; the mistake switch only shows for versions that have one)
    el._wrong = false; el.classList.remove('wrong');
    const rw = el.querySelector('.rw');
    if (rw) { rw.hidden = !WRONG3D[btn.dataset.id]; rw.querySelectorAll('button').forEach(b => { const on = b.dataset.act === 'demo-right'; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); }); }
    const playing = st.playing; delete el._st; Object.assign(demoState(el, now), { playing });
    el.querySelector('.demo-cue').textContent = DEMOS[btn.dataset.id].seq[0][2];
    if (el._3d) { close3d(el); open3d(el); }
    return;
  }
  if (btn.dataset.act === 'demo-right' || btn.dataset.act === 'demo-wrong') {
    el._wrong = btn.dataset.act === 'demo-wrong';
    el.classList.toggle('wrong', el._wrong);
    el.querySelectorAll('.rw button').forEach(b => { const on = (b.dataset.act === 'demo-wrong') === el._wrong; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    st.start = now; st.at = 0; st.drawn = false; st.cue = '';   // start the move again from the top
    return;
  }
  if (btn.dataset.act === 'demo-stance') {
    // One setting for every animation (and remembered): redraw them all mirrored or not
    state.southpaw = !state.southpaw; save();
    document.querySelectorAll('.demo').forEach(d => {
      const c = d.querySelector('.stance-chip');
      c.textContent = (state.southpaw ? 'Southpaw' : 'Orthodox') + ' ⇄'; c.classList.toggle('on', state.southpaw);
      c.setAttribute('aria-label', `Stance: ${state.southpaw ? 'southpaw' : 'orthodox'}. Tap to switch`);
      if (d._3d && d._3d.ready) d._3d.setMirror(state.southpaw);
      if (d._st) { d._st.drawn = false; d._st.cue = ''; }
    });
    return;
  }
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
