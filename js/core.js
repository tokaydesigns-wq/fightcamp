/* FightCamp core: helpers, dates, saved state and training/food maths */

// The app's version, shown on the Home screen. Keep it equal to the number in CACHE in sw.js
// (bump both on every release).
const APP_VERSION = 16;


const KEY = 'fightcamp.v1';
const $ = (sel, el = document) => el.querySelector(sel);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const round1 = n => Math.round(n * 10) / 10;

// Dates are kept as local "YYYY-MM-DD" strings, so a late-night session stays on the right day
function ymd(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function parseYmd(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
function addDays(s, n) { const d = parseYmd(s); d.setDate(d.getDate() + n); return ymd(d); }
function daysBetween(a, b) { return Math.round((parseYmd(b) - parseYmd(a)) / 864e5); }
// Weeks start on Monday
function weekStart(s) { const d = parseYmd(s); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return ymd(d); }
function niceDate(s) { return parseYmd(s).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }); }
function shortDate(s) { return parseYmd(s).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }); }

const SESSION_TYPES = [
  { id: 'boxing', label: 'Boxing' },
  { id: 'muaythai', label: 'Muay Thai / Kickboxing' },
  { id: 'bjj', label: 'BJJ' },
  { id: 'wrestling', label: 'Wrestling' },
  { id: 'mma', label: 'MMA' },
  { id: 'sparring', label: 'Sparring' },
  { id: 'strength', label: 'Strength' },
  { id: 'cardio', label: 'Running / Cardio' },
  { id: 'other', label: 'Other' },
];
const typeLabel = id => (SESSION_TYPES.find(t => t.id === id) || SESSION_TYPES.at(-1)).label;

/* ---------- Saved state ---------- */

// Every field gets a default here so older saved data keeps working when new fields are added
function loadState() {
  let s = {};
  try { s = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { /* start fresh */ }
  return {
    sessions: s.sessions || [],   // {id, date, type, mins, rounds, rpe, notes}
    meals: s.meals || [],         // {id, date, name, kcal, protein}
    weights: s.weights || [],     // {date, kg} one per day
    targets: Object.assign({ kcal: 2500, protein: 160 }, s.targets),
    unit: s.unit || 'kg',
    camp: s.camp || null,         // {date, opponent, cls, limitKg, start}
    programs: s.programs || [],   // {id, techId, fighter, wiki, started, done:{}}
    timer: Object.assign({ rounds: 3, work: 180, rest: 60 }, s.timer), // seconds
  };
}
let state = loadState();
function save() { localStorage.setItem(KEY, JSON.stringify(state)); }

/* ---------- Weight units (stored in kg) ---------- */

const LB = 2.20462;
const toKg = v => state.unit === 'lb' ? v / LB : v;
const fromKg = kg => state.unit === 'lb' ? kg * LB : kg;
const fmtW = kg => `${round1(fromKg(kg))} ${state.unit}`;
const latestWeight = () => [...state.weights].sort((a, b) => b.date.localeCompare(a.date))[0];

/* ---------- Training maths ---------- */

// Totals for the last n weeks, oldest first; the last entry is this week
function weekTotals(n) {
  const now = weekStart(ymd());
  const weeks = Array.from({ length: n }, (_, i) => ({ start: addDays(now, -7 * (n - 1 - i)), count: 0, mins: 0 }));
  for (const s of state.sessions) {
    const w = weeks.find(w => w.start === weekStart(s.date));
    if (w) { w.count++; w.mins += +s.mins || 0; }
  }
  return weeks;
}

// Days in a row with training, counting back from today (or yesterday if today isn't logged yet)
function streak() {
  const days = new Set(state.sessions.map(s => s.date));
  let d = ymd(), n = 0;
  if (!days.has(d)) d = addDays(d, -1);
  while (days.has(d)) { n++; d = addDays(d, -1); }
  return n;
}

/* ---------- Food maths ---------- */

function dayFood(date) {
  const meals = state.meals.filter(m => m.date === date);
  return {
    meals,
    kcal: meals.reduce((t, m) => t + (+m.kcal || 0), 0),
    protein: meals.reduce((t, m) => t + (+m.protein || 0), 0),
  };
}

// Recent distinct meals, so a repeat meal is one tap
function recentMeals(n = 6) {
  const seen = new Set(), out = [];
  for (const m of [...state.meals].reverse()) {
    const k = m.name.toLowerCase();
    if (!seen.has(k)) { seen.add(k); out.push(m); }
    if (out.length >= n) break;
  }
  return out;
}
