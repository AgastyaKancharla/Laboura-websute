/* Inner pages: one interaction per section, driven by scroll, tap or drag */
(function(){
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const WA = 'https://wa.me/917483919241';
const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
const prog = el => { const r = el.getBoundingClientRect(); const run = el.offsetHeight - innerHeight; return run > 0 ? clamp(-r.top / run, 0, 1) : (r.top < innerHeight * .6 ? 1 : 0); };
const view = el => { const r = el.getBoundingClientRect(); return clamp((innerHeight - r.top) / (innerHeight + r.height), 0, 1); };
const loops = [];

/* ---------- Job seekers: who you are, used by every section below ---------- */
const ROLES = {
  'cook': ['a cook', 'a restaurant', ['Cook', 'Kitchen helper']],
  'drive': ['a driver', 'a transport company', ['Driver', 'Forklift driver', 'Delivery boy']],
  'deliver': ['a delivery boy', 'a delivery hub', ['Delivery boy', 'Loader', 'Driver']],
  'sell': ['sales staff', 'a shop', ['Sales staff', 'Cashier', 'Field sales', 'Store helper']],
  'clean': ['housekeeping staff', 'a hotel', ['Housekeeping', 'Room boy', 'Office boy']],
  'guard': ['a security guard', 'an apartment', ['Security guard', 'Watchman']],
  'pack': ['packing staff', 'a warehouse', ['Packer', 'Picker', 'Loader']],
  'serve food': ['a waiter', 'a restaurant', ['Waiter', 'Room boy', 'Kitchen helper']],
  'fix wiring': ['an electrician', 'a building site', ['Electrician', 'Plumber', 'Construction helper']],
  'do hair': ['a hair stylist', 'a salon', ['Hair stylist', 'Beautician']],
  'take calls': ['a telecaller', 'an office', ['Telecaller', 'Receptionist', 'Data entry']],
  'run machines': ['a machine operator', 'a factory', ['Machine operator', 'Factory helper', 'Quality checker']],
  'care for patients': ['a patient care helper', 'a hospital', ['Patient care', 'Nurse aide', 'Ward boy']],
  'keep stock': ['a store keeper', 'a warehouse', ['Stock keeper', 'Store helper', 'Picker']]
};
window.LB_ME = { verb: 'cook', label: 'cook', city: 'Bengaluru' };
const meText = () => { const r = ROLES[LB_ME.verb] || ROLES.cook; return { verb: LB_ME.verb, label: LB_ME.label, city: LB_ME.city, who: r[0], placeA: r[1], place: r[1].replace(/^(a|an) /, '') }; };
function applyMe(){
  const t = meText();
  $$('[data-me]').forEach(el => { const v = t[el.dataset.me]; if (v != null && el.textContent !== v) el.textContent = v; });
  const msg = encodeURIComponent(`Hi Laboura, I want a ${t.label} job near ${t.city}`);
  $$('a[href^="https://wa.me/"]').forEach(a => { if (!a.closest('.bh,.fb,.bn,.ag')) a.href = `${WA}?text=${msg}`; });
  document.dispatchEvent(new CustomEvent('lb:me', { detail: t }));
}
window.LB_ROLES = ROLES;

/* ---------- Job seekers: sentence builder ---------- */
const jh = $('.jh');
if (jh){
  const picks = $$('.jh-pick', jh), lists = $$('.jh-list', jh), out = { role: $('[data-o="role"]', jh), city: $('[data-o="city"]', jh) };
  let touched = false, openList = null;
  try { const s = JSON.parse(localStorage.getItem('lb-me') || 'null'); if (s && ROLES[s.verb]) { Object.assign(LB_ME, s); touched = true; } } catch(e){}
  const set = (k, v, l, anim, user) => {
    const b = picks.find(p => p.dataset.list === k); b.textContent = v;
    if (anim){ b.classList.remove('swap'); void b.offsetWidth; b.classList.add('swap'); }
    out[k].textContent = l;
    if (k === 'role'){ LB_ME.verb = v; LB_ME.label = l; } else LB_ME.city = v;
    if (user){ try { localStorage.setItem('lb-me', JSON.stringify(LB_ME)); } catch(e){} }
    applyMe();
  };
  const close = () => { if (!openList) return; openList.hidden = true; picks.forEach(p => p.setAttribute('aria-expanded', 'false')); openList = null; };
  picks.forEach(b => b.addEventListener('click', e => {
    e.stopPropagation(); touched = true; const l = lists.find(x => x.dataset.for === b.dataset.list);
    if (openList === l){ close(); return; } close();
    l.hidden = false; openList = l; b.setAttribute('aria-expanded', 'true');
    const r = b.getBoundingClientRect(), pr = jh.querySelector('.jh-say').getBoundingClientRect(); l.style.top = (r.bottom - pr.top) + 'px';
    const first = $('li', l); first && first.focus();
  }));
  lists.forEach(l => {
    l.addEventListener('click', e => { const li = e.target.closest('li'); if (!li) return; set(l.dataset.for, li.dataset.v, li.dataset.l, true, true); const b = picks.find(p => p.dataset.list === l.dataset.for); close(); b.focus(); });
    l.addEventListener('keydown', e => {
      const items = $$('li', l), i = items.indexOf(document.activeElement);
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown'){ e.preventDefault(); (items[i + 1] || items[0]).focus(); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp'){ e.preventDefault(); (items[i - 1] || items[items.length - 1]).focus(); }
      if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); document.activeElement.click(); }
      if (e.key === 'Escape'){ const b = picks.find(p => p.dataset.list === l.dataset.for); close(); b.focus(); }
    });
  });
  document.addEventListener('click', e => { if (openList && !openList.contains(e.target)) close(); });
  set('role', LB_ME.verb, LB_ME.label); set('city', LB_ME.city, LB_ME.city);
  /* until someone taps, the sentence changes by itself, but only while the hero is on screen */
  if (!reduce){
    const roles = $$('[data-for="role"] li', jh), cities = $$('[data-for="city"] li', jh); let n = 0;
    const tick = () => { if (touched) return; if (scrollY > innerHeight * .4){ touched = true; return; }
      n++; const r = roles[n % roles.length]; set('role', r.dataset.v, r.dataset.l, true);
      if (n % 2 === 0){ const c = cities[(n * 5) % cities.length]; set('city', c.dataset.v, c.dataset.l, true); } setTimeout(tick, 2400); };
    setTimeout(tick, 2600);
  }
}

/* ---------- Job seekers: work that fits ---------- */
const jw = $('.jw');
if (jw){
  const chips = $$('.jw-chips button', jw), wall = $('.jw-wall', jw), items = $$('li', wall);
  wall.dataset.k = 'women';
  const paint = () => { const k = wall.dataset.k, mine = (ROLES[LB_ME.verb] || ROLES.cook)[2];
    wall.classList.toggle('f', k !== 'all'); items.forEach(li => li.classList.toggle('hit', k === 'all' || (k === 'me' ? mine.includes(li.textContent) : li.dataset.k.split(' ').includes(k)))); };
  document.addEventListener('lb:me', paint); paint();
  chips.forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.k; chips.forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
    wall.dataset.k = k; paint();
  }));
}

