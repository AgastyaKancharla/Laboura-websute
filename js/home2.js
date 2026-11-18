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
