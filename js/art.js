/* Artwork drawn in code: a pictogram fighter (thick rounded limbs, like sports signage) built
   from the same 2D poses as the animations in moves.js, banner scenes for the top of each screen,
   small icons, and empty-state pictures. All SVG, so it's free, sharp and works offline.
   Colours use CSS variables through style="" so they follow light and dark mode. */

// Pictogram figure from a 2D pose. color = body, gap = background colour used to outline the
// near-side limbs so they read in front of the far ones, hot = limb drawn in the accent colour.
function picto(p, { color = '#fff', gap = '#1a1a21', hot = '', far = .55 } = {}) {
  const P = k => p[k].join(' ');
  const limb = (a, b, c, w, col, outline) => {
    const d = `M${P(a)} L${P(b)} L${P(c)}`;
    const line = (stroke, width) => `<path d="${d}" style="stroke:${stroke};stroke-width:${width};fill:none;stroke-linecap:round;stroke-linejoin:round"/>`;
    return (outline ? line(gap, w + 7) : '') + line(col, w);
  };
  const col = part => part === hot ? 'var(--accent)' : color;
  const ball = (k, r, c, outline) => (outline ? `<circle cx="${p[k][0]}" cy="${p[k][1]}" r="${r + 3.5}" style="fill:${gap}"/>` : '')
    + `<circle cx="${p[k][0]}" cy="${p[k][1]}" r="${r}" style="fill:${c}"/>`;
  const rearLeg = front => limb('hip', 'rK', 'rA', 16, col('rear-leg'), front);
  const rearArm = front => limb('neck', 'rE', 'rF', 13, col('rear-arm'), front) + ball('rF', 11, col('rear-arm'), front);
  // Far-side limbs are faded and behind, unless they're the limb doing the move: then bold, in front
  return `<g style="opacity:${far}">${hot === 'rear-leg' ? '' : rearLeg()}${hot === 'rear-arm' ? '' : rearArm()}</g>
    <path d="M${P('neck')} L${P('hip')}" style="stroke:${color};stroke-width:26;stroke-linecap:round"/>
    ${limb('hip', 'lK', 'lA', 16, col('lead-leg'), true)}${hot === 'rear-leg' ? rearLeg(true) : ''}
    ${limb('neck', 'lE', 'lF', 13, col('lead-arm'), true)}${ball('lF', 11, col('lead-arm'), true)}${hot === 'rear-arm' ? rearArm(true) : ''}
    ${ball('head', 16, color, true)}`;
}

/* ---------- Banner scenes (viewBox 0 0 300 250) ---------- */

const ropes = () => [150, 172, 194].map((y, i) =>
  `<line x1="-10" y1="${y + 8}" x2="310" y2="${y - 6}" style="stroke:${i === 1 ? 'var(--accent)' : '#fff'};stroke-width:3;opacity:.22"/>`).join('');
const floorShadow = (cx, rx = 70) => `<ellipse cx="${cx}" cy="240" rx="${rx}" ry="7" style="fill:#000;opacity:.35"/>`;
const speedLines = (x, y) => [[0, -14, 26], [-6, 0, 30], [0, 14, 24]].map(([dx, dy, w]) =>
  `<line x1="${x + dx - w}" y1="${y + dy}" x2="${x + dx}" y2="${y + dy}" style="stroke:#fff;stroke-width:3;stroke-linecap:round;opacity:.45"/>`).join('');
const bag = x => `<line x1="${x + 19}" y1="-5" x2="${x + 19}" y2="40" style="stroke:#aaa;stroke-width:2"/>
  <rect x="${x}" y="40" width="38" height="122" rx="12" style="fill:var(--accent)"/>
  <rect x="${x}" y="70" width="38" height="8" style="fill:#000;opacity:.18"/><rect x="${x}" y="128" width="38" height="8" style="fill:#000;opacity:.18"/>`;

