# FightCamp to-do list

Add ideas anywhere in **Inbox**: a sentence is enough. The nightly agent picks the top unchecked
item from **Up next** (or a bug it found), does it on a branch, opens a pull request and moves the
item to **In review**. Merge the pull request to put it live.

Tags: `[bug]` something broken · `[feature]` new section or ability · `[polish]` looks or wording ·
`[animation]` a new or changed technique animation (the owner should watch it on a phone before merging) ·
`[needs-owner]` needs an account, a decision or something only the owner can do (the agent skips these).

## Inbox

- (add new ideas here)

## Up next

- [ ] `[animation]` Low kick: 2D and 3D animation with a strike-path trail. It should clearly chop down into the thigh, not look like a roundhouse to the body.
- [ ] `[animation]` Body shot (lead hook to the liver): 2D and 3D, knees bending to drop the level, head off the centre line.
- [ ] `[animation]` Head movement (slip and roll): 2D and 3D, moving from the legs and hips, eyes on the target.
- [ ] `[animation]` Switch kick: 2D and 3D, a small quick switch of the feet, then the kick.

## In review

- [ ] `[feature]` Backup and restore (PR: "Add backup and restore of all your data"). Cards on the Home screen: save a backup file, load it back.

## Needs the owner

- [ ] `[needs-owner]` Try the round timer's bell, 10-second warning and vibration on a real phone. They can't be checked by the agent.
- [ ] `[needs-owner]` Grappling animations (BJJ and wrestling): 3D doesn't suit two tangled bodies. Decide whether step-by-step pictures are wanted.
- [ ] `[needs-owner]` AI-written programs for any technique need a paid AI account and a small server to hold the key. Set aside for now; programs come from the built-in drill library.
- [ ] `[needs-owner]` AI coach for video check (paid, needs a server): send a few frames of a clip to a vision AI for a coach-style critique of timing, setups and tactics, which body tracking can't judge. Needs a paid AI account and a small server to hold the key.
- [ ] `[needs-owner]` Accounts and syncing between devices need an online database. Not wanted so far; data stays on the phone.

## Known limits (not bugs)

- All data lives on the phone until backup and restore exists.
- The animations are a posed mannequin, not motion capture, and don't replace a coach.
- iPhones don't let websites vibrate, so the round timer is sound only there.
- Video check measures positions from one camera. It counts punches best filmed from the side or at an angle; punches thrown straight at the camera, hooks and timing are hard for it to judge.
- GitHub's publishing step sometimes fails or stalls with "try again later". Re-running it fixes it; it isn't a problem with the app.

## Done

- [x] Training log with weekly totals, streak and 8-week chart
- [x] Food and weight tracking with targets and a weight chart
- [x] Fight camp countdown with tips for each stage and a safe-pace weight check
- [x] Learn from a fighter: Wikipedia profile and 4-week drill programs (24 techniques)
- [x] 2D animations: jab, cross, hook, roundhouse, teep, footwork angles, in-and-out distance
- [x] 3D mannequin with strike-path trails: jab, cross, hook, teep, roundhouse
- [x] Smooth animation motion between poses
- [x] Round timer with drill shortcuts
- [x] Fight-night look: illustrated banners, stat icons, empty-state pictures
