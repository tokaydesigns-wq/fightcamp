/* Fight camp phases and tips. min/max = days before the fight.
   Weight advice stays conservative on purpose: slow losses, no unsupervised water cuts. */

const PHASES = [
  { id: 'base', name: 'Before camp', when: 'More than 8 weeks out', min: 57, max: Infinity,
    goal: 'Stay in shape so camp starts from a strong base.',
    train: ['Keep training 3 to 5 times a week', 'Work on your weak spots while there\'s no pressure', 'Build your engine: easy runs, bike or swimming'],
    food: ['Eat normally with plenty of protein', 'Try to stay within about 10% of your fight weight'],
    tips: ['Get any niggles or injuries looked at now', 'Plan camp with your coach and line up sparring partners'] },
  { id: 'build', name: 'Build', when: '8 to 5 weeks out', min: 29, max: 56,
    goal: 'Build fitness and sharpen the game plan. This is the hardest part of camp.',
    train: ['Most training volume of the whole camp', '2 to 3 hard sparring sessions a week at most; keep the rest light', 'Strength work twice a week and hard conditioning intervals'],
    food: ['Lose weight slowly: about 0.5 to 1% of your body weight a week', 'Protein around 2 g per kg of body weight a day', 'Eat your carbs around your hardest sessions'],
    tips: ['Study your opponent and pick 2 or 3 things to drill', 'Sleep 8+ hours. It is when you actually get fitter.'] },
  { id: 'peak', name: 'Peak', when: '4 to 2 weeks out', min: 8, max: 28,
    goal: 'Be at your sharpest and fittest.',
    train: ['Spar the way the fight will go: same round length and game plan', 'Last hard sparring about 10 to 14 days before the fight', 'Keep intensity high but start cutting the total volume'],
    food: ['Aim to be within about 5 to 8% of the weight limit by the end of this phase', 'No crash dieting, because your performance will drop'],
    tips: ['Rehearse your game plan and your corner\'s calls', 'Plan fight-week travel, food and weigh-in times'] },
  { id: 'fightweek', name: 'Fight week', when: 'Last 7 days', min: 2, max: 7,
    goal: 'Rest up, stay sharp and make weight safely.',
    train: ['Light pads, shadowboxing and drilling only', 'No hard sparring', 'Short sessions to stay loose and sweat a little'],
    food: ['Lower-fibre, lower-salt foods can safely drop a little weight', 'Keep drinking normally unless your coach has a supervised plan', 'Weigh yourself every morning after the toilet'],
    tips: ['Never use saunas, sweat suits or pills to drop weight without a coach or doctor supervising. Serious dehydration is dangerous.', 'Pack your bag early and get lots of sleep'] },
  { id: 'weighin', name: 'Weigh-in and refuel', when: 'The day before', min: 1, max: 1,
    goal: 'Make weight, then refuel properly.',
    train: ['Light shadowboxing to loosen up, nothing more'],
    food: ['After weigh-in, sip fluids with electrolytes. Don\'t chug.', 'Small, easy meals every 2 to 3 hours: rice, pasta, bread, fruit, lean protein', 'Stick to familiar foods, nothing new or greasy'],
    tips: ['Most pro weigh-ins are the day before. If yours is on fight day, follow your coach\'s plan.', 'Get off your feet and sleep early'] },
  { id: 'fight', name: 'Fight day', when: 'Today', min: 0, max: 0,
    goal: 'Trust your training.',
    train: ['Warm up until you break a sweat: shadowboxing, then a few rounds on pads'],
    food: ['A familiar meal 3 to 4 hours before', 'A small snack about 1 hour before'],
    tips: ['Stick to the game plan and listen to your corner', 'Enjoy it. You earned this.'] },
  { id: 'after', name: 'Recovery', when: 'After the fight', min: -Infinity, max: -1,
    goal: 'Recover fully before the next camp.',
    train: ['At least a week off hard training', 'Get any head knocks checked and follow any medical suspension'],
    food: ['Eat well and rehydrate, but get back to normal eating, not a binge'],
    tips: ['Watch the fight with your coach and write down 3 things to work on', 'Turn one of them into a program in Learn'] },
];

const phaseFor = daysOut => PHASES.find(p => daysOut >= p.min && daysOut <= p.max);

function campStatus(camp) {
  const daysOut = daysBetween(ymd(), camp.date);
  return { daysOut, weeksOut: Math.ceil(daysOut / 7), phase: phaseFor(daysOut) };
}

// How fast you'd need to lose weight to reach the limit by fight week, as % of body weight per week
function cutPace(camp) {
  const w = latestWeight();
  if (!w || !camp.limitKg) return null;
  const toGo = w.kg - camp.limitKg;
  const weeks = Math.max((daysBetween(ymd(), camp.date) - 1) / 7, 0.15);
  return { now: w.kg, toGo, perWeek: toGo / weeks, pct: toGo / weeks / w.kg * 100 };
}
