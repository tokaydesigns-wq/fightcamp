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

## Files (loaded in this order from index.html; they share globals)

| File | What's in it |
| --- | --- |
| `js/core.js` | Helpers, dates (`ymd` strings), `SESSION_TYPES`, saved state (`loadState`/`save`), training and food maths |
| `js/charts.js` | SVG `barChart`, `lineChart`, `meter`, `stat` |
| `js/techniques.js` | `TECHS` library (24 techniques, drills by solo/gear/partner/live) and `buildPlan()` 4-week builder |
| `js/fighters.js` | `FIGHTERS` (aliases, signature techniques, "how they do it" notes), `styleFromText` |
| `js/camp.js` | `PHASES` of a fight camp with tips, `campStatus`, `cutPace` |
| `js/learn.js` | Query matching, Wikipedia lookup, Learn and program screens, `learnAct` clicks |
| `js/moves.js` | Animated SVG technique demos: `DEMOS` keyframes (side-view stick figure or top-down feet), `moveDemo(id)`, one shared animation loop started by `startDemos()` |
| `js/moves3d.js` | 3D mannequin view for demos: `POSES3D` (one 3D pose per 2D keyframe, same timing and cues), two-bone IK, three.js scene with a heavy bag, Side/Front/Behind views, drag to turn. three.js loads only when "3D view" is tapped |
| `js/vendor/` | three.js 0.187.0 (MIT, `LICENSE.three.txt`). `three.core.js` is the minified core, renamed because the module imports that name |
| `js/timer.js` | Round timer (`#/timer/R-WORK-REST`): bell via Web Audio, 10-second warning, vibration, screen wake lock, `drillTimerBtn` for drill doses |
| `js/ui.js` | Router, Home/Train/Food/Camp screens, click/input/submit handlers. Must load last. |
| `sw.js` | Offline cache. Bump `CACHE` (`fightcamp-vN`) on every release; add new files to `SHELL`. |

- Routes: `#/home`, `#/train`, `#/food`, `#/camp`, `#/learn`, `#/p/ID` (a program), `#/timer`.
- Animations exist for jab, cross, hook, roundhouse, teep, angles and distance. To add one, add keyframes to
  `DEMOS` in moves.js with the technique's id; it then shows on the Learn result and program page automatically.
- Moves with 3D open in 3D first (`data-start3d`). `TRAILS` in moves3d.js draws the path of the striking foot/fist;
  `START_VIEW` sets the opening camera angle per move.
- 3D exists for jab and roundhouse. To add one, give `POSES3D` in moves3d.js one pose per keyframe of that move's
  2D `seq`. Poses are hip/fist/ankle positions in metres, fighter facing +X, orthodox.
- Clicks use `data-act`, forms use `data-form`.
- Saved data: one object in `localStorage['fightcamp.v1']`. New fields need a default in `loadState()`.
  Weights are stored in kg and converted for display.
- Program ticks are keyed `week-item` against `buildPlan()`, so reordering a technique's drills
  shifts existing ticks. Add drills at the end where possible.

## Testing

Double-click `Start FightCamp.bat`, or run `python -m http.server 8124` in this folder, then open
http://localhost:8124. The service worker caches files, so after edits do a hard reload or bump `CACHE`.
