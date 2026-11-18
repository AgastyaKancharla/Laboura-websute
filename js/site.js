(function(){
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
document.documentElement.classList.add('js');
const hdr = document.querySelector('.hdr');

/* smooth scroll */
let lenis = null;
if (!reduce && window.Lenis){ try { lenis = new Lenis({ lerp: 0.07, smoothWheel: true, wheelMultiplier: 0.9, touchMultiplier: 1.2 }); } catch(e){ lenis = null; } }
window.LB_lenis = lenis;
document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const id = a.getAttribute('href'); if (id.length < 2) return; const t = document.querySelector(id); if (!t) return;
  e.preventDefault();
  if (lenis) lenis.scrollTo(t, { offset: -70, duration: 1.5 }); else t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
}));

/* menu */
const burger = document.querySelector('.burger'); const menu = document.getElementById('menu');
function setMenu(open){
  document.body.classList.toggle('menu-open', open);
  burger.setAttribute('aria-expanded', open); burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  menu.setAttribute('aria-hidden', !open); menu.inert = !open;
  if (lenis) open ? lenis.stop() : lenis.start();
  document.documentElement.style.overflow = open ? 'hidden' : '';
  if (open) setTimeout(() => { const f = menu.querySelector('a'); f && f.focus({ preventScroll: true }); }, 350);
}
if (burger && menu){
  menu.inert = true;
  burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')){ setMenu(false); burger.focus(); } });
}

/* split headings into words for reveal */
document.querySelectorAll('.rv').forEach(el => {
  let i = 0;
  const walk = node => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3){
        const parts = n.textContent.split(/(\s+)/); const frag = document.createDocumentFragment();
        parts.forEach(p => { if (!p) return; if (/^\s+$/.test(p)){ frag.appendChild(document.createTextNode(p)); return; }
          const w = document.createElement('span'); w.className = 'wd'; const s = document.createElement('span'); s.textContent = p; s.style.setProperty('--i', i++); w.appendChild(s); frag.appendChild(w); });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName === 'svg'){
        const w = document.createElement('span'); w.className = 'wd'; const s = document.createElement('span'); s.style.setProperty('--i', i++);
        n.replaceWith(w); s.appendChild(n); w.appendChild(s);
      } else if (n.nodeType === 1 && n.tagName === 'BR'){ /* keep */ }
      else if (n.nodeType === 1) walk(n);
    });
  };
  walk(el);
});
const revealEls = [...document.querySelectorAll('.rv, .fade')];
if ('IntersectionObserver' in window && !reduce){
  const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
  revealEls.forEach(el => io.observe(el));
} else revealEls.forEach(el => el.classList.add('in'));

