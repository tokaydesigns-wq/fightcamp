/* "Learn from a famous fighter": match what was typed to a fighter and a technique,
   look the fighter up on Wikipedia, and build a 4-week program from the library. */

let learn = null; // the current search: {q, tech, fighter, name, wiki, style}

const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
// Whole-word match, so "ali" doesn't match inside "alvarez"
const hasWord = (text, w) => (' ' + text + ' ').includes(' ' + w + ' ');
const FILLER = /\b(how|to|do|doe|does|did|like|the|a|an|i|want|learn|teach|me|his|her|their|s|style|technique|move|of|with|and|from|throw|thi|use)\b/g;
// Drop plural "s" so "body shots" finds "body shot" (but leave "cross" alone)
const singular = s => s.replace(/\b(\w{3,}[^s\W])s\b/g, '$1');

// Longest keyword wins, so "low kick" beats "kick"
function longestMatch(text, list, wordsOf) {
  let best = null, hit = '';
  for (const item of list) for (const w of wordsOf(item)) {
    const k = singular(norm(w));
    if (k.length > hit.length && hasWord(text, k)) { best = item; hit = k; }
  }
  return { best, hit };
}

function matchQuery(q) {
  const n = singular(norm(q));
  const t = longestMatch(n, TECHS, t => t.words);
  const f = longestMatch(n, FIGHTERS, f => f.alias);
  // Whatever's left after removing the technique words is probably a fighter's name
  const hitWords = t.hit.split(' ');
  const rest = norm(q).split(' ').filter(w => !hitWords.includes(singular(w))).join(' ')
    .replace(FILLER, ' ').replace(/\s+/g, ' ').trim();
  const fighter = f.best;
  return {
    q, tech: t.best, fighter,
    name: fighter ? fighter.name : (rest.length >= 3 ? rest.replace(/\b\w/g, c => c.toUpperCase()) : ''),
    wiki: null,
  };
}

/* ---------- Wikipedia (free, no key) ---------- */

async function wikiLookup(search) {
  const api = 'https://en.wikipedia.org/w/api.php?action=query&list=search&srlimit=1&format=json&origin=*&srsearch=';
  const hit = (await (await fetch(api + encodeURIComponent(search))).json()).query.search[0];
  if (!hit) return 'none';
  const page = await (await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(hit.title.replace(/ /g, '_')))).json();
  return {
    title: page.title,
    desc: page.description || '',
    text: (page.extract || '').slice(0, 700),
    img: page.thumbnail ? page.thumbnail.source : '',
    url: page.content_urls ? page.content_urls.mobile.page : 'https://en.wikipedia.org/wiki/' + encodeURIComponent(page.title),
  };
}

async function runLearn(q) {
  learn = matchQuery(q);
  if (!learn.name) return render();
  learn.wiki = 'loading';
  render();
  const mine = learn;
  try {
    mine.wiki = await wikiLookup(mine.fighter ? (mine.fighter.wiki || mine.fighter.name) : mine.name);
    if (mine.wiki !== 'none') {
      if (!mine.fighter) mine.name = mine.wiki.title;
      mine.style = styleFromText(mine.wiki.desc + ' ' + mine.wiki.text.slice(0, 200));
    }
  } catch (e) { mine.wiki = 'offline'; }
  if (learn === mine && location.hash.startsWith('#/learn')) render();
}

/* ---------- Screens ---------- */

const EXAMPLES = ['Lomachenko footwork', 'Mayweather shoulder roll', 'Buakaw body kick', 'Khabib single leg', 'Marcelo Garcia guillotine', 'Tyson head movement'];

function learnScreen() {
  return `<h1 class="title">Learn from a fighter</h1>
  <form class="card" data-form="learn">
    <label for="lq">What do you want to learn, and from who?</label>
    <div class="search"><input id="lq" name="q" placeholder="e.g. Lomachenko footwork" value="${esc(learn ? learn.q : '')}" autocomplete="off" required>
    <button class="btn primary">Go</button></div>
    <div class="chips">${EXAMPLES.map(e => `<button type="button" class="chip" data-act="learn-ex" data-q="${esc(e)}">${esc(e)}</button>`).join('')}</div>
  </form>
  ${learn ? learnResult() : ''}
  ${myPrograms()}
  ${library()}`;
}