/* ---------- Is Laboura in my city: search, state names and a dot map of India ---------- */
const jl = $('.jl');
if (jl){
  const biz = jl.dataset.kind === 'biz';
  const inp = $('#jl-find'), ans = $('.jl-ans', jl), boxes = $$('.jl-states > div', jl), cv = $('.jl-map', jl);
  const map = []; boxes.forEach((b, i) => { const st = $('h3', b).textContent; $('p', b).textContent.split(',').forEach(c => map.push([c.trim(), st, b, i + 1])); map.push([st, st, b, i + 1]); });
  const norm = s => s.toLowerCase().replace(/[^a-z]/g, '').replace('bangalore', 'bengaluru').replace('mysore', 'mysuru').replace('hubli', 'hubballi').replace('mangalore', 'mangaluru').replace('trivandrum', 'thiruvananthapuram').replace('calicut', 'kozhikode').replace('cochin', 'kochi').replace('bombay', 'mumbai').replace('madras', 'chennai').replace('vizag', 'visakhapatnam').replace('trichy', 'tiruchirappalli').replace('banaras', 'varanasi').replace('benaras', 'varanasi');
  const say = html => { ans.innerHTML = `<span>${html}</span>`; };
  let active = 0, flash = 0;
  const light = s => { active = s; flash = performance.now(); boxes.forEach((b, i) => b.classList.toggle('hit', i + 1 === s)); };
  const verb = biz ? 'sends staff' : jl.dataset.kind === 'about' ? 'works' : 'has jobs';
  const check = () => {
    const q = norm(inp.value); ans.className = 'jl-ans';
    if (q.length < 3){ light(0); say('Type your city to check.'); return; }
    const hit = map.find(([c]) => norm(c).startsWith(q) || q.startsWith(norm(c)));
    if (hit){ ans.classList.add('yes'); light(hit[3]); say(hit[0] === hit[1] ? `Yes! Laboura ${verb} across <b>${hit[1]}</b>.` : `Yes! Laboura ${verb} in <b>${hit[0]}</b>, ${hit[1]}.`); }
    else { light(0); ans.classList.add('no'); const name = inp.value.trim().replace(/[<>&"]/g, ''); say(`Not in <b>${name}</b> yet. Send us your details and we will tell you when we start there.`); }
  };
  inp.addEventListener('input', () => { inp.dataset.user = '1'; check(); });
  $$('.jl-states button', jl).forEach(b => b.addEventListener('click', () => { const i = +b.dataset.s, box = boxes[i - 1]; inp.dataset.user = '1';
    inp.value = $('h3', box).textContent; ans.className = 'jl-ans yes'; light(i); say(`Yes! Laboura ${verb} across <b>${inp.value}</b>: ${$('p', box).textContent}.`); }));
  const fill = city => { if (inp.dataset.user) return; inp.value = city; check(); };
  document.addEventListener(biz ? 'lb:biz' : 'lb:me', e => fill(e.detail.city));
  if (biz && window.LB_BIZ) fill(LB_BIZ.city); else if (!biz && window.LB_ME) fill(LB_ME.city);

  /* dot map */
  const I = window.LB_INDIA && (innerWidth <= 860 ? LB_INDIA.small : LB_INDIA.big);
  if (cv && I){
    const ctx = cv.getContext('2d'); let W = 0, H = 0, sc = 1, ox = 0, oy = 0, dot = 2;
    const size = () => { const r = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2); W = r.width; H = r.height; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
      sc = Math.min(W, H / I.aspect) * .98; ox = W / 2; oy = H / 2; dot = Math.max(1.4, I.step * sc * .78); };
    size(); addEventListener('resize', size);
    const n = I.p.length / 3; let seen = false;
    const io = new IntersectionObserver(es => { seen = es[0].isIntersecting; }, { rootMargin: '100px' }); io.observe(cv);
    (function draw(now){
      requestAnimationFrame(draw); if (!seen) return;
      ctx.clearRect(0, 0, W, H);
      const pulse = reduce ? 1 : .5 + .5 * Math.sin(now / 380), born = clamp((now - flash) / 600, 0, 1);
      const groups = [[], [], []];
      for (let i = 0; i < n; i++){ const s = I.p[i * 3 + 2]; groups[s === 0 ? 0 : s === active ? 2 : 1].push(ox + I.p[i * 3] * sc, oy - I.p[i * 3 + 1] * sc); }
      const paint = (a, col, r) => { if (!a.length) return; ctx.fillStyle = col; ctx.beginPath(); for (let k = 0; k < a.length; k += 2){ ctx.moveTo(a[k] + r, a[k + 1]); ctx.arc(a[k], a[k + 1], r, 0, 6.2832); } ctx.fill(); };
      paint(groups[0], 'rgba(0,0,0,.12)', dot * .42);
      paint(groups[1], active ? 'rgba(0,0,0,.42)' : `rgba(0,0,0,${.4 + pulse * .25})`, dot * .5);
      paint(groups[2], '#E06A00', dot * (.5 + (1 - born) * .35 + pulse * .06));
    })(performance.now());
  }
}

/* ---------- Businesses: who you need, used by every section below ---------- */
const BROLES = {
  'cook': ['a restaurant', 1], 'kitchen helper': ['a restaurant', 1], 'waiter': ['a restaurant', 1], 'sales staff': ['a shop', 0], 'cashier': ['a shop', 0],
  'delivery boy': ['a delivery business', 3], 'driver': ['a transport business', 3], 'security guard': ['an apartment', 7], 'housekeeping staff': ['a hotel', 2],
  'room boy': ['a hotel', 2], 'packer': ['a warehouse', 4], 'machine operator': ['a factory', 5], 'factory helper': ['a factory', 5], 'nurse aide': ['a hospital', 6],
  'receptionist': ['a clinic', 6], 'telecaller': ['an office', 11], 'beautician': ['a salon', 10], 'electrician': ['a building site', 9], 'cleaner': ['an office', 8]
};
window.LB_BIZ = { n: 2, role: 'cook', plural: 'cooks', city: 'Chennai', salary: 10000 };
const bizText = () => { const b = LB_BIZ, r = BROLES[b.role] || BROLES.cook, word = b.n === 1 ? b.role : b.plural;
  return { n: b.n, word, nwho: `${b.n} ${word}`, city: b.city, placeA: r[0], sector: r[1], salary: inr(b.salary), fee: inr(Math.round(b.salary * 0.15)), feeN: Math.round(b.salary * 0.15) }; };
function applyBiz(){
  const t = bizText();
  $$('[data-b]').forEach(el => { const k = el.dataset.b; const v = k === 'nwho' && el.closest('.jh-out') ? `${t.n} checked ${t.word}` : t[k]; if (v != null && el.textContent !== String(v)) el.textContent = v; });
  const msg = encodeURIComponent(`Hi Laboura, I need ${t.nwho} in ${t.city}.`);
  $$('a[href^="https://wa.me/"]').forEach(a => { if (!a.closest('.bn')) a.href = `${WA}?text=${msg}`; });
  document.dispatchEvent(new CustomEvent('lb:biz', { detail: t }));
}
const bzh = $('.bzh');
if (bzh){
  const picks = $$('.jh-pick', bzh), lists = $$('.jh-list', bzh), nOut = $('.bz-n output', bzh); let openList = null;
  try { const s = JSON.parse(localStorage.getItem('lb-biz') || 'null'); if (s && BROLES[s.role]) Object.assign(LB_BIZ, s); } catch(e){}
  const save = () => { try { localStorage.setItem('lb-biz', JSON.stringify(LB_BIZ)); } catch(e){} };
  const paint = anim => { const t = bizText(); nOut.textContent = t.n; const rb = picks[0]; rb.textContent = t.word; picks[1].textContent = t.city;
    if (anim){ rb.classList.remove('swap'); void rb.offsetWidth; rb.classList.add('swap'); }
    $$('[data-for="role"] li', bzh).forEach(li => li.textContent = LB_BIZ.n === 1 ? li.dataset.v : li.dataset.pl); applyBiz(); };
  const bump = d => { LB_BIZ.n = clamp(LB_BIZ.n + d, 1, 50); nOut.classList.remove('swap'); void nOut.offsetWidth; nOut.classList.add('swap'); save(); paint(); };
  $('.bz-p', bzh).addEventListener('click', () => bump(1)); $('.bz-m', bzh).addEventListener('click', () => bump(-1));
  const close = () => { if (!openList) return; openList.hidden = true; picks.forEach(p => p.setAttribute('aria-expanded', 'false')); openList = null; };
  picks.forEach(b => b.addEventListener('click', e => {
    e.stopPropagation(); const l = lists.find(x => x.dataset.for === b.dataset.list); if (openList === l){ close(); return; } close();
    l.hidden = false; openList = l; b.setAttribute('aria-expanded', 'true');
    const r = b.getBoundingClientRect(), pr = $('.bz-say', bzh).getBoundingClientRect(); l.style.top = (r.bottom - pr.top) + 'px';
    const f = $('li', l); f && f.focus(); }));
  lists.forEach(l => {
    l.addEventListener('click', e => { const li = e.target.closest('li'); if (!li) return;
      if (l.dataset.for === 'role'){ LB_BIZ.role = li.dataset.v; LB_BIZ.plural = li.dataset.pl; } else LB_BIZ.city = li.dataset.v;
      save(); close(); paint(true); picks.find(p => p.dataset.list === l.dataset.for).focus(); });
    l.addEventListener('keydown', e => { const items = $$('li', l), i = items.indexOf(document.activeElement);
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown'){ e.preventDefault(); (items[i + 1] || items[0]).focus(); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp'){ e.preventDefault(); (items[i - 1] || items[items.length - 1]).focus(); }
      if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); document.activeElement.click(); }
      if (e.key === 'Escape'){ close(); picks.find(p => p.dataset.list === l.dataset.for).focus(); } });
  });
  document.addEventListener('click', e => { if (openList && !openList.contains(e.target)) close(); });
  setTimeout(() => paint(), 0);
}

