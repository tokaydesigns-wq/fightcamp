# FightCamp: notes for Claude

FightCamp is a phone web app (installable PWA) for martial artists: training log, food and weight,
fight-camp countdown with tips, and "learn from a famous fighter" 4-week drill programs.
It is separate from the owner's other app, Planerr. Live at https://tokaydesigns-wq.github.io/fightcamp/.
GitHub Pages deploys straight from `main`, so anything merged to `main` goes live within a minute or two.

The owner isn't a developer. Write to them in plain language, show what changed (screenshots
help), and say clearly what you did and didn't test.

## Working rules

- **Free sources only, no API keys.** There is no server, so a key would be exposed. Real AI-written
  programs (Claude API through a small server) were discussed and postponed: free version first.
- No build step and no frameworks. Plain HTML, CSS and JavaScript, loaded as classic scripts.
- **Never push to `main`.** Work on a branch and open a pull request for the owner to review.
- Keep weight-cut advice conservative (about 1% of body weight a week; no unsupervised water cuts).
- Test at phone width (375px), light **and** dark mode, no sideways scrolling.

## Nightly helper

A scheduled cloud job ("FightCamp nightly helper") works through `BACKLOG.md`, opening at most one
pull request a night. It never merges. The owner adds ideas under Inbox and merges what they like.

## Files (loaded in this order from index.html; they share globals)

| File | What's in it |
| --- | --- |
| `js/core.js` | Helpers, dates (`ymd` strings), `SESSION_TYPES`, saved state (`loadState`/`save`), training and food maths |
| `js/charts.js` | SVG `barChart`, `lineChart`, `meter`, `stat` |
| `js/techniques.js` | `TECHS` library (31 techniques, drills by solo/gear/partner/live) and `buildPlan()` 4-week builder |
| `js/fighters.js` | `FIGHTERS` (aliases, signature techniques, "how they do it" notes), `styleFromText` |
| `js/camp.js` | `PHASES` of a fight camp with tips, `campStatus`, `cutPace` |
| `js/learn.js` | Query matching, Wikipedia lookup, Learn and program screens, `learnAct` clicks |
| `js/moves.js` | Animated SVG technique demos: `DEMOS` keyframes (side-view stick figure or top-down feet), `moveDemo(id)`, one shared animation loop started by `startDemos()` |
| `js/moves3d.js` | 3D mannequin view for demos: `POSES3D` (one 3D pose per 2D keyframe, same timing and cues), two-bone IK, three.js scene with a heavy bag, Side/Front/Behind views, drag to turn. three.js loads the first time a move with 3D is shown |
| `js/vendor/` | three.js 0.187.0 (MIT, `LICENSE.three.txt`). `three.core.js` is the minified core, renamed because the module imports that name |
| `js/art.js` | Artwork in SVG: `picto()` pictogram fighter drawn from the 2D poses in moves.js, `ART` banner scenes, `banner()` screen headers, `ICONS`/`icon()` for stat tiles, `emptyState()` |
| `js/timer.js` | Round timer (`#/timer/R-WORK-REST`): bell via Web Audio, 10-second warning, vibration, screen wake lock, `drillTimerBtn` for drill doses |
| `js/video.js` | Video check (`#/video`): MediaPipe pose tracking on the phone (`js/vendor/mediapipe`, loaded on first use), "which one is you?", play-through frame sampling, `measure`/`findStrikes`/`buildReport` rules that turn joints into notes |
| `js/ui.js` | Router, Home/Train/Food/Camp screens, click/input/submit handlers. Must load last. |
| `sw.js` | Offline cache. Bump `CACHE` (`fightcamp-vN`) on every release **and set `APP_VERSION` in core.js to the same N** (shown on Home so the owner can see which version they have); add new files to `SHELL`. |

- Routes: `#/home`, `#/train`, `#/food`, `#/camp`, `#/learn`, `#/p/ID` (a program), `#/timer`, `#/video`, `#/about` (privacy summary, health note, credits; linked at the bottom of Home).
- `store/` holds the app-store icons, Play banner, screenshots and listing text (`LISTING.md`); `store/README.md` says how to re-make the screenshots with sample data. Not part of the app or the offline cache.
- `terms.html` is the terms of use with the health and safety notice (linked from About and the privacy policy).
- `privacy.html` is the public privacy policy (the stores link to it). **Update it, with a new date, before shipping anything that changes what data the app handles or sends** (purchases, accounts, syncing, analytics, new outside services).
- Animations exist for jab, cross, hook, uppercut, body shot, slip, roundhouse, switch kick, low kick, teep,
  clinch knee (`clinch`), rear horizontal elbow (`elbow`), angles and distance.
  The Orthodox/Southpaw chip on each card mirrors them all (`state.southpaw`, cues swap left/right via `mirrorWords`). To add one, add keyframes to
  `DEMOS` in moves.js with the technique's id; it then shows on the Learn result and program page automatically.