/* counters */
const fmt = n => n.toLocaleString('en-IN');
if ('IntersectionObserver' in window && !reduce){
  const cio = new IntersectionObserver(es => es.forEach(en => {
    if (!en.isIntersecting) return; cio.unobserve(en.target);
    const el = en.target, to = +el.dataset.to, plus = to > 100 ? '+' : ''; const t0 = performance.now();
    const step = now => { const k = Math.min((now - t0) / 1700, 1); const v = Math.round(to * (1 - Math.pow(1 - k, 4)));
      el.textContent = fmt(v) + (k === 1 ? plus : ''); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }), { threshold: .5 });
  document.querySelectorAll('[data-to]').forEach(c => cio.observe(c));
}

/* statements: words light up while reading */
const statements = [...document.querySelectorAll('[data-words]')].map(el => {
  const words = el.textContent.trim().split(/\s+/); el.textContent = '';
  const spans = words.map(w => { const s = document.createElement('span'); s.className = 'w'; s.textContent = w + ' '; el.appendChild(s); return s; });
  return { el, spans };
});

/* rails: slide sideways, words get heavier as they reach the centre */
const rails = [...document.querySelectorAll('.rail')];
const railWords = rails.map(r => [...r.querySelectorAll('span')]);

/* tabs */
document.querySelectorAll('[role="tablist"]').forEach(list => {
  const tabs = [...list.querySelectorAll('[role="tab"]')];
  const pick = t => tabs.forEach(x => { const on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; document.getElementById(x.getAttribute('aria-controls')).hidden = !on; });
  tabs.forEach(t => t.addEventListener('click', () => pick(t)));
  list.addEventListener('keydown', e => { const i = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true');
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft'){ const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]; pick(n); n.focus(); } });
});

/* ambient particles for inner-page heroes */
document.querySelectorAll('canvas[data-ambient]').forEach(cv => {
  const ctx = cv.getContext('2d'); const mix = parseFloat(cv.dataset.ambient || '.5');
  let W, H, pts = [], dpr = Math.min(devicePixelRatio || 1, 2);
  const mouse = { x: -9999, y: -9999 };
  function size(){ W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(150, W * H / 9000)); pts = [];
    for (let i = 0; i < n; i++) pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25, r: .8 + Math.random() * 1.8, s: Math.random() < mix ? 0 : 1 });
  }
  size(); addEventListener('resize', size);
  cv.parentElement.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
  cv.parentElement.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
  const col = ['245,122,0', '10,79,216'];
  function draw(){
    ctx.clearRect(0, 0, W, H);
    for (const p of pts){
      if (!reduce){ p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1;
        const dx = mouse.x - p.x, dy = mouse.y - p.y, d = Math.hypot(dx, dy); if (d < 180){ p.x += dx * .004; p.y += dy * .004; } }
    }
    ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++){
      const a = pts[i], b = pts[j]; if (a.s === b.s) continue; const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < 150){ const g = ctx.createLinearGradient(a.x, a.y, b.x, b.y); const al = (1 - d / 150) * .35;
        g.addColorStop(0, `rgba(${col[a.s]},${al})`); g.addColorStop(1, `rgba(${col[b.s]},${al})`);
        ctx.strokeStyle = g; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    }
    for (const p of pts){ const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5); g.addColorStop(0, `rgba(${col[p.s]},.95)`); g.addColorStop(1, `rgba(${col[p.s]},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalCompositeOperation = 'source-over';
    if (!reduce) requestAnimationFrame(draw);
  }
  draw();
});

/* main loop */
const lightSecs = [...document.querySelectorAll('[data-nav="light"]')];
function frame(t){
  if (lenis) lenis.raf(t);
  if (hdr && !document.body.classList.contains('menu-open')){
    let light = false; for (const s of lightSecs){ const r = s.getBoundingClientRect(); if (r.top <= 40 && r.bottom > 40){ light = true; break; } }
    hdr.classList.toggle('light', light);
  }
  rails.forEach((r, k) => {
    const sec = r.parentElement.getBoundingClientRect(); const sp = (innerHeight - sec.top) / (innerHeight + sec.height);
    if (sp < -0.1 || sp > 1.1) return;
    const dir = +r.dataset.dir; if (!reduce) r.style.transform = `translateX(${(dir < 0 ? -sp : sp - 1) * 38}%)`;
    const cx = innerWidth / 2;
    railWords[k].forEach(w => { const b = w.getBoundingClientRect(); const d = Math.min(Math.abs(b.left + b.width / 2 - cx) / (innerWidth * .5), 1);
      const wt = Math.round(900 - d * 650); w.style.fontWeight = wt; w.style.color = d < .35 ? '#0E1424' : '#B4B9C6'; });
  });
  statements.forEach(s => {
    const r = s.el.getBoundingClientRect(); const p = reduce ? 1 : Math.min(Math.max((innerHeight * .85 - r.top) / (r.height + innerHeight * .35), 0), 1);
    const lit = Math.round(p * s.spans.length); s.spans.forEach((w, i) => { w.style.opacity = i < lit ? 1 : .16; });
  });
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
})();