/* ---------- Businesses: a candidate moves across the board ---------- */
const bb = $('.bb');
if (bb){
  const cols = $$('.bb-cols li', bb), card = $('.bb-card', bb), tag = $('em', card), tags = ['Called', 'Checked', 'Interview', 'Joined', 'Covered'];
  loops.push(() => {
    if (innerWidth <= 860) return;
    const p = reduce ? 1 : prog(bb), x = p * (cols.length - 1), k = Math.round(x);
    cols.forEach((c, i) => { c.classList.toggle('on', i === k); c.classList.toggle('done', i < k); });
    const w = cols[0].getBoundingClientRect().width + 12; card.style.transform = `translate3d(${x * w}px,0,0)`; tag.textContent = tags[k];
  });
}

/* ---------- Businesses: fee calculator ---------- */
const bp = $('.bp');
if (bp){
  const sal = $('#bp-sal'), salO = $('#bp-sal-o'), nO = $('#bp-n-o'); let n = window.LB_BIZ ? LB_BIZ.n : 1; let quiet = false;
  if (window.LB_BIZ) sal.value = LB_BIZ.salary;
  document.addEventListener('lb:biz', e => { if (quiet) return; n = e.detail.n; upd(true); });
  const upd = (fromBiz) => { const s = +sal.value, fee = Math.round(s * 0.15), tot = fee * n;
    if (window.LB_BIZ && !fromBiz && (LB_BIZ.salary !== s || LB_BIZ.n !== n)){ LB_BIZ.salary = s; LB_BIZ.n = n; quiet = true; applyBiz(); quiet = false; }
    salO.textContent = inr(s); nO.textContent = n; $('#bp-fee').textContent = inr(fee); $('#bp-tot').textContent = inr(tot); $('#bp-gst').textContent = `${inr(tot * 1.18)} with 18% GST`; };
  sal.addEventListener('input', () => upd());
  $('#bp-p').addEventListener('click', () => { n = Math.min(n + 1, 50); upd(); });
  $('#bp-m').addEventListener('click', () => { n = Math.max(n - 1, 1); upd(); });
  upd();
}

/* ---------- Businesses: 60 days ---------- */
const g2 = $('.bg2');
if (g2){
  const d = $('#bg2-d'), out = $('.bg2-out', g2);
  const upd = () => { const v = +d.value; g2.style.setProperty('--d', v); const late = v > 60; g2.classList.toggle('late', late);
    out.innerHTML = late ? `<b>Day ${v}.</b> <span>Past 60 days. A new hire is charged the normal fee.</span>` : `<b>Day ${v}.</b> <span>Laboura sends a replacement free.</span>`; };
  d.addEventListener('input', upd); upd();
}