- **3D is the only view for moves that have 3D.** There is no 2D/3D button (the owner decided this; don't add it back).
  Moves with `POSES3D` are marked `data-start3d` and always open in 3D (`open3d(el)`). The 2D drawing in `DEMOS` is kept
  only as a silent backup: if 3D can't run on a phone, the card quietly keeps the 2D drawing. Footwork (angles, distance)
  has no 3D and stays a 2D top-down diagram of the feet.
- `TRAILS` in moves3d.js draws the path of the striking foot/fist (`TRAIL_JOINT_MOVE` overrides the joint: the knee for
  `clinch`, the elbow for `elbow`); `START_VIEW` sets the opening camera angle per move. The bag swings when a fist, elbow,
  knee, shin or foot reaches it (`STRIKERS` in `buildScene`); in the clinch the gloves only hold it.
- 3D exists for jab, cross, hook, uppercut, body shot, slip, teep, roundhouse, switch kick, low kick, clinch knee and elbow
- Right vs wrong: `WRONG3D` in moves3d.js gives each 3D move one common mistake (text, why, and the keyframes that change). It's registered as `POSES3D[move + '~wrong']`; the ✓ Right / ✗ Common mistake switch on the card plays it (`el._wrong`).
- Combinations: `COMBOS` in moves.js lists moves played back to back (each move's opening and closing holds dropped, the return to guard shortened). The 'combos' technique shows a picker; `setHot` lights the striking limb per step; a combo with a low kick gets a longer bag.
- Versions of a technique: `PICKS` in moves.js maps a technique id to `[animation id, label]` pairs; its card shows a button row to switch (the first one plays first). Used for the combinations and for lead/rear versions (`hook-rear`, `body-rear`, `uppercut-lead`, `elbow-lead`, `elbow-rise-lead`, `elbow-rise-rear`, `knee-rear`, `knee-lead`, `knee-switch`, `teep-rear`, `side-kick-rear`, `oblique-rear`, built from the owner's clips; plus the new `side-kick`, `oblique`, `spinning` and `flying` techniques). Spinning moves are listed in `SPINS` (moves3d.js): their yaw turns the short way between keyframes, so keep each step under 180 degrees. The ✓ Right / ✗ Common mistake switch hides for versions with no `WRONG3D` entry (every version has one at the moment). `VERSION_TEXT` (techniques.js) gives each extra version its own key points and mistakes; the page's lists (`.tech-keys`, `.tech-mistakes`) switch with the buttons.
- In `skeleton()` a fist aimed inside the torso, a thigh or the head is pushed out to just touch it (`pushOut`), because blending between poses can carry a hand through the body. Check the whole blended move, not only the keyframes.
- Matched to the owner's footage (Nov 2026, side-on clips in `Test videos`, never committed): jab step, cross return, teep height/lean, kick speed and lean, low-kick contact height, clinch-knee height. The versions from before are kept in `ORIGINAL3D` (moves3d.js) and play as `move + '~old'` with their own timing; git tag `animations-before-footage` also has them. To put a move back, use its `ORIGINAL3D` poses and `ms` timing.
  (footwork stays 2D). The switch kick is the round kick mirrored (`mirrorPose3`, `swapSides` in 2D). To add one, give `POSES3D` in moves3d.js one pose per keyframe of that move's
  2D `seq`, with the same number of keyframes. Poses are hip/fist/ankle positions in metres, fighter facing +X, orthodox.
- Quality checks every 3D move should pass: no glove within 0.15 m of the head centre; strikes reach the bag (centre
  x 1.04, z 0, radius 0.17, spanning bagY ± 0.5, bagY 1.15 or 0.85 for `low-kick`) within 3 cm and go in no more than
  about 2.5 cm; no foot or toe below about -0.02; no glove passing through a thigh.
- Clicks use `data-act`, forms use `data-form`.
- Saved data: one object in `localStorage['fightcamp.v1']`. New fields need a default in `loadState()`.
  Weights are stored in kg and converted for display.
- Program ticks are keyed `week-item` against `buildPlan()`, so reordering a technique's drills
  shifts existing ticks. Add drills at the end where possible.

## Testing

Double-click `Start FightCamp.bat`, or run `python -m http.server 8124` in this folder, then open
http://localhost:8124. The service worker caches files, so after edits do a hard reload or bump `CACHE`.
