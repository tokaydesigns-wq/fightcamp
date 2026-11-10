# FightCamp handoff (2026-11-10)

Read `CLAUDE.md` first (rules, file map, testing). This note covers where things stand.

## What FightCamp is

A free phone web app (PWA) for martial artists, live at https://tokaydesigns-wq.github.io/fightcamp/
(GitHub Pages deploys `main`). Training log, food and weight, fight-camp countdown, "learn from a
famous fighter" 4-week programs with 2D and 3D animations, round timer, backup and restore.
The owner isn't a developer: plain language, screenshots, pull requests only (never push to `main`).

## Live on main

Everything up to PR #10 (backup and restore). Offline cache `fightcamp-v10`.

## Nightly helper

A scheduled cloud job, "FightCamp nightly helper" (https://claude.ai/code/routines/trig_01MTsgR7UwnuatBXWx5DqxmR),
runs daily at 11:00 UTC, works through `BACKLOG.md` and opens at most one PR a night. Next up: the
low-kick animation. If it skips a night, check its run log: one run stopped on the account's weekly
usage limit (not a bug).

## In progress: Video check (branch `feature/video-check`, no PR yet)

The owner asked for: upload a video of pad/bag work or sparring/fights and get a critique of stance,
footwork, guard, punches and kicks. They chose **free on-phone body tracking now, AI coach later**
(the paid Claude-vision option is set aside; it would need billing plus a small server for the key).

Done on the branch (committed, not yet merged):
- `js/video.js`: the `#/video` screen (pick clip type and stance, choose or record a video, "which one
  is you?" when several people are found, progress, report card with tap-to-jump timestamps, skeleton
  overlay, "What to drill" links into Learn) and the rules that turn joint positions into notes.
- `js/vendor/mediapipe/`: Google MediaPipe Tasks Vision 1.1.1 (Apache-2.0, owner approved downloading
  it into the app) plus `pose_landmarker_lite.task`. Loaded only when Video check is used; `sw.js`
  caches these files on first use. Cache bumped to `fightcamp-v11`.
- Train banner has a "🎥 Video check" button; new `video` banner art in `js/art.js`; styles at the end
  of `styles.css`.

Still to do before opening the PR:
1. **Finish testing on real footage.** A seeking problem was just fixed: videos must stay attached to
   the page (`holdVideo`) and the code waits for `loadedmetadata` then seeks, because browsers (and
   iPhones) don't decode frames of detached videos. Re-run the multi-person boxing clip and check the
   "which one is you?" boxes, then a full analysis and the report.
2. **Tune the thresholds** in `buildReport` / `findStrikes` against real clips. They are first guesses.
   Idea for ground truth: render the 3D mannequin (moves3d.js) frame by frame into a canvas with known
   jab/kick counts and feed it to the tracker (detectForVideo accepts a canvas).
3. Check at 375px, light and dark, no console errors, then open the PR with screenshots.
4. Add "AI coach for video check (paid, needs a server)" under Needs the owner in `BACKLOG.md`.

Test clips (from Wikimedia Commons, owner approved downloading them for testing only, not for the app):
"Boxing training.webm" (several people), "Muay Thai in Lamai.webm" (fight filmed from the crowd: the
tracker finds no one, which is expected) and "Jon Jones kicking.webm" (close-up at a bag). They were
kept in the old session's temporary folder, so they'll need downloading again (ask the owner first).
Load them in the page as a Blob/File to mimic a phone pick; python's http.server can't serve byte
ranges, so seeking a large file served directly over HTTP doesn't work.

Testing note: when the browser panel is hidden, long scripts time out and timers are throttled, so
start long jobs without awaiting them and check progress in short calls.

## Waiting on the owner

- Try backup and restore on their phone (where the file lands, then loading it back).
- Try the round timer's sounds on a real phone.
- Watch the new 3D animations on a phone and report anything that looks off.