/* ---------- Businesses: role tabs ---------- */
const br = $('.br');
if (br){
  const tabs = $$('[role="tab"]', br);
  const pick = t => { tabs.forEach(x => { const on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1;
    const p = document.getElementById(x.getAttribute('aria-controls')); p.classList.toggle('on', on);
    if (on) $$('li', p).forEach(li => { li.style.animation = 'none'; void li.offsetWidth; li.style.animation = ''; }); }); };
  let tapped = false;
  tabs.forEach(t => t.addEventListener('click', () => { tapped = true; pick(t); }));
  document.addEventListener('lb:biz', e => { if (!tapped && tabs[e.detail.sector]) pick(tabs[e.detail.sector]); });
  if (window.LB_BIZ) pick(tabs[(BROLES[LB_BIZ.role] || BROLES.cook)[1]]);
  $('[role="tablist"]', br).addEventListener('keydown', e => { const i = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true');
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft'){ e.preventDefault(); const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]; pick(n); n.focus(); } });
}

/* ---------- Businesses: the sign tilts toward you ---------- */
const bn = $('.bn');
if (bn && !reduce){
  const sign = $('.bn-sign', bn);
  bn.addEventListener('pointermove', e => { const r = sign.getBoundingClientRect(); const dx = (e.clientX - (r.left + r.width / 2)) / r.width, dy = (e.clientY - (r.top + r.height / 2)) / r.height;
    sign.style.setProperty('--ry', clamp(dx * 22, -22, 22) + 'deg'); sign.style.setProperty('--rx', clamp(-dy * 18, -18, 18) + 'deg'); });
  bn.addEventListener('pointerleave', () => { sign.style.setProperty('--ry', '-14deg'); sign.style.setProperty('--rx', '8deg'); });
  loops.push(() => { if (matchMedia('(hover: hover)').matches) return; const p = view(bn); sign.style.setProperty('--ry', (-24 + p * 40) + 'deg'); });
}

/* ---------- About: two corners meet ---------- */
const ah = $('.ah');
if (ah){
  loops.push(() => {
    const p = reduce ? 1 : prog(ah), m = innerWidth <= 860;
    const k = clamp(p / .7, 0, 1), e = 1 - Math.pow(1 - k, 3);
    const l = $('.ah-l', ah), r = $('.ah-r', ah);
    const lx = e * (innerWidth / 2 - l.offsetWidth / 2 - (m ? 16 : innerWidth * .05)), rx = -e * (innerWidth / 2 - r.offsetWidth / 2 - (m ? 16 : innerWidth * .05));
    ah.style.setProperty('--lx', lx + 'px'); ah.style.setProperty('--rx', rx + 'px');
    const w = clamp((p - .55) / .3, 0, 1); l.style.opacity = r.style.opacity = 1 - w;
    ah.style.setProperty('--wo', w); ah.style.setProperty('--ws', .7 + w * .3);
  });
}

/* ---------- About: mission, then vision ---------- */
const am = $('.am');
if (am){
  const words = $$('.am-word span', am), items = $$('.am-item', am);
  loops.push(() => { const k = (reduce ? 0 : prog(am)) > .5 ? 1 : 0; words.forEach((w, i) => w.classList.toggle('on', i === k)); items.forEach((w, i) => w.classList.toggle('on', i === k)); });
}

/* ---------- About: people bring people ---------- */
const ag = $('.ag');
if (ag){
  const lis = $$('.ag-chain li', ag);
  loops.push(() => { const r = $('.ag-chain', ag).getBoundingClientRect(); const p = reduce ? 1 : clamp((innerHeight * .9 - r.top) / (innerHeight * .6), 0, 1);
    const n = Math.ceil(p * lis.length); lis.forEach((li, i) => li.classList.toggle('on', i < n)); });
}

/* ---------- Future: one person becomes many ---------- */
const fe = $('.fe');
if (fe){
  const box = $('.fe-dots', fe), cnt = $('.fe-count', fe); const cols = innerWidth <= 860 ? 30 : 40, total = cols * 25; let html = '';
  for (let i = 0; i < total; i++) html += '<i></i>'; box.innerHTML = html; const dots = [...box.children];
  const order = dots.map((_, i) => i).sort((a, b) => { const ax = a % cols - cols / 2, ay = Math.floor(a / cols) - 12, bx = b % cols - cols / 2, by = Math.floor(b / cols) - 12; return (ax * ax + ay * ay) - (bx * bx + by * by); });
  let last = -1;
  loops.push(() => { const p = reduce ? 1 : prog(fe); const n = Math.max(1, Math.round(Math.pow(p, 2.2) * total)); if (n === last) return;
    const lo = Math.min(n, last < 0 ? 0 : last), hi = Math.max(n, last); for (let j = Math.max(lo, 0); j < hi; j++) dots[order[j]].classList.toggle('on', j < n);
    if (last < 0) for (let j = 0; j < n; j++) dots[order[j]].classList.add('on');
    last = n; cnt.innerHTML = `<b>${n.toLocaleString('en-IN')}</b> ${n === 1 ? 'person' : 'people'}`; });
}

/* ---------- Future: learn, practise, get placed ---------- */
const fd = $('.fd-path');
if (fd){
  const lis = $$('li', fd);
  loops.push(() => { const r = fd.getBoundingClientRect(); const p = reduce ? 1 : clamp((innerHeight * .75 - r.top) / (r.height + innerHeight * .1), 0, 1);
    fd.style.setProperty('--p', p.toFixed(3)); lis.forEach((li, i) => li.classList.toggle('on', p >= i / (lis.length - 1) - .02)); });
}

/* ---------- Future: from India to jobs abroad ---------- */
const fg = $('.fg');
if (fg){
  const path = $('#fg-p'), dot = $('.fg-dot'), L = path.getTotalLength();
  loops.push(() => { const p = reduce ? 1 : clamp(view(fg) * 1.6 - .3, 0, 1); const pt = path.getPointAtLength(p * L); dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y); });
}

/* ---------- Future: pick how to work with us ---------- */
const fb = $('.fb');
if (fb){
  const opts = $$('.fb-opts button', fb), go = $('#fb-go');
  const msg = { partner: 'Hi Laboura, I want to partner with you.', invest: 'Hi Laboura, I want to talk about investing in Laboura.', city: 'Hi Laboura, I want to bring Laboura to my city.' };
  const pick = b => { opts.forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-checked', on); }); go.href = `${WA}?text=${encodeURIComponent(msg[b.dataset.k])}`; };
  opts.forEach(b => b.addEventListener('click', () => pick(b))); pick(opts[0]);
}


/* ---------- The last call: the pass / card falls in, tilts toward you, and the stub tears ---------- */
$$('.fz-stage').forEach(st => {
  const obj = $('.fz-obj', st), sec = st.closest('.fz');
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting){ st.classList.add('in'); io.disconnect(); } }), { threshold: .35 }); io.observe(st);
  if (!reduce){
    sec.addEventListener('pointermove', e => { const r = obj.getBoundingClientRect(); const dx = (e.clientX - (r.left + r.width / 2)) / r.width, dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      obj.style.setProperty('--ry', clamp(dx * 26, -26, 26) + 'deg'); obj.style.setProperty('--rx', clamp(-dy * 20, -20, 20) + 'deg'); obj.style.setProperty('--sx', (50 + dx * 90) + '%'); });
    sec.addEventListener('pointerleave', () => { obj.style.setProperty('--ry', '-12deg'); obj.style.setProperty('--rx', '6deg'); obj.style.setProperty('--sx', '50%'); });
    if (!matchMedia('(hover: hover)').matches) loops.push(() => { const p = view(sec); obj.style.setProperty('--ry', (-22 + p * 36) + 'deg'); obj.style.setProperty('--sx', (p * 100) + '%'); });
  }
  const stub = $('.fz-stub', st);
  if (stub) stub.addEventListener('click', () => { if (stub.classList.contains('torn')) return; stub.classList.add('torn');
    setTimeout(() => { location.href = 'apply.html'; }, 650); setTimeout(() => stub.classList.remove('torn'), 2600); });
});


