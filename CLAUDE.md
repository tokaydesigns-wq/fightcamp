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
| `js/ui.js` | Router, Home/Train/Food/Camp screens, click/input/submit handlers. Must load last. |
| `sw.js` | Offline cache. Bump `CACHE` (`fightcamp-vN`) on every release; add new files to `SHELL`. |

- Routes: `#/home`, `#/train`, `#/food`, `#/camp`, `#/learn`, `#/p/ID` (a program).
- Clicks use `data-act`, forms use `data-form`.
- Saved data: one object in `localStorage['fightcamp.v1']`. New fields need a default in `loadState()`.
  Weights are stored in kg and converted for display.
- Program ticks are keyed `week-item` against `buildPlan()`, so reordering a technique's drills
  shifts existing ticks. Add drills at the end where possible.

## Testing

Double-click `Start FightCamp.bat`, or run `python -m http.server 8124` in this folder, then open
http://localhost:8124. The service worker caches files, so after edits do a hard reload or bump `CACHE`.
