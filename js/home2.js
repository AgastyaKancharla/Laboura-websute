/* Lower homepage: sectors spotlight, stories street, stacking ventures, FAQ search, call button */
(function(){
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

/* 1. Sectors: the row nearest the reading line lights up; tap also picks it */
const sxItems = [...document.querySelectorAll('.sx-list li')];
let sxPinned = -1, sxPinY = 0;
sxItems.forEach((li, i) => li.addEventListener('click', () => { sxPinned = i; sxPinY = scrollY; }));
function sectors(){
  if (!sxItems.length) return;
  const line = innerHeight * (innerWidth > 860 ? .5 : .55);
  let best = -1, bd = 1e9;
  sxItems.forEach((li, i) => { const r = li.getBoundingClientRect(); const d = Math.abs(r.top + Math.min(r.height, 120) / 2 - line); if (d < bd){ bd = d; best = i; } });
  if (sxPinned >= 0 && Math.abs(scrollY - sxPinY) < 80) best = sxPinned; else sxPinned = -1;
  const first = sxItems[0].getBoundingClientRect().top, last = sxItems[sxItems.length - 1].getBoundingClientRect().bottom;
  if (first > innerHeight * .9 || last < innerHeight * .1) best = -1;
  sxItems.forEach((li, i) => { li.classList.toggle('on', i === best); li.classList.toggle('near', best >= 0 && Math.abs(i - best) === 1); });
}

/* 2. Stories: vertical scroll moves the street sideways */
const st = document.querySelector('.st'), stTrack = st && st.querySelector('.st-track'), stRoad = st && st.querySelector('.st-road');
function stories(){
  if (!st || reduce) return;
  const r = st.getBoundingClientRect(); const run = st.offsetHeight - innerHeight;
  const p = clamp(-r.top / run, 0, 1);
  const max = Math.max(stTrack.scrollWidth - innerWidth + parseFloat(getComputedStyle(stTrack).paddingLeft), 0);
  stTrack.style.transform = `translate3d(${-p * max}px,0,0)`;
  stRoad.style.setProperty('--p', p.toFixed(4));
}

/* 3. Ventures: a card shrinks a little as the next one slides over it */
const vxCards = [...document.querySelectorAll('.vx-card')];
function ventures(){
  if (reduce) return;
  vxCards.forEach((c, i) => {
    const next = vxCards[i + 1]; if (!next){ c.style.transform = ''; return; }
    const nr = next.getBoundingClientRect(), cr = c.getBoundingClientRect();
    const k = clamp(1 - (nr.top - cr.top) / Math.max(cr.height, 1), 0, 1);
    c.style.transform = `scale(${1 - k * .06})`; c.style.filter = `brightness(${1 - k * .25})`;
  });
}

/* 4. FAQ: type to filter, chips to pick a side */
const fqFind = document.getElementById('fq-find'), fqItems = [...document.querySelectorAll('.fq-list details')], fqNone = document.querySelector('.fq-none');
const fqChips = [...document.querySelectorAll('.fq-chips button')];
let fqSide = 'all', fqAll = false; const fqMore = document.querySelector('.fq-more'), FQ_FIRST = 10;
function fqApply(){
  const q = (fqFind.value || '').trim().toLowerCase(); let shown = 0, opened = false;
  const limit = !q && fqSide === 'all' && !fqAll;
  fqItems.forEach((d, i) => {
    const side = d.dataset.f; const okSide = fqSide === 'all' || side === 'all' || side === fqSide;
    const okText = !q || q.split(/\s+/).every(w => d.textContent.toLowerCase().includes(w));
    const ok = okSide && okText && !(limit && i >= FQ_FIRST); d.classList.toggle('hide', !ok); if (ok) shown++;
    if (q && ok && !opened){ d.open = true; opened = true; }
  });
  fqNone.hidden = shown > 0;
  if (fqMore){ fqMore.hidden = !limit || fqItems.length <= FQ_FIRST; fqMore.textContent = `Show all ${fqItems.length} questions`; }
}
if (fqFind){
  fqFind.addEventListener('input', fqApply);
  fqChips.forEach(b => b.addEventListener('click', () => {
    fqSide = b.dataset.f; fqChips.forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); }); fqApply();
  }));
  if (fqMore) fqMore.addEventListener('click', () => { fqAll = true; fqMore.setAttribute('aria-expanded', 'true'); fqApply(); const n = fqItems[FQ_FIRST]; n && n.querySelector('summary').focus({ preventScroll: true }); });
  fqApply();
}