/* ---------- About: the dictionary entry, the flip cards, the visiting card ---------- */
const ad = $('.ad');
if (ad){ const lis = $$('.ad-means li, .ad-use', ad);
  loops.push(() => { const r = ad.getBoundingClientRect(); const p = reduce ? 1 : clamp((innerHeight * .85 - r.top) / (innerHeight * .55), 0, 1);
    const n = Math.ceil(p * lis.length); lis.forEach((li, i) => li.classList.toggle('on', i < n)); }); }
const axRows = $$('.ax-row');
if (axRows.length) loops.push(() => axRows.forEach(r => { const b = r.getBoundingClientRect(); const p = reduce ? 1 : clamp((innerHeight * .78 - b.top) / (innerHeight * .32), 0, 1);
  r.style.setProperty('--s', clamp(p * 1.6, 0, 1).toFixed(3)); r.classList.toggle('done', p > .62); }));
const avc = $('.av-card');
if (avc) avc.addEventListener('click', () => { const f = avc.classList.toggle('flip'); avc.style.setProperty('--fl', f ? '180deg' : '0deg'); });


/* ---------- Future: the early list builds its own card ---------- */
const fl = $('.fl');
if (fl){
  const st = { what: 'Laboura Education', who: 'A job seeker' }, go = $('#fl-go'), city = $('#fl-city');
  const upd = () => { const c = city.value.trim().replace(/[<>&"]/g, '');
    $('.fl-what', fl).textContent = st.what; $('.fl-who', fl).textContent = st.who; $('.fl-cty', fl).textContent = c || 'Your city';
    go.href = `${WA}?text=${encodeURIComponent(`Hi Laboura, add me to the early list for ${st.what}. I am ${st.who.toLowerCase()}${c ? ' in ' + c : ''}.`)}`;
    const obj = $('.fl-card', fl); obj.classList.remove('bump'); void obj.offsetWidth; obj.classList.add('bump'); };
  $$('.fl-opts', fl).forEach(g => { const bs = $$('button', g); bs.forEach(b => b.addEventListener('click', () => {
    bs.forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-checked', on); });
    if (b.dataset.what) st.what = b.textContent; else st.who = b.textContent; upd(); })); });
  city.addEventListener('input', upd);
  try { $('.fl-date', fl).textContent = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); } catch(e){}
  upd();
}


/* ======================= Remaining pages ======================= */
/* lists that appear line by line */
$$('.rv-list').forEach(list => { if (list.closest('.ad')) return; const lis = $$('li', list);
  loops.push(() => { const r = list.getBoundingClientRect(); const p = reduce ? 1 : clamp((innerHeight * .88 - r.top) / (innerHeight * .5), 0, 1);
    const n = Math.ceil(p * lis.length); lis.forEach((li, i) => li.classList.toggle('on', i < n)); }); });

/* legal pages: the contents list follows your reading */
const toc = $$('.lg-toc a');
if (toc.length){ const secs = toc.map(a => document.getElementById(a.getAttribute('href').slice(1)));
  loops.push(() => { let k = 0; secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top < innerHeight * .35) k = i; }); toc.forEach((a, i) => a.classList.toggle('on', i === k)); }); }

/* refund policy: date checkers */
const fmtD = d => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
[['#rc-job', 30, d => `Your 30 days end on <b>${fmtD(d)}</b>. No job offer by then? Call us for your full fee back.`], ['#rc-biz', 60, d => `Free replacement until <b>${fmtD(d)}</b>. If your hire leaves before then, call us.`]].forEach(([sel, n, msg]) => {
  const inp = $(sel); if (!inp) return; const out = inp.closest('.rc-box').querySelector('.rc-out');
  inp.addEventListener('change', () => { if (!inp.value) return; const d = new Date(inp.value + 'T00:00:00'); d.setDate(d.getDate() + n);
    const left = Math.ceil((d - new Date()) / 864e5); out.innerHTML = msg(d) + (left > 0 ? ` <span>${left} days to go.</span>` : ' <span>That date has passed.</span>'); }); });

/* contact: who are you */
const cw = $('.cw');
if (cw){ const tabs = $$('[role="tab"]', cw), panels = $$('.cw-p', cw);
  const pick = t => { tabs.forEach((x, i) => { const on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; panels[i].classList.toggle('on', on); panels[i].hidden = !on; }); };
  panels.forEach((p, i) => p.hidden = i !== 0); tabs.forEach(t => t.addEventListener('click', () => pick(t))); }

/* state pages: India with this state lit */
$$('.sp-map').forEach(cv => {
  const I = window.LB_INDIA && (innerWidth <= 860 ? LB_INDIA.small : LB_INDIA.big); if (!I) return;
  const ctx = cv.getContext('2d'), me = +cv.dataset.state; let W, H, sc, dot, seen = false;
  const size = () => { const r = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2); W = r.width; H = r.height; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    sc = Math.min(W, H / I.aspect) * .98; dot = Math.max(1.4, I.step * sc * .78); };
  size(); addEventListener('resize', size); new IntersectionObserver(e => { seen = e[0].isIntersecting; }).observe(cv);
  const n = I.p.length / 3, t0 = performance.now();
  (function draw(now){ requestAnimationFrame(draw); if (!seen) return; ctx.clearRect(0, 0, W, H);
    const g = [[], [], []], k = reduce ? 1 : clamp((now - t0) / 1400, 0, 1), pulse = reduce ? 0 : Math.sin(now / 420) * .06;
    for (let i = 0; i < n; i++){ const s = I.p[i * 3 + 2]; g[s === me ? 2 : s ? 1 : 0].push(W / 2 + I.p[i * 3] * sc, H / 2 - I.p[i * 3 + 1] * sc); }
    const paint = (a, c, r) => { ctx.fillStyle = c; ctx.beginPath(); for (let q = 0; q < a.length; q += 2){ ctx.moveTo(a[q] + r, a[q + 1]); ctx.arc(a[q], a[q + 1], r, 0, 6.2832); } ctx.fill(); };
    paint(g[0], 'rgba(0,0,0,.12)', dot * .42); paint(g[1], 'rgba(0,0,0,.32)', dot * .48); paint(g[2], '#E06A00', dot * (.5 + pulse) * (.4 + .6 * k)); })(t0);
});

