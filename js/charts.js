/* Small SVG charts. Colours come from CSS so they follow light/dark mode. */

// Bars with a value on top and a label underneath; the last bar is highlighted as "now"
function barChart(vals, labels, label) {
  const W = 320, H = 130, top = 16, bottom = 18;
  const max = Math.max(...vals, 1), bw = W / vals.length;
  const bars = vals.map((v, i) => {
    const h = Math.max((H - top - bottom) * v / max, v ? 3 : 0);
    const x = i * bw + 4, y = H - bottom - h, cx = x + (bw - 8) / 2;
    return `<rect x="${x}" y="${y}" width="${bw - 8}" height="${h}" rx="4" class="${i === vals.length - 1 ? 'now' : ''}"/>
      ${v ? `<text class="val" x="${cx}" y="${y - 4}">${v}</text>` : ''}
      <text x="${cx}" y="${H - 4}">${esc(labels[i])}</text>`;
  }).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">
    <line x1="0" x2="${W}" y1="${H - bottom}" y2="${H - bottom}" class="axis"/>${bars}</svg>`;
}

// Line over time. points: [{date, v}] sorted by date. Optional dashed goal line.
function lineChart(points, goal, label) {
  const W = 320, H = 140, l = 40, r = 22, t = 14, b = 20;
  const vals = points.map(p => p.v).concat(goal != null ? [goal] : []);
  let lo = Math.min(...vals), hi = Math.max(...vals);
  if (hi - lo < 2) { lo -= 1; hi += 1; }
  const first = points[0].date, span = Math.max(daysBetween(first, points.at(-1).date), 1);
  const X = d => l + (W - l - r) * daysBetween(first, d) / span;
  const Y = v => t + (H - t - b) * (hi - v) / (hi - lo);
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${X(p.date).toFixed(1)},${Y(p.v).toFixed(1)}`).join('');
  const dots = points.map(p => `<circle cx="${X(p.date)}" cy="${Y(p.v)}" r="3"/>`).join('');
  const goalLine = goal != null
    ? `<line class="goal" x1="${l}" x2="${W - r}" y1="${Y(goal)}" y2="${Y(goal)}"/><text class="goal-t" x="${l + 4}" y="${Y(goal) - 5}" text-anchor="start">limit</text>` : '';
  return `<svg class="chart line" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">
    <text x="${l - 6}" y="${t + 4}" text-anchor="end">${round1(hi)}</text>
    <text x="${l - 6}" y="${H - b}" text-anchor="end">${round1(lo)}</text>
    <text x="${l}" y="${H - 4}" text-anchor="start">${esc(shortDate(first))}</text>
    <text x="${W - 2}" y="${H - 4}" text-anchor="end">${esc(shortDate(points.at(-1).date))}</text>
    ${goalLine}<path d="${path}"/>${dots}</svg>`;
}

// Labelled progress bar against a target
function meter(name, val, target, unit = '') {
  const pct = target ? Math.min(100, Math.round(val / target * 100)) : 0;
  return `<div class="meter"><div class="meter-top"><span>${esc(name)}</span>
    <span><b>${Math.round(val)}</b>${unit} / ${target}${unit}</span></div>
    <div class="bar"><i style="width:${pct}%"></i></div></div>`;
}

// A number tile, with an optional icon name from art.js
const stat = (n, label, ic) => `<div class="stat">${ic ? icon(ic) : ''}<b>${n}</b><span>${esc(label)}</span></div>`;