/* 5. Final call: the button leans toward the pointer */
const fc = document.querySelector('.fc'), fcBtn = fc && fc.querySelector('.fc-btn');
if (fc && !reduce && matchMedia('(hover: hover)').matches){
  let tx = 0, ty = 0, x = 0, y = 0;
  fc.addEventListener('pointermove', e => { const r = fcBtn.getBoundingClientRect(); const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy), pull = clamp(1 - d / 420, 0, 1); tx = dx * .22 * pull; ty = dy * .3 * pull; });
  fc.addEventListener('pointerleave', () => { tx = ty = 0; });
  (function loop(){ x += (tx - x) * .12; y += (ty - y) * .12; fcBtn.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`; requestAnimationFrame(loop); })();
}
function rings(){
  if (!fc) return; const r = fc.getBoundingClientRect(), b = fcBtn.getBoundingClientRect();
  fc.style.setProperty('--ry', ((b.top + b.height / 2 - r.top) / r.height * 100).toFixed(2) + '%');
}

function frame(){ sectors(); stories(); ventures(); rings(); requestAnimationFrame(frame); }
requestAnimationFrame(frame);
})();

/* Sectors 2: one sector per swipe page. Chips and dots follow the page; chips jump to a page. */
(function(){
  const sx = document.querySelector('.sx'); if (!sx) return;
  const wrap = sx.querySelector('.sx-pages'); if (!wrap) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pages = [...wrap.querySelectorAll('.sxp')];
  const tabs = [...sx.querySelectorAll('.sx-tabs button')], tabRow = sx.querySelector('.sx-tabs');
  const dots = [...sx.querySelectorAll('.sx-dots i')], now = sx.querySelector('.sx-now'), btns = [...sx.querySelectorAll('.sx-btn')];
  const fmt = n => { const s = String(n); if (s.length <= 3) return s; let h = s.slice(0, -3), t = s.slice(-3), p = []; while (h.length > 2){ p.unshift(h.slice(-2)); h = h.slice(0, -2); } if (h) p.unshift(h); return p.join(',') + ',' + t; };
  sx.querySelectorAll('.sxc').forEach(c => { const im = c.querySelector('img'); const bad = () => c.classList.add('noimg'); if (im.complete && im.naturalWidth === 0) bad(); im.addEventListener('error', bad); });
  const count = b => { const n = +b.dataset.n; if (reduce){ b.textContent = fmt(n); return; } const t0 = performance.now(); const tick = t => { const p = Math.min((t - t0) / 900, 1); b.textContent = fmt(Math.round(n * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(tick); }; requestAnimationFrame(tick); };
  const reveal = pg => { if (pg.classList.contains('seen')) return; pg.classList.add('seen'); pg.querySelectorAll('[data-n]').forEach(count); };
  let cur = -1;
  function set(i){
    if (i === cur) return; cur = i;
    pages.forEach((p, j) => p.classList.toggle('on', j === i));
    tabs.forEach((t, j) => t.classList.toggle('on', j === i));
    dots.forEach((d, j) => d.classList.toggle('on', j === i));
    btns[0].disabled = i === 0; btns[1].disabled = i === pages.length - 1;
    const t = tabs[i]; tabRow.scrollTo({ left: t.offsetLeft - (tabRow.clientWidth - t.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
    const name = t.querySelector('b').textContent, open = t.querySelector('span').textContent;
    now.innerHTML = `<b>${name}</b> <span>${open} jobs open</span>`;
    if (inView) reveal(pages[i]);
  }
  const which = () => Math.round(wrap.scrollLeft / wrap.clientWidth);
  let raf = 0; wrap.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; set(Math.min(Math.max(which(), 0), pages.length - 1)); }); }, { passive: true });
  const go = i => { i = Math.min(Math.max(i, 0), pages.length - 1); wrap.scrollTo({ left: i * wrap.clientWidth, behavior: reduce ? 'auto' : 'smooth' }); };
  tabs.forEach((t, i) => t.addEventListener('click', () => go(i)));
  btns.forEach(b => b.addEventListener('click', () => go(cur + +b.dataset.d)));
  wrap.addEventListener('keydown', e => { if (e.key === 'ArrowRight'){ e.preventDefault(); go(cur + 1); } if (e.key === 'ArrowLeft'){ e.preventDefault(); go(cur - 1); } });
  /* mouse drag on laptops */
  let down = false, x0 = 0, s0 = 0, moved = 0;
  wrap.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' || e.button) return; down = true; moved = 0; x0 = e.clientX; s0 = wrap.scrollLeft; wrap.style.scrollSnapType = 'none'; });
  addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - x0; moved = Math.max(moved, Math.abs(dx)); wrap.scrollLeft = s0 - dx; });
  addEventListener('pointerup', () => { if (!down) return; down = false; wrap.style.scrollSnapType = ''; const d = wrap.scrollLeft - cur * wrap.clientWidth; go(Math.abs(d) > wrap.clientWidth * .15 ? cur + Math.sign(d) : cur); });
  wrap.addEventListener('click', e => { if (moved > 6){ e.preventDefault(); e.stopPropagation(); moved = 0; } }, true);
  wrap.addEventListener('dragstart', e => e.preventDefault());
  let inView = false;
  new IntersectionObserver(es => es.forEach(en => { inView = en.isIntersecting; if (inView && cur >= 0) reveal(pages[cur]); }), { threshold: .3 }).observe(wrap);
  addEventListener('resize', () => { const i = cur; cur = -1; wrap.scrollLeft = i * wrap.clientWidth; set(i); });
  set(0);
})();
