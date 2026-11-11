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

## Video check (branch `feature/video-check`, pull request open for the owner to review)

The owner asked for: upload a video of pad/bag work or sparring/fights and get a critique of stance,
footwork, guard, punches and kicks. They chose **free on-phone body tracking now, AI coach later**
(the paid AI coach is in `BACKLOG.md` under Needs the owner).

What's there:
- `js/video.js`: the `#/video` screen and the rules. `js/vendor/mediapipe/`: Google MediaPipe Tasks
  Vision 1.1.1 + `pose_landmarker_lite.task` (Apache-2.0), loaded only when Video check is used and
  cached by `sw.js` on first use. Offline cache `fightcamp-v11`.
- How it reads a clip: the video stays attached to the page (`holdVideo`, phones don't decode detached
  videos). It plays the clip from the moment you picked yourself and grabs ~10 frames a second as they
  go by (`playFrames`, requestVideoFrameCallback; jumping frame by frame was 0.2-0.4 s per frame),
  then jumps to any missed moments, working outward from the pick (`seekFrames`).
- Finding people: whole frame plus three overlapping slices (the lite model mostly finds only the
  biggest person otherwise); during analysis it zooms in on the chosen person (`areaAround`).
  `follow` refuses to switch to someone of a different size or too far away: losing them for a
  moment beats following the wrong boxer.
- Rules, tuned on the mannequin and the clips: a punch = arm straight (shoulder-elbow-wrist in a
  line) and fist well away from where that hand usually sits; a kick = one foot well above the
  standing foot compared with the usual stance, for 2+ frames. Side-on cameras can't tell left arm
  from right, so the report then doesn't name the hand.

Test results (mannequin, `docs/video-check-harness.js`): from an angle, from slightly above and
southpaw it counts exactly 6 punches (3 lead, 3 rear) and 4 kicks; side-on the totals are right;
from the front it can't see punches thrown at the camera (the report says to film from the side).
Real clips: boxing (3 people, right one followed, 0 kicks), Jon Jones (2 kicks, 0 punches), Muay
Thai from the crowd ("couldn't follow you", as expected).

Not tested: a real phone (speed, iPhone Safari, the camera/file picker), hooks, body shots, guard
drops and crossed feet on real footage (no clip had them).

Test clips (Wikimedia Commons, owner approved for testing only, never added to the app): "Boxing
training.webm", "Muay Thai in Lamai.webm", "Jon Jones kicking.webm". Ask the owner before downloading
again. Serve them from a second local server with CORS and load them with `testClip`.

Testing note: a hidden browser panel barely plays video and throttles timers, so testing is many times
slower. Show the panel (the app's preview pane) while testing.

## Waiting on the owner

- Try backup and restore on their phone (where the file lands, then loading it back).
- Try the round timer's sounds on a real phone.
- Watch the new 3D animations on a phone and report anything that looks off.
