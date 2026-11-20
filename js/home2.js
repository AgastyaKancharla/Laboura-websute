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

/* Hero numbers count up once the hero text has risen */
(function(){
  const dds = [...document.querySelectorAll('.hero-stats dd[data-n]')]; if (!dds.length) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const fmt = n => n.toLocaleString('en-IN');
  dds.forEach(d => d.textContent = '0');
  setTimeout(() => { const t0 = performance.now();
    const tick = t => { const p = Math.min((t - t0) / 1600, 1), e = 1 - Math.pow(1 - p, 3);
      dds.forEach(d => d.textContent = fmt(Math.round(+d.dataset.n * e))); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick); }, 1100);
})();

/* Why Laboura on phones: grow the text until the table fills the space above the call buttons */
(() => {
  const why = document.querySelector('.why'); if (!why) return;
  const fit = () => {
    if (innerWidth > 860){ why.style.removeProperty('--k'); return; }
    const room = innerHeight - why.offsetTop - 18;
    let lo = .8, hi = 1.8;
    for (let n = 0; n < 14; n++){ const k = (lo + hi) / 2; why.style.setProperty('--k', k.toFixed(3));
      if (why.offsetHeight <= room) lo = k; else hi = k; }
    why.style.setProperty('--k', lo.toFixed(3));
  };
  let t; const later = () => { clearTimeout(t); t = setTimeout(fit, 120); };
  fit(); addEventListener('resize', later); addEventListener('orientationchange', later);
  if (document.fonts) document.fonts.ready.then(fit);
  addEventListener('load', fit);
})();

/* Laptops with short screens: shrink the steps and Why panels so they sit fully between the header and the bottom edge */
(() => {
  const els = ['.hiw', '.why'].map(s => document.querySelector(s)).filter(Boolean); if (!els.length) return;
  const fit = () => {
    const phoneCss = innerWidth <= 860 || innerWidth / innerHeight <= 1.05 || innerHeight <= 500;
    els.forEach(el => {
      if (phoneCss){ el.style.removeProperty('--z'); el.style.removeProperty('top'); return; }
      el.style.setProperty('--z', '1');
      const top = 88, band = innerHeight - top - 22, h = el.offsetHeight;
      el.style.setProperty('--z', Math.min(1, band / h).toFixed(3));
      el.style.top = (top + band / 2) + 'px';
    });
  };
  let t; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(fit, 120); });
  fit(); addEventListener('load', fit); if (document.fonts) document.fonts.ready.then(fit);
})();

/* Jobs by sector: "I want a job" / "I need staff" switch.
   Tapping a job opens a small panel with three ways to start: missed call, WhatsApp (message ready), the app. */
(() => {
  const sec = document.getElementById('sectors'); if (!sec) return;
  const WA = 'https://wa.me/91XXXXXXXXXX?text=';
  const btns = [...sec.querySelectorAll('.sx-mode button')], cards = [...sec.querySelectorAll('.sxc')];
  const jp = document.getElementById('jp');
  if (jp) document.body.appendChild(jp);  /* keep the panel above everything, whatever its parent does */
  const msg = (mode, role) => mode === 'staff'
    ? `Hi Laboura, I need staff.\nJob: ${role}\nHow many people: \nBusiness name: \nArea: `
    : `Hi Laboura, I want a job.\nJob: ${role}\nMy name: \nMy area: \nExperience (years): `;
  const roleOf = c => (c.querySelector('.sxc-role') || {}).textContent.trim();
  let mode = 'job';
  const setMode = m => {
    mode = m; sec.dataset.mode = m;
    btns.forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === m ? 'true' : 'false'));
    cards.forEach(c => {
      c.href = WA + encodeURIComponent(msg(m, roleOf(c)));
      const g = c.querySelector('.sxc-go'); if (g) g.textContent = m === 'staff' ? 'Hire for this job' : 'Get this job';
    });
  };
  btns.forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
  setMode('job');

  /* the panel */
  let lastCard = null;
  const close = () => {
    if (!jp || jp.hidden) return;
    jp.classList.remove('on');
    setTimeout(() => { jp.hidden = true; }, 260);
    document.documentElement.classList.remove('jp-open');
    if (window.LB_lenis) LB_lenis.start();
    if (lastCard) lastCard.focus({ preventScroll: true });
  };
  const open = c => {
    if (!jp) return false;
    lastCard = c;
    const role = roleOf(c), img = c.querySelector('img'), pay = c.querySelector('.sxc-pay');
    jp.querySelector('.jp-t').textContent = role;
    jp.querySelector('.jp-pay').textContent = pay ? pay.textContent.trim() : '';
    const pi = jp.querySelector('.jp-img'); if (img){ pi.src = img.currentSrc || img.src; pi.style.objectPosition = img.style.objectPosition; }
    const staff = mode === 'staff';
    jp.classList.toggle('staff', staff);
    jp.querySelector('.jp-k').textContent = staff ? 'Hire for this job' : 'Get this job';
    jp.querySelector('.jp-ask').textContent = staff ? 'How do you want to send your request?' : 'How do you want to start?';
    jp.querySelector('.jp-wa').href = WA + encodeURIComponent(msg(mode, role));
    jp.querySelector('.jp-call small').textContent = staff ? 'Free. Our team calls you back.' : 'Free. We call you back.';
    const app = jp.querySelector('.jp-app');
    app.querySelector('svg').innerHTML = staff ? '<path d="M7 3h7l4 4v14H7z"/><path d="M10 12h5M10 16h5"/>' : '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>';
    if (staff){ app.href = 'company-enquiry.html'; app.querySelector('b').textContent = 'Fill the hiring form'; app.querySelector('small').textContent = 'For many people or many jobs at once.'; }
    else { app.href = '#'; app.querySelector('b').textContent = 'Download the Laboura app'; app.querySelector('small').textContent = 'Register yourself in 2 minutes.'; }
    jp.hidden = false; void jp.offsetWidth; jp.classList.add('on');
    document.documentElement.classList.add('jp-open');
    if (window.LB_lenis) LB_lenis.stop();
    jp.querySelector('.jp-card').focus({ preventScroll: true });
    return true;
  };
  cards.forEach(c => c.addEventListener('click', e => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    if (open(c)) e.preventDefault();
  }));
  if (jp){
    jp.querySelectorAll('[data-close]').forEach(x => x.addEventListener('click', close));
    addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    jp.querySelectorAll('.jp-w').forEach(a => a.addEventListener('click', () => setTimeout(close, 400)));
    /* keep keyboard focus inside the panel */
    jp.addEventListener('keydown', e => {
      if (e.key !== 'Tab') return;
      const f = [...jp.querySelectorAll('button,a[href]')]; const a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a){ e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z){ e.preventDefault(); a.focus(); }
    });
  }

  /* hero buttons jump straight to the jobs, in the right mode */
  document.querySelectorAll('a[data-go]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault(); setMode(a.dataset.go);
    const y = sec.getBoundingClientRect().top + scrollY - 64;
    if (window.LB_lenis) LB_lenis.scrollTo(y, { immediate: true, force: true }); else scrollTo(0, y);
    const m = sec.querySelector('.sx-mode'); if (m){ m.classList.remove('flash'); void m.offsetWidth; m.classList.add('flash'); }
  }));
})();
