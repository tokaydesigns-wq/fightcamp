/* Well-known fighters, what they're known for, and a short note on how they do it.
   alias: lower-case names people might type. sig: technique ids from techniques.js.
   Fighters not on this list still work: the app looks them up on Wikipedia. */

const FIGHTERS = [
  // Boxing
  { name: 'Vasiliy Lomachenko', alias: ['lomachenko', 'loma'], sig: ['angles', 'feints'], how: {
    angles: 'Loma steps his lead foot outside his opponent\'s, pivots, and is suddenly side-on to them while they are still facing forward. He punches from there, then pivots again.',
    feints: 'He uses tiny shoulder and foot feints to freeze opponents for a split second, then steps around them.' } },
  { name: 'Floyd Mayweather Jr.', alias: ['mayweather', 'floyd'], sig: ['shoulder-roll', 'cross', 'distance'], how: {
    'shoulder-roll': 'Floyd keeps his lead hand low across his stomach and his chin tucked behind his lead shoulder. Right hands glance off the shoulder and he answers with his own right.',
    cross: 'His best punch is the pull counter: he leans back just out of the jab\'s range, then fires a straight right as the jab comes back.',
    distance: 'He stays just at the edge of range, making opponents fall short and counter-punching their misses.' } },
  { name: 'Muhammad Ali', alias: ['muhammad ali', 'ali', 'cassius clay'], sig: ['jab', 'distance'], how: {
    jab: 'Ali threw fast, snapping jabs while moving, often in doubles and triples, with his hands held low and relying on his reflexes.',
    distance: 'He moved constantly on his toes, circling and darting in and out so opponents could never set their feet.' } },
  { name: 'Mike Tyson', alias: ['tyson', 'iron mike'], sig: ['slip', 'hook', 'body'], how: {
    slip: 'Tyson used the peek-a-boo style: gloves high by his cheeks, constant side-to-side head movement, and slips that loaded up his punches.',
    hook: 'He slipped to the outside and came back with a short, explosive lead hook, often right after a body shot.',
    body: 'He dipped low to throw a right hand to the body, then came up with a hook or uppercut to the head.' } },
  { name: 'Canelo Álvarez', alias: ['canelo', 'alvarez', 'saul alvarez'], sig: ['body', 'slip'], how: {
    body: 'Canelo is patient: he blocks or slips a shot, then digs a hard lead hook or uppercut to the body.',
    slip: 'He makes small, tight slips and rolls just out of the way, staying in range to counter.' } },
  { name: 'Pernell Whitaker', alias: ['whitaker', 'sweet pea'], sig: ['slip', 'angles'], how: {
    slip: 'Whitaker bent and swayed at the waist and knees in every direction, making opponents miss by inches and then countering.',
    angles: 'As a southpaw he kept stepping off to the side, so opponents were always reaching.' } },
  { name: 'Gennady Golovkin', alias: ['golovkin', 'ggg', 'triple g'], sig: ['pressure', 'jab'], how: {
    pressure: 'GGG walks forward behind a strong jab, stepping across to cut off the ring rather than chasing.',
    jab: 'His jab is a hard, heavy punch that he uses to push opponents back toward the ropes.' } },
  { name: 'Naoya Inoue', alias: ['inoue', 'monster'], sig: ['body', 'distance'], how: {
    body: 'Inoue is known for brutal left hooks to the body, often thrown after showing a punch to the head first.',
    distance: 'He has superb timing and finds the exact range to land his power shots, then steps out.' } },
  { name: 'Oleksandr Usyk', alias: ['usyk'], sig: ['angles', 'distance'], how: {
    angles: 'As a southpaw heavyweight, Usyk keeps circling and changing angles with constant small steps, so bigger men can\'t set their feet.',
    distance: 'He moves in and out of range non-stop, landing one or two shots and leaving before the counter.' } },
  { name: 'Larry Holmes', alias: ['larry holmes', 'holmes'], sig: ['jab'], how: {
    jab: 'Holmes had one of the best jabs in heavyweight history: stiff, fast, and thrown in bunches to set up his right hand.' } },
  { name: 'Joe Frazier', alias: ['frazier', 'smokin joe'], sig: ['hook', 'pressure', 'slip'], how: {
    hook: 'Frazier bobbed and weaved his way inside, then threw a devastating left hook to the head.',
    pressure: 'He came forward non-stop, bobbing and weaving, making opponents fight at his pace.' } },
  { name: 'Julio César Chávez', alias: ['chavez', 'julio cesar chavez'], sig: ['body', 'pressure'], how: {
    body: 'Chávez cut off the ring and broke opponents down with relentless left hooks to the body.' } },

  // Muay Thai & Kickboxing
  { name: 'Buakaw Banchamek', alias: ['buakaw'], sig: ['roundhouse', 'clinch'], how: {
    roundhouse: 'Buakaw\'s body kick turns his hip fully over and drives through with the shin, thrown over and over without losing balance.',
    clinch: 'He is strong in the clinch, using it to off-balance opponents and throw knees to the body.' } },
  { name: 'Saenchai', alias: ['saenchai'], sig: ['teep', 'switch-kick', 'feints'], how: {
    teep: 'Saenchai uses the teep to stop opponents in their tracks, often to the face, with perfect timing.',
    'switch-kick': 'He switches his feet in a tiny, quick hop and kicks before the opponent can react.',
    feints: 'He fakes constantly with his feet and hips, then lands from an unexpected angle.' } },
  { name: 'Yodsanklai Fairtex', alias: ['yodsanklai'], sig: ['roundhouse'], how: {
    roundhouse: 'Yodsanklai is a southpaw famous for a heavy left body kick, timed as opponents step in or set up.' } },
  { name: 'Rodtang Jitmuangnon', alias: ['rodtang'], sig: ['pressure', 'clinch'], how: {
    pressure: 'Rodtang walks straight through opponents\' shots, accepts exchanges and drowns them in volume.',
    clinch: 'In close he uses short elbows and knees and keeps them trapped against the ropes.' } },
  { name: 'Ramon Dekkers', alias: ['dekkers'], sig: ['low-kick', 'hook'], how: {
    'low-kick': 'Dekkers finished his punching combinations with brutal low kicks, especially left hook then right low kick.',
    hook: 'His left hook to the head often set up the low kick, or the other way round.' } },
  { name: 'Samart Payakaroon', alias: ['samart'], sig: ['teep', 'distance'], how: {
    teep: 'Samart\'s teep kept opponents at the end of his range, where his boxing and timing ruled.' } },

  // MMA
  { name: 'Israel Adesanya', alias: ['adesanya', 'izzy'], sig: ['feints', 'distance', 'check'], how: {
    feints: 'Adesanya feints constantly with hands, shoulders and feet to read reactions before he attacks.',
    distance: 'He stays long, makes opponents reach, and counters as they come in.' } },
  { name: 'Anderson Silva', alias: ['anderson silva', 'spider'], sig: ['slip', 'distance'], how: {
    slip: 'Silva leaned and slipped just enough for punches to miss by inches, then countered while they were off balance.' } },
  { name: 'Georges St-Pierre', alias: ['st pierre', 'gsp', 'georges st pierre'], sig: ['double-leg', 'jab'], how: {
    'double-leg': 'GSP set up his double leg with the jab, getting opponents to raise their guard, then dropping his level and blasting through.',
    jab: 'He used a stiff, active jab to control the fight and set up his takedowns.' } },
  { name: 'Khabib Nurmagomedov', alias: ['khabib', 'nurmagomedov'], sig: ['single-leg', 'mount'], how: {
    'single-leg': 'Khabib chained attempt after attempt, single leg to trip to double, against the cage until opponents went down.',
    mount: 'On top he locked opponents\' legs, kept heavy pressure, and wore them out with strikes.' } },
  { name: 'Islam Makhachev', alias: ['makhachev', 'islam'], sig: ['single-leg', 'back-take'], how: {
    'single-leg': 'Makhachev uses Dagestani chain wrestling and trips from the clinch.',
    'back-take': 'He hunts the back when opponents turn to get up, then locks the choke.' } },
  { name: 'Conor McGregor', alias: ['mcgregor', 'conor'], sig: ['cross', 'distance'], how: {
    cross: 'McGregor\'s left straight (he is a southpaw) is timed to counter opponents as they step forward.',
    distance: 'He works from a long stance, staying just out of range and pulling opponents onto counters.' } },
  { name: 'Lyoto Machida', alias: ['machida'], sig: ['distance', 'teep'], how: {
    distance: 'Machida uses karate in-and-out movement: he blitzes in, lands, and is gone before the counter.',
    teep: 'His front kick (and famous crane kick) comes up the middle while opponents expect a punch.' } },
  { name: 'José Aldo', alias: ['jose aldo', 'aldo'], sig: ['low-kick', 'sprawl'], how: {
    'low-kick': 'Aldo\'s low kicks wrecked opponents\' legs; he set them up with his boxing and threw them at full power.',
    sprawl: 'He had elite takedown defence, sprawling hard and getting back up quickly.' } },
  { name: 'Valentina Shevchenko', alias: ['shevchenko', 'valentina'], sig: ['clinch', 'distance'], how: {
    clinch: 'Shevchenko uses Muay Thai clinch work to trip and throw opponents to the floor.',
    distance: 'She waits at range and counters precisely when opponents attack.' } },
  { name: 'Max Holloway', alias: ['holloway', 'max holloway'], sig: ['pressure', 'distance'], how: {
    pressure: 'Holloway throws huge volume, mixing punches to the head and body, and speeds up as the fight goes on.' } },

  // BJJ & Wrestling
  { name: 'Marcelo Garcia', wiki: 'Marcelo Garcia jiu-jitsu', alias: ['marcelo garcia', 'marcelo'], sig: ['guillotine', 'butterfly', 'back-take'], how: {
    guillotine: 'Marcelo\'s arm-in guillotine is famous: tight grip, high elbow and a hard crunch forward, from standing or from guard.',
    butterfly: 'He sits up in butterfly guard, gets an underhook, and elevates opponents to sweep or reach X-guard.',
    'back-take': 'He scrambles to the back with arm drags and rolls, then holds a tight seatbelt.' } },
  { name: 'Roger Gracie', alias: ['roger gracie'], sig: ['mount', 'back-take'], how: {
    mount: 'Roger is famous for a simple, almost unstoppable cross-collar choke from mount, set up with patient pressure.' } },
  { name: 'Gordon Ryan', alias: ['gordon ryan'], sig: ['back-take', 'mount'], how: {
    'back-take': 'Ryan takes the back from almost everywhere and is very hard to shake off once he has the seatbelt and hooks.' } },
  { name: 'Demian Maia', alias: ['demian maia', 'maia'], sig: ['single-leg', 'back-take'], how: {
    'single-leg': 'Maia uses a single leg against the cage, mainly to get to the back.',
    'back-take': 'From the single leg he climbs to the back, locks a body triangle and finishes with the rear-naked choke.' } },
  { name: 'Ronda Rousey', alias: ['rousey', 'ronda'], sig: ['armbar', 'clinch'], how: {
    armbar: 'Rousey used judo throws to get to the ground and then hit the armbar in one smooth transition.' } },
  { name: 'Dan Gable', alias: ['gable', 'dan gable'], sig: ['single-leg', 'double-leg'], how: {
    'single-leg': 'Gable was known for relentless pace, attacking the legs again and again until opponents broke.' } },
];

// Guess a style from a Wikipedia description, so unknown fighters get matching techniques
function styleFromText(s) {
  s = (s || '').toLowerCase();
  if (/mixed martial/.test(s)) return null;
  if (/boxer|boxing/.test(s)) return 'boxing';
  if (/muay|kickbox|thai/.test(s)) return 'muaythai';
  if (/jiu|jitsu|grappl|wrestl|judo|sambo/.test(s)) return 'grappling';
  return null;
}