const ART = {
  // A jab landing on the heavy bag, in front of the ring ropes
  home: () => `${ropes()}${floorShadow(165)}${bag(254)}${speedLines(214, 84)}${picto(JAB, { hot: 'lead-arm' })}`,
  // Shadowboxing a cross inside a round-timer ring
  train: () => `<circle cx="190" cy="118" r="92" style="fill:none;stroke:#fff;stroke-width:10;opacity:.1"/>
    <path d="M190 26 A92 92 0 0 1 280 135" style="fill:none;stroke:var(--accent);stroke-width:10;stroke-linecap:round"/>
    <rect x="180" y="8" width="20" height="12" rx="3" style="fill:#fff;opacity:.25"/>
    ${floorShadow(165)}${speedLines(220, 84)}${picto(CROSS, { hot: 'rear-arm' })}`,
  // A steaming bowl and a water bottle
  food: () => `<g style="opacity:.5;fill:none;stroke:#fff;stroke-width:5;stroke-linecap:round">
      <path d="M150 105 q-12 -16 0 -32 q12 -16 0 -32"/><path d="M185 105 q-12 -16 0 -32 q12 -16 0 -32"/><path d="M220 105 q-12 -16 0 -32 q12 -16 0 -32"/></g>
    ${floorShadow(190, 95)}
    <path d="M100 125 h180 a90 90 0 0 1 -180 0z" style="fill:#fff"/>
    <path d="M106 150 h168" style="stroke:var(--accent);stroke-width:12"/>
    <rect x="44" y="70" width="40" height="160" rx="12" style="fill:#fff;opacity:.85"/>
    <rect x="52" y="52" width="24" height="22" rx="5" style="fill:var(--accent)"/>
    <rect x="44" y="130" width="40" height="34" style="fill:var(--accent);opacity:.8"/>`,
  // Two fighters squaring off, fight-poster style
  camp: () => `${floorShadow(150, 120)}
    <g transform="translate(-58 0)">${picto(GUARD)}</g>
    <g transform="translate(358 0) scale(-1 1)">${picto(GUARD, { color: 'var(--accent)' })}</g>
    <text x="150" y="168" text-anchor="middle" style="fill:#fff;font:italic 900 38px system-ui,sans-serif;opacity:.9">VS</text>`,
  // A round kick with the path of the foot
  learn: () => `${floorShadow(150)}
    <path d="M112 236 C 196 246 262 210 246 124" style="fill:none;stroke:var(--accent);stroke-width:4;stroke-dasharray:3 9;stroke-linecap:round"/>
    ${picto(KICK, { hot: 'rear-leg' })}`,
};

// The banner at the top of a screen: title and subtitle on the left, the scene on the right
function banner(kind, title, sub, extra = '', eyebrow = '') {
  return `<header class="banner">
    <div class="banner-txt">${eyebrow ? `<p class="banner-eyebrow">${esc(eyebrow)}</p>` : ''}
      <h1>${esc(title)}</h1>${sub ? `<p>${esc(sub)}</p>` : ''}${extra}</div>
    <svg class="banner-art" viewBox="0 0 300 250" aria-hidden="true">${ART[kind]()}</svg></header>`;
}

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? 'Late one, fighter' : h < 12 ? 'Morning, fighter' : h < 18 ? 'Afternoon, fighter' : 'Evening, fighter';
}

/* ---------- Small icons (24×24, drawn with lines) ---------- */

const ICONS = {
  glove: '<path d="M7 11V7a4 4 0 0 1 4-4h3a4 4 0 0 1 4 4v5a5 5 0 0 1-5 5h-2a4 4 0 0 1-4-4zM7 11h7M9 17v3h7v-3"/>',
  clock: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M10 2h4"/>',
  flame: '<path d="M12 3c1 3 5 5.5 5 10a5 5 0 0 1-10 0c0-3 2-4.5 2-7 1.5 1 2.2 2.2 2.2 3.5C12.5 7.5 12.5 5 12 3z"/>',
  scale: '<rect x="3" y="4" width="18" height="16" rx="4"/><path d="M7.5 10a5 5 0 0 1 9 0M12 10l1.5-2"/>',
  chart: '<path d="M5 20V11M10 20V5M15 20v-6M20 20V9"/>',
};
const icon = name => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;

// A friendly picture for empty lists: a fighter in guard, waiting
function emptyState(msg) {
  return `<div class="empty"><svg viewBox="96 30 110 214" aria-hidden="true">${picto(GUARD, { color: 'var(--line)', gap: 'var(--card)', far: 1 })}</svg>
    <p>${esc(msg)}</p></div>`;
}