/* state pages: job or staff, and the city */
const spk = $('.spk');
if (spk){ const st = { m: 'job', c: $('.spk-cities .on', spk).dataset.c }, say = $('.spk-say', spk), go = $('.spk-go', spk);
  const upd = () => { say.innerHTML = st.m === 'job' ? `I need a job in <b>${st.c}</b>.` : `I need staff in <b>${st.c}</b>.`;
    go.href = `${WA}?text=${encodeURIComponent(st.m === 'job' ? `Hi Laboura, I need a job in ${st.c}.` : `Hi Laboura, I need staff for my business in ${st.c}.`)}`; };
  const grp = (sel, key, attr) => { const bs = $$(sel + ' button', spk); bs.forEach(b => b.addEventListener('click', () => { bs.forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); }); st[key] = b.dataset[attr]; upd(); })); };
  grp('.spk-modes', 'm', 'm'); grp('.spk-cities', 'c', 'c'); upd(); }

/* sector pages: pick roles, tick what you know */
const scx = $('.scx');
if (scx){ const roles = $$('.sc-roles button', scx), who = $('.sc-who', scx), go = $('.sc-go', scx), sector = scx.dataset.sector, ticks = $$('.st2-list button'), cnt = $('.st2-count');
  const upd = () => { const picked = roles.filter(b => b.classList.contains('on')).map(b => b.textContent); if (!picked.length){ roles[0].classList.add('on'); roles[0].setAttribute('aria-pressed', 'true'); return upd(); }
    who.textContent = picked.length > 2 ? `${picked.length} roles` : picked.join(' + ');
    const known = ticks.filter(b => b.getAttribute('aria-pressed') === 'true').map(b => b.querySelector('span').textContent.toLowerCase());
    if (cnt) cnt.textContent = `${known.length} of ${ticks.length} ready`;
    go.href = `${WA}?text=${encodeURIComponent(`Hi Laboura, I need ${picked.join(', ').toLowerCase()} for my business (${sector.toLowerCase()}).` + (known.length ? ` I can tell you: ${known.join('; ')}.` : ''))}`;
    const obj = $('.fz-obj', scx); obj.classList.remove('bump'); void obj.offsetWidth; obj.classList.add('bump'); };
  roles.forEach(b => b.addEventListener('click', () => { const on = !b.classList.contains('on'); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); upd(); }));
  ticks.forEach(b => b.addEventListener('click', () => { b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); upd(); })); upd(); }

/* salary guide: ask the salary */
const sga = $('#sga-go');
if (sga){ const r = $('#sga-r'), c = $('#sga-c'); const upd = () => { sga.href = `${WA}?text=${encodeURIComponent(`Hi Laboura, what is the salary for a ${r.value.toLowerCase()} job in ${c.value}?`)}`; };
  r.addEventListener('change', upd); c.addEventListener('change', upd); upd(); }

/* fake agent check */
const fc2 = $('.fc2');
if (fc2){ const bs = $$('.fc2-list button', fc2), say = $('.fc2-say', fc2), bar = $('.fc2-bar i', fc2);
  const upd = () => { const n = bs.filter(b => b.getAttribute('aria-pressed') === 'true').length; bar.style.width = Math.min(100, n / 3 * 100) + '%'; fc2.dataset.level = n === 0 ? 0 : n < 3 ? 1 : 2;
    say.innerHTML = n === 0 ? '<b>Looks safe so far.</b> Still check the company name and meet them in person.' : n < 3 ? `<b>Be careful.</b> ${n} warning sign${n > 1 ? 's' : ''}. Do not pay until you check the company.` : `<b>Very likely fake.</b> ${n} warning signs. Do not pay. Call 1930 if you already paid.`; };
  bs.forEach(b => b.addEventListener('click', () => { b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); upd(); })); upd(); }

/* referral partners */
const rw = $('.rw');
if (rw){ const bs = $$('.rw-chips button', rw), say = $('.rw-say', rw);
  bs.forEach(b => b.addEventListener('click', () => { bs.forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); }); say.innerHTML = `Yes. <b>${b.textContent}</b> can be a Laboura referral partner.`; })); }
const rj = $('#rj-go');
if (rj){ const n = $('#rj-n'), c = $('#rj-c'); const upd = () => { rj.href = `${WA}?text=${encodeURIComponent(`Hi Laboura, I want to become a referral partner.${n.value ? ' My name is ' + n.value.trim() + '.' : ''}${c.value ? ' I live in ' + c.value.trim() + '.' : ''}`)}`; };
  n.addEventListener('input', upd); c.addEventListener('input', upd); upd(); }


/* ======================= Signature moments for the newer pages ======================= */
/* state pages: India zooms in to the state as you scroll */
$$('.spz').forEach(sec => {
  const cv = $('.spz-map', sec), I = window.LB_INDIA && LB_INDIA.big; if (!cv || !I) return;
  const ctx = cv.getContext('2d'), me = +cv.dataset.state, cen = LB_INDIA.cent[me]; let W, H, base, dot, mob;
  const size = () => { const r = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2); W = r.width; H = r.height; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    mob = innerWidth <= 860; base = Math.min(mob ? W * .9 : W * .5, (mob ? H * .46 : H * .86) / I.aspect); dot = I.step * base * .8; };
  size(); addEventListener('resize', size);
  const n = I.p.length / 3, cities = $$('.spz-cities li', sec);
  loops.push(() => { const r = sec.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
    const p = reduce ? 1 : prog(sec), e = 1 - Math.pow(1 - clamp(p / .75, 0, 1), 3);
    const targetR = Math.min(W, H) * (mob ? .2 : .3), zoom = 1 + e * Math.max(targetR / (cen[2] * base) - 1, 0);
    const ax = mob ? W / 2 : W * .66, ay = mob ? H * .28 : H / 2;
    const cx = ax - cen[0] * base * zoom * e, cy = ay + cen[1] * base * zoom * e;
    ctx.clearRect(0, 0, W, H); const g = [[], []];
    for (let i = 0; i < n; i++){ const s = I.p[i * 3 + 2]; g[s === me ? 1 : 0].push(cx + I.p[i * 3] * base * zoom, cy - I.p[i * 3 + 1] * base * zoom); }
    const paint = (a, c, rad) => { ctx.fillStyle = c; ctx.beginPath(); for (let q = 0; q < a.length; q += 2){ const x = a[q], y = a[q + 1]; if (x < -10 || x > W + 10 || y < -10 || y > H + 10) continue; ctx.moveTo(x + rad, y); ctx.arc(x, y, rad, 0, 6.2832); } ctx.fill(); };
    paint(g[0], `rgba(0,0,0,${.16 - e * .1})`, dot * .42 * zoom); paint(g[1], '#E06A00', dot * .48 * zoom);
    sec.style.setProperty('--e', e.toFixed(3)); cities.forEach((c, i) => c.classList.toggle('on', e > .55 + i * .08)); });
});

