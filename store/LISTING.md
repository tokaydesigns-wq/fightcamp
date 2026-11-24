# FightCamp: store listing (draft for the owner to approve)

Everything here is a draft. Change anything you like before pasting it into App Store Connect or the
Google Play Console. Character limits are in brackets; every line below fits.

Real fighters' names are left out of the listing on purpose. Using a famous person's name to sell an
app can break store rules on trademarks and "implied endorsement", so the listing talks about
"famous fighters" in general. Inside the app it's fine: the About page already says the fighters
don't endorse FightCamp.

---

## Name and short lines

| Field | Text | Length |
| --- | --- | --- |
| App name (Apple 30, Google 30) | FightCamp: Martial Arts Log | 27 |
| Subtitle (Apple, 30) | Train, cut weight, learn moves | 30 |
| Short description (Google, 80) | Log training, food and weight, count down to fight night and learn moves in 3D. | 79 |
| Promotional text (Apple, 170, can be changed any time) | New: 31 techniques with a 3D fighter you can turn, right vs wrong, combos and lead and rear versions of every strike. | 117 |

If "FightCamp: Martial Arts Log" is taken, try "FightCamp – Fight Training" or "FightCamp Muay Thai & Boxing".

## Keywords (Apple only, 100, comma separated, no spaces needed)

```
muay thai,boxing,kickboxing,mma,bjj,training log,weight cut,fight camp,round timer,technique,martial
```

(100 characters, the limit. Don't repeat words already in the name or subtitle; Apple counts those anyway.)

## Category

- **Apple:** Primary **Health & Fitness**, secondary **Sports**.
- **Google:** **Health & Fitness**.

## Full description (Apple and Google, 4000)

```
FightCamp is a training partner for Muay Thai, boxing, kickboxing, MMA and BJJ. Log your sessions, keep your food and weight on track, count down to fight night, and learn techniques from a 3D fighter you can turn and slow down.

TRAIN
• Log every session in seconds: type, minutes, rounds, how hard it was and notes
• See your week at a glance and your last 8 weeks as a chart
• Round timer with a bell, 10-second warning, vibration and screen kept awake

LEARN MOVES IN 3D
• 31 techniques, from the jab and teep to spinning back kicks and flying knees
• A 3D fighter shows each move: watch from the side, front or behind, drag to turn, play in slow motion
• Right vs wrong: flip to the most common mistake and see why it gets you hit
• Lead and rear versions, combinations, and orthodox or southpaw at a tap
• Key points, common mistakes and a 4-week drill program for each technique, with solo, bag, partner and sparring drills
• Look up a famous fighter and train the techniques they're known for

FIGHT CAMP
• Set your fight date and weight limit and get a countdown with tips for each phase of camp
• A safe weight plan: FightCamp tells you how many kilos a week you need to lose and warns you if it's too fast (it never suggests water cuts)

FOOD AND WEIGHT
• Track calories and protein against your own targets
• Log your weight in kg or lb and see the trend

VIDEO CHECK
• Film yourself on the bag and get simple notes on your guard and form. Body tracking runs on your phone: your video is never uploaded

PRIVATE BY DESIGN
• No account, no ads, no tracking
• Everything you log stays on your phone. Save a backup file whenever you like
• Works offline once it has loaded

FightCamp gives general training information, not medical advice. Talk to a doctor before starting a new training plan or cutting weight.
```

(About 1,800 characters.)

## What's new (first release)

```
First release: training log, round timer, food and weight tracking, fight camp countdown, video check, and 31 techniques with a 3D fighter.
```

## Links

- Privacy policy URL: https://tokaydesigns-wq.github.io/fightcamp/privacy.html
- Terms of use URL (Apple: put it in the description or the licence agreement field; Google: optional): https://tokaydesigns-wq.github.io/fightcamp/terms.html
- Support URL: https://github.com/tokaydesigns-wq/fightcamp/issues
- Marketing URL (optional): https://tokaydesigns-wq.github.io/fightcamp/

## Privacy answers

- **Apple "App Privacy" label:** **Data Not Collected.** Nothing you log leaves the phone, there is
  no account, no analytics and no ads. (Fighter searches go to Wikipedia only when the user searches,
  and aren't linked to the user, which Apple doesn't count as collection by you.)
- **Google "Data safety":** No data collected, no data shared. Data is not encrypted in transit
  because none is sent; answer "No" to collection and the form skips most questions.

If FightCamp ever adds purchases, accounts, syncing or analytics, these answers and `privacy.html`
must change first.

## Age rating

Fill in the questionnaire honestly; expected result **Apple 4+** / **Google Everyone**. There is no
violence against people shown (a mannequin hitting a heavy bag), no user chat, no purchases and no
web browsing inside the app beyond Wikipedia summaries. If the questionnaire asks about "sports
violence" or "realistic violence", the honest answer is "none" or "infrequent/mild"; pick "mild" if
unsure, which gives 9+ / Everyone 10+.

## Pictures (all in this `store` folder)

| File | Use |
| --- | --- |
| `app-store-icon-1024.png` | App Store icon, 1024×1024, no transparency (Apple rounds the corners) |
| `play-store-icon-512.png` | Google Play icon, 512×512 |
| `feature-graphic-1024x500.png` | Google Play feature graphic |
| `screens/iphone-*.png` | iPhone 6.7"/6.9" screenshots, 1290×2796 (Apple scales them for smaller iPhones) |
| `screens/android-*.png` | Google Play phone screenshots, 1080×1920 |

Screenshot order: Home, 3D move, Fight camp, Food, Training. All use made-up sample data and the
3D mannequin; no real people. To re-make them after the app changes, see `README.md` in this folder.

Not made yet (only needed if you list for iPad): iPad screenshots at 2048×2732.