function wikiCard(w, name) {
  if (w === 'loading') return `<div class="card fighter"><div class="ph skel"></div><div><h2>${esc(name)}</h2><p class="muted">Looking them up on Wikipedia…</p></div></div>`;
  if (w === 'offline') return `<div class="card note">Couldn't reach Wikipedia (are you offline?). You can still start the program.</div>`;
  if (!w || w === 'none') return name ? `<div class="card note">Couldn't find "${esc(name)}" on Wikipedia, but you can still build a program.</div>` : '';
  return `<div class="card fighter">
    ${w.img ? `<img class="ph" src="${esc(w.img)}" alt="">` : '<div class="ph"></div>'}
    <div><h2>${esc(w.title)}</h2><p class="muted small">${esc(w.desc)}</p></div>
    <p class="extract">${esc(w.text)}</p>
    <a class="small" href="${esc(w.url)}" target="_blank" rel="noopener">Read more on Wikipedia</a></div>`;
}

function learnResult() {
  const { tech, fighter } = learn;
  let body;
  if (tech) {
    const how = fighter && fighter.how[tech.id];
    body = `<div class="card">
      <p class="eyebrow">${esc(STYLES[tech.style])}</p><h2>${esc(tech.name)}</h2>
      <p>${esc(tech.what)}</p>
      ${how ? `<div class="how"><b>How ${esc(fighter.name.split(' ').at(-1))} does it</b><p>${esc(how)}</p></div>` : ''}
      ${moveDemo(tech.id)}
      <h3>Key points</h3><ol>${tech.keys.map(k => `<li>${esc(k)}</li>`).join('')}</ol>
      <button class="btn primary wide" data-act="prog-start">Start my 4-week program</button>
      <button class="btn ghost wide" data-act="learn-clear-tech">Pick a different technique</button></div>`;
  } else {
    // No technique recognised: offer the fighter's signature moves, or the closest style's list
    const sig = fighter ? fighter.sig.map(techById) : [];
    const style = learn.style;
    const others = TECHS.filter(t => !sig.includes(t) && (!style || t.style === style));
    body = `<div class="card">
      ${sig.length ? `<h2>${esc(fighter.name)} is known for</h2><div class="picks">${sig.map(pickBtn).join('')}</div>` : ''}
      <h3>${sig.length ? 'Or pick another technique' : 'Which technique do you want to learn?'}</h3>
      <div class="picks">${others.map(pickBtn).join('')}</div></div>`;
  }
  return `${wikiCard(learn.wiki, learn.name)}${body}
    <p class="muted small center">Programs come from FightCamp's built-in drill library. Fighter info comes from Wikipedia.</p>`;
}

const pickBtn = t => `<button class="pick" data-act="learn-pick" data-id="${t.id}">${esc(t.name)}</button>`;

function progStats(p) {
  const total = buildPlan(techById(p.techId), p.fighter).reduce((n, w) => n + w.items.length, 0);
  const done = Object.values(p.done).filter(Boolean).length;
  return { total, done, pct: Math.round(done / total * 100) };
}

function myPrograms() {
  if (!state.programs.length) return '';
  return `<section class="card"><h2>Your programs</h2><ul class="list">${state.programs.map(p => {
    const s = progStats(p), t = techById(p.techId);
    return `<li><a class="prog-row" href="#/p/${p.id}"><span><b>${esc(t.name)}</b>
      <span class="muted small">${p.fighter ? 'like ' + esc(p.fighter) + ' · ' : ''}${s.pct}% done</span></span>
      <span class="bar mini"><i style="width:${s.pct}%"></i></span></a></li>`;
  }).join('')}</ul></section>`;
}

function library() {
  return `<details class="card"><summary>Browse all ${TECHS.length} techniques</summary>
    ${Object.entries(STYLES).map(([id, label]) => `<h3>${esc(label)}</h3>
      <div class="picks">${TECHS.filter(t => t.style === id).map(pickBtn).join('')}</div>`).join('')}</details>`;
}