/* sector pages: from call to covered */
$$('.stl').forEach(sec => { const lis = $$('.stl-track li', sec), track = $('.stl-track', sec), line = $('.stl-line i', sec);
  loops.push(() => { const p = reduce ? 1 : prog(sec), k = Math.min(lis.length - 1, Math.floor(p * lis.length * .999));
    lis.forEach((li, i) => { li.classList.toggle('on', i === k); li.classList.toggle('done', i < k); }); line.style.transform = `scaleX(${p})`;
    if (innerWidth > 860){ const w = lis[0].getBoundingClientRect().width + 16, vis = Math.max(1, Math.floor(track.parentElement.clientWidth / w)); track.style.transform = `translate3d(${-clamp(k - 1, 0, Math.max(lis.length - vis, 0)) * w}px,0,0)`; } else track.style.transform = ''; }); });

/* legal pages: reading progress on the contents list */
const lgb = $('.lg-body'), lgt = $('.lg-toc ol');
if (lgb && lgt) loops.push(() => { const r = lgb.getBoundingClientRect(); lgt.style.setProperty('--rp', clamp((innerHeight * .4 - r.top) / r.height, 0, 1).toFixed(3)); });

/* salary: facts count up, the pay tower grows */
$$('[data-count]').forEach(el => { const raw = el.dataset.count, num = parseInt(raw.replace(/[^\d]/g, ''), 10), pre = raw.match(/^[^\d]*/)[0], suf = raw.match(/[^\d]*$/)[0];
  const io = new IntersectionObserver(es => { if (!es[0].isIntersecting) return; io.disconnect(); if (reduce) return; const t0 = performance.now();
    const step = now => { const k = Math.min((now - t0) / 1400, 1), v = Math.round(num * (1 - Math.pow(1 - k, 4))); el.textContent = pre + v.toLocaleString('en-IN') + suf; if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }, { threshold: .6 });
  io.observe(el); });
const sgt = $('.sgt');
if (sgt){ const bs = $$('.sgt-list button', sgt), say = $('.sgt-say', sgt);
  const upd = () => { let n = 0; bs.forEach(b => { const on = b.getAttribute('aria-pressed') === 'true'; if (on) n++; $(`.sgt-tower i[data-i="${b.dataset.i}"]`, sgt).classList.toggle('on', on); });
    say.textContent = n ? `Your pay, with ${n} thing${n > 1 ? 's' : ''} that add to it` : 'Your pay'; sgt.style.setProperty('--n', n); };
  bs.forEach(b => b.addEventListener('click', () => { b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); upd(); })); upd(); }

/* referral: one person, then many */
const rfn = $('.rf-net');
if (rfn){ const ctx = rfn.getContext('2d'); let W, H, nodes = [], seen = false;
  const build = () => { const r = rfn.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2); W = r.width; H = r.height; rfn.width = W * d; rfn.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    let s = 3; const R = () => (s = (s * 16807) % 2147483647) / 2147483647; nodes = [{ x: W * (innerWidth > 860 ? .74 : .5), y: H * (innerWidth > 860 ? .5 : .78), p: -1, g: 0, t: 0 }];
    for (let g = 1; g <= 3; g++){ const prev = nodes.filter(n => n.g === g - 1); prev.forEach(pn => { const k = g === 1 ? 6 : 3; for (let i = 0; i < k; i++){ const a = (g === 1 ? i / k * Math.PI * 2 : Math.atan2(pn.y - nodes[0].y, pn.x - nodes[0].x) + (R() - .5) * 1.4), d = (innerWidth > 860 ? 70 : 46) * (1 + R() * .5);
      nodes.push({ x: pn.x + Math.cos(a) * d, y: pn.y + Math.sin(a) * d, p: nodes.indexOf(pn), g, t: g * .9 + R() * .6 }); } }); } };
  build(); addEventListener('resize', build); new IntersectionObserver(e => { seen = e[0].isIntersecting; }).observe(rfn); const t0 = performance.now();
  (function draw(now){ requestAnimationFrame(draw); if (!seen) return; ctx.clearRect(0, 0, W, H); const t = reduce ? 9 : ((now - t0) / 1000) % 9;
    nodes.forEach((n, i) => { if (n.p < 0) return; const k = clamp((t - n.t) / .6, 0, 1); if (!k) return; const pn = nodes[n.p];
      ctx.strokeStyle = 'rgba(0,0,0,.14)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(pn.x, pn.y); ctx.lineTo(pn.x + (n.x - pn.x) * k, pn.y + (n.y - pn.y) * k); ctx.stroke(); });
    nodes.forEach((n, i) => { const k = n.p < 0 ? 1 : clamp((t - n.t - .4) / .4, 0, 1); if (!k) return; ctx.fillStyle = n.g === 0 ? '#000' : n.g % 2 ? '#E06A00' : '#0A4FD8';
      ctx.beginPath(); ctx.arc(n.x, n.y, (n.g === 0 ? 14 : 7 - n.g) * k, 0, 6.2832); ctx.fill(); }); })(t0); }
const rjn = $('#rj-n');
if (rjn){ const c = $('#rj-c'), nm = $('.rj-name'), ct = $('.rj-city'); const upd = () => { nm.textContent = rjn.value.trim() || 'Your name'; ct.textContent = c.value.trim() || 'Your city'; };
  rjn.addEventListener('input', upd); c.addEventListener('input', upd); }

/* ---------- Footer: LABOURA in dots that part around your hand ---------- */
const fxd = $('.fx-dots canvas');
if (fxd){
  const ctx = fxd.getContext('2d'), sym = document.querySelector('#wm path');
  let W = 0, H = 0, P = [], seen = false, mx = -1e4, my = -1e4, t0 = 0;
  const build = () => {
    const r = fxd.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2); W = r.width; H = r.height; fxd.width = W * d; fxd.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    const c = document.createElement('canvas'), cw = 970, ch = 170; c.width = cw; c.height = ch; const x = c.getContext('2d'); x.translate(0, 11); x.fillStyle = '#000'; x.fill(new Path2D(sym.getAttribute('d')));
    const data = x.getImageData(0, 0, cw, ch).data, step = innerWidth <= 860 ? 7 : 5.2, s = W / cw; P = []; let k = 0;
    for (let y = step / 2; y < ch; y += step) for (let xx = step / 2; xx < cw; xx += step){ if (data[(Math.floor(y) * cw + Math.floor(xx)) * 4 + 3] > 128){
      const hx = xx * s, hy = y * s; P.push({ hx, hy, x: hx + (Math.random() - .5) * W * .6, y: hy + (Math.random() - .5) * H * 3, vx: 0, vy: 0, c: (k++ % 14 === 0) ? 1 : (k % 23 === 0 ? 2 : 0) }); } }
    P.r = Math.max(1.1, step * s * .42);
  };
  build(); let lw = innerWidth; addEventListener('resize', () => { if (Math.abs(innerWidth - lw) > 30){ lw = innerWidth; build(); } });
  new IntersectionObserver(es => { seen = es[0].isIntersecting; if (seen && !t0) t0 = performance.now(); }, { rootMargin: '80px' }).observe(fxd);
  const move = e => { const r = fxd.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; };
  fxd.addEventListener('pointermove', move); fxd.addEventListener('pointerdown', move); fxd.addEventListener('pointerleave', () => { mx = my = -1e4; });
  const COLS = ['#000', '#E06A00', '#0A4FD8'], R = () => Math.max(60, W * .07);
  (function frame(){
    requestAnimationFrame(frame); if (!seen) return;
    ctx.clearRect(0, 0, W, H); const rad = R(), g = [[], [], []], hot = [[], [], []];
    for (const p of P){
      if (reduce){ p.x = p.hx; p.y = p.hy; } else {
        const dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
        if (d2 < rad * rad){ const d = Math.sqrt(d2) || 1, f = (1 - d / rad) * 6; p.vx += dx / d * f; p.vy += dy / d * f; }
        p.vx += (p.hx - p.x) * .045; p.vy += (p.hy - p.y) * .045; p.vx *= .82; p.vy *= .82; p.x += p.vx; p.y += p.vy; }
      const away = Math.abs(p.x - p.hx) + Math.abs(p.y - p.hy) > 3;
      (away ? hot : g)[away && p.c === 0 ? (P.indexOf ? (p.hx | 0) % 2 + 1 : 1) : p.c].push(p.x, p.y);
    }
    const paint = (a, col) => { if (!a.length) return; ctx.fillStyle = col; ctx.beginPath(); for (let k = 0; k < a.length; k += 2){ ctx.moveTo(a[k] + P.r, a[k + 1]); ctx.arc(a[k], a[k + 1], P.r, 0, 6.2832); } ctx.fill(); };
    for (let c = 0; c < 3; c++){ paint(g[c], COLS[c]); paint(hot[c], COLS[c]); }
  })();
}