function programScreen(id) {
  const p = state.programs.find(p => p.id === id);
  if (!p) return `<p class="card">That program isn't here any more. <a href="#/learn">Back to Learn</a></p>`;
  const t = techById(p.techId), f = FIGHTERS.find(f => f.name === p.fighter);
  const how = f && f.how[t.id], s = progStats(p);
  const yt = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(`${p.fighter || ''} ${t.name} technique`.trim());
  const weeks = buildPlan(t, p.fighter).map((w, wi) => `<section class="card week">
    <h2>${esc(w.title)}</h2><p class="muted">${esc(w.goal)}</p>
    <ul class="checks">${w.items.map((it, ii) => {
      const k = wi + '-' + ii;
      return `<li><label><input type="checkbox" data-act="prog-tick" data-k="${k}" ${p.done[k] ? 'checked' : ''}>
        <span><em>${esc(it.kind)}</em> ${esc(it.text)}<small>${esc(it.dose)}</small></span></label>${drillTimerBtn(it.dose)}</li>`;
    }).join('')}</ul></section>`).join('');

  return `<a class="back" href="#/learn">‹ Learn</a>
  <header class="card prog-head">
    ${p.wiki && p.wiki.img ? `<img class="ph" src="${esc(p.wiki.img)}" alt="">` : ''}
    <div><p class="eyebrow">4-week program</p><h1>${esc(t.name)}</h1>
    ${p.fighter ? `<p class="muted">like ${esc(p.fighter)}</p>` : ''}</div>
    <div class="meter wide"><div class="meter-top"><span>Progress</span><span><b>${s.done}</b> / ${s.total} drills</span></div>
    <div class="bar"><i style="width:${s.pct}%"></i></div></div></header>
  <section class="card"><h2>How it's done</h2><p>${esc(t.what)}</p>
    ${moveDemo(t.id)}
    ${how ? `<div class="how"><b>How ${esc(p.fighter.split(' ').at(-1))} does it</b><p>${esc(how)}</p></div>` : ''}
    <h3>Key points</h3><ol>${t.keys.map(k => `<li>${esc(k)}</li>`).join('')}</ol>
    <h3>Common mistakes</h3><ul>${t.mistakes.map(k => `<li>${esc(k)}</li>`).join('')}</ul>
    <a class="btn wide" href="${yt}" target="_blank" rel="noopener">▶ Find videos on YouTube</a></section>
  ${weeks}
  <button class="btn ghost wide danger" data-act="prog-del" data-id="${p.id}">Delete this program</button>`;
}

/* ---------- Clicks for this screen ---------- */

function learnAct(act, el) {
  switch (act) {
    case 'learn-ex': runLearn(el.dataset.q); return true;
    case 'learn-pick': {
      const t = techById(el.dataset.id);
      if (!learn) learn = { q: t.name, fighter: null, name: '', wiki: null };
      learn.tech = t;
      render(); $('#app').scrollIntoView(); return true;
    }
    case 'learn-clear-tech': learn.tech = null; render(); return true;
    case 'prog-start': {
      const w = learn.wiki && typeof learn.wiki === 'object' ? { title: learn.wiki.title, img: learn.wiki.img } : null;
      const p = { id: uid(), techId: learn.tech.id, fighter: learn.name || '', wiki: w, started: ymd(), done: {} };
      state.programs.unshift(p); save();
      learn = null;
      location.hash = '#/p/' + p.id; return true;
    }
    case 'prog-tick': {
      const p = state.programs.find(p => p.id === location.hash.split('/')[2]);
      p.done[el.dataset.k] = el.checked; save();
      const y = scrollY; render(); scrollTo(0, y); return true;
    }
    case 'prog-del':
      if (confirm('Delete this program and its ticks?')) {
        state.programs = state.programs.filter(p => p.id !== el.dataset.id); save();
        location.hash = '#/learn';
      }
      return true;
  }
  return false;
}