function frame(){ loops.forEach(f => f()); requestAnimationFrame(frame); }
requestAnimationFrame(frame);
})();

/* ---------- Replacement policy: is my case covered? ---------- */
(() => {
  const box = document.querySelector('.rk'); if (!box) return;
  const out = box.querySelector('.rk-out'), bs = [...box.querySelectorAll('.rk-b')];
  bs.forEach(b => b.addEventListener('click', () => {
    bs.forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
    const ok = b.dataset.ok === '1';
    box.classList.toggle('yes', ok); box.classList.toggle('no', !ok);
    out.innerHTML = ok ? '<b>Covered.</b> <span>Tell us within 7 days and we send a free replacement in 7 to 15 days.</span>'
                       : '<b>Not covered.</b> <span>The free replacement is for people who leave for their own reasons, when the job was as agreed. You can still hire again at the normal fee.</span>';
    out.classList.remove('pop'); void out.offsetWidth; out.classList.add('pop');
  }));
})();

/* ---------- Worker consent: the 3-day rule ---------- */
(() => {
  const box = document.querySelector('.hx'); if (!box) return;
  const ds = [...box.querySelectorAll('.hx-d')], out = box.querySelector('.hx-out');
  const upd = () => {
    const first = ds.findIndex(d => d.getAttribute('aria-pressed') === 'true');
    ds.forEach((d, i) => { const st = first < 0 || i < first ? 'miss' : i === first ? 'reply' : 'idle';
      d.dataset.st = st; d.querySelector('em').textContent = st === 'miss' ? 'No reply' : st === 'reply' ? 'You replied' : 'Not needed'; });
    out.innerHTML = first < 0 ? '<b>3 misses.</b> Your profile stops and the fee is used up. Call us back to make it active again.'
                              : `<b>${first} miss${first === 1 ? '' : 'es'}, then you replied.</b> Your profile stays active.`;
    box.classList.toggle('lost', first < 0);
  };
  ds.forEach((d, i) => d.addEventListener('click', () => {
    const on = d.getAttribute('aria-pressed') === 'true';
    ds.forEach(x => x.setAttribute('aria-pressed', 'false'));
    if (!on) d.setAttribute('aria-pressed', 'true');
    upd();
  }));
  upd();
})();

/* ---------- Report fraud: send the report on WhatsApp ---------- */
(() => {
  const f = document.getElementById('frf-form'); if (!f) return;
  const err = f.querySelector('.frf-err'), E = f.elements;
  E.phone.addEventListener('input', () => { E.phone.value = E.phone.value.replace(/\D/g, '').slice(0, 10); });
  f.addEventListener('submit', e => {
    e.preventDefault(); err.hidden = true;
    if (!E.what.value.trim()){ err.textContent = 'Please tell us what happened.'; err.hidden = false; E.what.focus(); return; }
    if (!/^[6-9]\d{9}$/.test(E.phone.value)){ err.textContent = 'Please write your 10-digit mobile number, so we can call you back.'; err.hidden = false; E.phone.focus(); return; }
    const t = ['Fraud report from the Laboura website', '', 'What: ' + f.querySelector('[name=kind]:checked').value,
      'Their number, UPI or website: ' + (E.them.value.trim() || 'Not known'), 'Money paid: ' + (E.paid.value.trim() || 'Not said'),
      '', E.what.value.trim(), '', 'My phone: +91 ' + E.phone.value].join('\n');
    const waUrl = 'https://wa.me/917483919241?text=' + encodeURIComponent(t);
    const done = saved => { f.innerHTML = '<div class="frf-done"><span class="eq-tick" aria-hidden="true"></span><h3>Thank you for telling us.</h3><p>'
      + (saved ? 'We have your report. Our team will call you within 24 hours.</p><a class="btn btn-line" target="_blank" rel="noopener" href="' + waUrl + '">Also send it on WhatsApp</a>'
               : 'Your report is ready in WhatsApp. Press send there. We reply within 24 hours.</p>') + '</div>'; };
    const viaWA = () => { window.open(waUrl, '_blank', 'noopener'); done(false); };
    if (!(window.LB_LEADS && LB_LEADS.on)) return viaWA();
    const btn = f.querySelector('[type=submit]'); btn.disabled = true;
    LB_LEADS.send('fraud', { what: f.querySelector('[name=kind]:checked').value, them: E.them.value.trim(), paid: E.paid.value.trim(),
      details: E.what.value.trim(), phone: '+91 ' + E.phone.value, website: (E.website || {}).value || '' })
      .then(() => done(true), () => { btn.disabled = false; viaWA(); });
  });
})();
