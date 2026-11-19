(function(){
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const story = document.getElementById('story'); if (!story) return;
const stage = story.querySelector('.stage');
const caps = [...story.querySelectorAll('.cap')];
const ticks = [...story.querySelectorAll('.chapters b')];
const bub1 = document.getElementById('bub1'), bub2 = document.getElementById('bub2');
const dialHint = document.getElementById('dial-hint'), dial = document.getElementById('dial'), dialBtns = dial ? [...dial.querySelectorAll('button')] : [];
const vennEls = { seek: document.getElementById('venn-seek'), biz: document.getElementById('venn-biz'), core: document.getElementById('venn-core') };
/* scenes: 0 hero sentence, 1 the logo, 2-6 the five promises, 7-11 India state by state, 12-14 how it works, 15 wordmark */
const SCENES = 15, PROMISE0 = 2, PROMISE1 = 6, INDIA0 = 7, INDIA1 = 11, HIW0 = 12, HIW1 = 14;
/* scroll stops: 0 hero, 1 logo, 2 the promises (one frame, tap or auto), 3 India (one frame, tap a state), 4 how it works (all steps), 5 wordmark */
const STOPS = 5, ROTATE_MS = 3500;
let pIdx = 0, iK = 0, pStart = performance.now(), pPause = 0, tapped = false;
const indiaAt = k => INDIA0 + k / 9 * (INDIA1 - INDIA0);
function toFilm(s){
  const v = [0, 1, PROMISE0 + pIdx, indiaAt(iK), HIW0, SCENES];
  const k = Math.min(Math.floor(s), STOPS - 1), f = s - k;
  if (s >= STOPS) return SCENES;
  const A = v[k], B = v[k + 1];
  if (Math.abs(B - A) <= 1.0001) return A + (B - A) * f;
  /* far apart (e.g. the 3rd promise to the map): leave the current frame, then arrive at the next one, never passing through the frames between */
  const sg = Math.sign(B - A); return f < .5 ? A + sg * f : B - sg * (1 - f);
}
const hiw = document.getElementById('hiw'), hiwTabs = hiw ? [...hiw.querySelectorAll('[role="tab"]')] : [], hiwPaths = hiw ? [...hiw.querySelectorAll('.hiw-path')] : [];
let hiwMode = 'job';
const panel = document.getElementById('india-panel'), ips = panel ? [...panel.querySelectorAll('.ip')] : [];
const statebar = document.getElementById('statebar'), sbBtns = statebar ? [...statebar.querySelectorAll('button')] : [];
stage.classList.remove('intro');

/* scroll position -> story progress, with a short rest on each scene and long, visible transitions */
function rawStop(){
  const r = story.getBoundingClientRect(); const span = story.offsetHeight - innerHeight;
  const raw = Math.min(Math.max(-r.top / span, 0), 1) * STOPS;
  const k = Math.min(Math.floor(raw), STOPS - 1), f = raw - k;
  const g = Math.min(Math.max((f - 0.1) / 0.8, 0), 1);
  return raw >= STOPS ? STOPS : k + g * g * (3 - 2 * g);
}
function rawProgress(){ return toFilm(rawStop()); }
/* one gesture = one frame. Inside the film, a wheel flick or a finger swipe moves exactly one frame;
   at the last frame the page scrolls on normally. */
const stopY = k => story.offsetTop + (k / STOPS) * (story.offsetHeight - innerHeight) + 1;
const linStop = () => { const r = story.getBoundingClientRect(); return Math.min(Math.max(-r.top / (story.offsetHeight - innerHeight), 0), 1) * STOPS; };
const engaged = () => { const r = story.getBoundingClientRect(); return r.top <= 2 && r.bottom >= innerHeight - 2; };
let moving = false, moveEnd = 0, cur = Math.round(linStop());
function goStop(t){
  t = Math.min(Math.max(t, 0), STOPS); cur = t; moving = true;
  const y = stopY(t), done = () => { moving = false; moveEnd = performance.now(); };
  if (window.LB_lenis) window.LB_lenis.scrollTo(y, { duration: 1.05, lock: true, force: true, onComplete: done });
  else { scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' }); setTimeout(done, 750); }
  setTimeout(() => { if (moving) done(); }, 1500);
}
/* wheel: take over only while the film fills the screen, and only one move per flick (trackpads keep sending events) */
let wheelQuiet = 0, wheelUsed = false, wheelAbs = 0;
addEventListener('wheel', e => {
  if (!engaged() || e.ctrlKey) return;
  const dir = e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : 0; if (!dir) return;
  const at = Math.round(linStop());
  if ((dir > 0 && at >= STOPS && !moving) || (dir < 0 && at <= 0 && !moving)) return;   // leave the film normally
  e.preventDefault(); e.stopImmediatePropagation();
  const now = performance.now(), abs = Math.abs(e.deltaY);
  /* a new flick: a pause in the events, or the push getting stronger again (trackpad inertia only fades) */
  if (now - wheelQuiet > 350 || (abs > wheelAbs * 1.5 + 2 && now - moveEnd > 250)) wheelUsed = false;
  wheelQuiet = now; wheelAbs = abs;
  if (moving || wheelUsed || now - moveEnd < 150 || abs < 4) return;
  wheelUsed = true; goStop(at + dir);
}, { capture: true, passive: false });
/* touch: a swipe inside the film moves one frame, the page does not drift */
let ty0 = 0, tDir = 0, tNative = false, tStart = false;
addEventListener('touchstart', e => { tStart = engaged(); ty0 = e.touches[0].clientY; tDir = 0; tNative = false; }, { passive: true });
addEventListener('touchmove', e => {
  if (!tStart) return;
  const dy = ty0 - e.touches[0].clientY;
  if (!tDir && Math.abs(dy) > 6){ tDir = dy > 0 ? 1 : -1; const at = Math.round(linStop()); tNative = (tDir > 0 && at >= STOPS) || (tDir < 0 && at <= 0); }
  if (tDir && !tNative && e.cancelable) e.preventDefault();
}, { passive: false });
addEventListener('touchend', e => {
  if (!tStart || !tDir || tNative) return;
  const dy = ty0 - (e.changedTouches[0] ? e.changedTouches[0].clientY : ty0);
  if (Math.abs(dy) > 28 && !moving) goStop(Math.round(linStop()) + tDir);
}, { passive: true });
/* keyboard and scrollbar: when scrolling stops halfway inside the film, settle on the nearest frame */
let idleT = 0;
addEventListener('scroll', () => { clearTimeout(idleT); idleT = setTimeout(() => {
  if (moving || !engaged()) return; const raw = linStop(), n = Math.round(raw);
  if (Math.abs(raw - n) > .02) goStop(n); }, 260); }, { passive: true });
/* promises: tap a button, or let them turn every few seconds */
function setPromise(i, byUser){
  const from = pIdx; if (i === from) return; pIdx = i; pStart = performance.now();
  if (byUser){ pPause = pStart + 9000; tapped = true; if (dial) dial.classList.add('tapped'); }
  if (Math.abs(i - from) > 1) shown = PROMISE0 + i - Math.sign(i - from) * .6;
}
function setState(k){ iK = k; shown = rawProgress(); if (statebar) statebar.classList.add('tapped'); }
dialBtns.forEach((b, i) => b.addEventListener('click', () => setPromise(i, true)));
dialBtns.forEach(b => b.addEventListener('mouseenter', () => { pPause = performance.now() + 6000; }));
sbBtns.forEach(b => b.addEventListener('click', () => { const k = +b.dataset.s; setState(iK === k ? 0 : k); }));

/* ---------- looping hero film ---------- */
const LOOP = [ [0, 0], [0.4, 0], [2.2, 1], [5.0, 1], [7.0, 2], [9.8, 2], [11.8, 3], [16.0, 3], [17.6, 4] ];
const FIRST_DELAY = 1.6, LEN = LOOP[LOOP.length - 1][0];
let filmStart = null;
function filmValue(now){
  if (reduce) return 3;
  if (filmStart === null) filmStart = now + FIRST_DELAY * 1000;
  let s = (now - filmStart) / 1000; if (s < 0) return 0;
  s = s % LEN;
  for (let i = 0; i < LOOP.length - 1; i++){ const [t0, v0] = LOOP[i], [t1, v1] = LOOP[i + 1]; if (s >= t0 && s < t1) return v0 + (v1 - v0) * ((s - t0) / (t1 - t0)); }
  return 0;
}

/* split the "What is Laboura" headline into words that light up as you scroll */
const scrubEls = [...story.querySelectorAll('.scrub')].map(el => {
  const words = el.textContent.trim().split(/\s+/); el.textContent = '';
  return { el, spans: words.map(w => { const s = document.createElement('span'); s.className = 'sw'; s.textContent = w + ' '; el.appendChild(s); return s; }) };
});

function initGL(){
  if (!window.THREE || !window.LB_DATA) return null;
  const canvas = document.getElementById('gl');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); } catch(e){ return null; }
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100); camera.position.z = 12;
  const small = innerWidth < 760;
  const N = small ? 4200 : 8200;

  const type = new Float32Array(N), rnd = new Float32Array(N), dust = new Uint8Array(N);
  const seekers = [], biz = [], solid = [];
  for (let i = 0; i < N; i++){ rnd[i] = Math.random(); dust[i] = (i % 10 === 0) ? 1 : 0; type[i] = i % 2;
    if (!dust[i]){ (type[i] === 0 ? seekers : biz).push(i); solid.push(i); } }
  const M = Math.min(small ? 220 : 480, seekers.length, biz.length);
  const knotT = new Float32Array(N); for (let i = 0; i < N; i++) knotT[i] = Math.random();
  for (let k = 0; k < M; k++){ knotT[seekers[k]] = k / M; knotT[biz[k]] = k / M + 0.0035; }
  const gauss = () => { let u = 0, v = 0; while(!u) u = Math.random(); while(!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  function sampleCanvas(w, h, draw){
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
    x.fillStyle = '#fff'; x.strokeStyle = '#fff'; draw(x);
    const d = x.getImageData(0, 0, w, h).data; const pts = [];
    for (let y = 0; y < h; y += 2) for (let xx = 0; xx < w; xx += 2) if (d[(y * w + xx) * 4 + 3] > 128) pts.push([xx / w - .5, -(y / h - .5) * (h / w)]);
    return pts;
  }
  /* evenly spaced grid that fits `count` dots inside the drawn shape: reads like an LED sign */
  function gridSample(w, h, draw, count){
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
    x.fillStyle = '#fff'; x.strokeStyle = '#fff'; draw(x);
    const d = x.getImageData(0, 0, w, h).data; let F = 0; for (let p = 3; p < d.length; p += 4) if (d[p] > 128) F++;
    let step = Math.max(1.2, Math.sqrt(F / count) * .9), pts = [];
    for (let tries = 0; tries < 50; tries++){
      pts = [];
      for (let y = step / 2; y < h; y += step) for (let xx = step / 2; xx < w; xx += step){ const X = Math.floor(xx), Y = Math.floor(y); if (d[(Y * w + X) * 4 + 3] > 128) pts.push([xx / w - .5, -(y / h - .5) * (h / w)]); }
      if (pts.length <= count) break; step *= 1.015;
    }
    return { pts, step: step / w };
  }
  const rr = (x, X, Y, W, H, R) => { x.beginPath(); if (x.roundRect) x.roundRect(X, Y, W, H, R); else x.rect(X, Y, W, H); x.fill(); };
  const cut = (x, fn) => { x.globalCompositeOperation = 'destination-out'; fn(); x.globalCompositeOperation = 'source-over'; };
  const FONT = '"Unbounded","Arial Black",Arial,sans-serif';
  const TFONT = '"Host Grotesk","Helvetica Neue",Arial,sans-serif';   // tagline: clear letters (a real j) when drawn in dots

  /* ---- the film's drawings ---- */
  const drawPerson = (variant) => x => {
    x.lineCap = 'round'; x.lineJoin = 'round';
    const limb = (pts, w) => { x.lineWidth = w; x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) x.lineTo(pts[i][0], pts[i][1]); x.stroke(); };
    const oval = (cx, cy, rx, ry) => { x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); x.fill(); };
    oval(150, 62, 33, 40); x.beginPath(); x.ellipse(150, 50, 36, 34, 0, Math.PI, Math.PI * 2); x.fill(); rr(x, 136, 92, 28, 40, 10);
    x.beginPath(); x.moveTo(94, 146); x.quadraticCurveTo(150, 122, 206, 146); x.quadraticCurveTo(224, 154, 218, 184);
    x.lineTo(204, 292); x.quadraticCurveTo(206, 318, 200, 336); x.lineTo(100, 336); x.quadraticCurveTo(94, 318, 96, 292);
    x.lineTo(82, 184); x.quadraticCurveTo(76, 154, 94, 146); x.fill();
    limb([[127, 330], [124, 440]], 48); limb([[124, 440], [123, 548]], 36); limb([[173, 330], [176, 440]], 48); limb([[176, 440], [177, 548]], 36);
    oval(112, 568, 26, 12); oval(188, 568, 26, 12);
    if (variant === 'owner'){ limb([[90, 158], [58, 236]], 30); limb([[58, 236], [96, 296]], 25); limb([[210, 158], [242, 236]], 30); limb([[242, 236], [204, 296]], 25); }
    else { limb([[88, 160], [74, 246]], 30); limb([[74, 246], [69, 322]], 25); oval(68, 336, 13, 17);
      if (variant === 'wave'){ limb([[212, 160], [252, 104]], 30); limb([[252, 104], [262, 36]], 25); oval(264, 20, 13, 17); }
      else { limb([[212, 160], [226, 246]], 30); limb([[226, 246], [231, 322]], 25); oval(232, 336, 13, 17); } }
    cut(x, () => { x.lineWidth = 5;
      x.beginPath(); x.moveTo(126, 146); x.lineTo(150, 176); x.lineTo(174, 146); x.stroke();
      x.beginPath(); x.moveTo(98, 300); x.lineTo(202, 300); x.stroke(); x.beginPath(); x.moveTo(150, 336); x.lineTo(150, 420); x.stroke();
      if (variant === 'owner'){ x.beginPath(); x.moveTo(116, 196); x.lineTo(116, 330); x.moveTo(184, 196); x.lineTo(184, 330); x.stroke(); } });
  };
  const drawShop = x => {
    rr(x, 40, 20, 420, 74, 10); rr(x, 60, 94, 380, 330, 4); rr(x, 20, 420, 460, 16, 4);
    x.beginPath(); x.moveTo(40, 110); x.lineTo(460, 110); x.lineTo(480, 168); x.lineTo(20, 168); x.closePath(); x.fill();
    for (let i = 0; i < 10; i++){ x.beginPath(); x.arc(43 + i * 46, 168, 23, 0, Math.PI); x.fill(); }
    cut(x, () => { rr(x, 70, 36, 360, 42, 6);
      for (let i = 0; i < 10; i += 2){ x.beginPath(); x.moveTo(40 + i * 44 + 8, 116); x.lineTo(40 + (i + 1) * 44 + 8, 116); x.lineTo(40 + (i + 1) * 46 + 12, 160); x.lineTo(40 + i * 46 + 12, 160); x.closePath(); x.fill(); }
      x.fillRect(40, 192, 420, 10); rr(x, 88, 222, 176, 150, 6); rr(x, 300, 222, 110, 198, 6); });
    rr(x, 88, 294, 176, 8, 2); rr(x, 172, 222, 8, 150, 2); rr(x, 306, 228, 98, 8, 2);
    x.beginPath(); x.arc(390, 330, 7, 0, Math.PI * 2); x.fill(); rr(x, 120, 46, 260, 8, 4); rr(x, 150, 62, 200, 6, 3);
  };
  function textCanvas(lines){
    const cw = 2000, m = document.createElement('canvas').getContext('2d');
    let fs = 300; m.font = `800 ${fs}px ${TFONT}`;
    const widths = lines.map(l => l.reduce((w, seg) => w + m.measureText(seg.t).width, 0));
    fs = Math.floor(fs * Math.min(1, (cw * .97) / Math.max(...widths)));
    const lh = fs * 1.16, ch = Math.ceil(lines.length * lh + fs * .3);
    const drawGroup = g => x => { x.font = `800 ${fs}px ${TFONT}`; x.lineJoin = 'round'; x.lineWidth = fs * .035;
      lines.forEach((l, li) => { let cx = 6; const y = fs * 1.0 + li * lh;
        l.forEach(seg => { m.font = x.font; if (seg.g === g){ x.fillText(seg.t, cx, y); x.strokeText(seg.t, cx, y); } cx += m.measureText(seg.t).width; }); }); };
    return { cw, ch, drawGroup };
  }

  /* ---- the "What is Laboura" rings and the five promise icons (500 x 500 canvases) ---- */
  const ring = (cx) => x => { x.lineWidth = 54; x.beginPath(); x.arc(cx, 250, 118, 0, Math.PI * 2); x.stroke(); };
  const ICONS = [
    x => { x.beginPath(); x.moveTo(250, 40); x.lineTo(430, 104); x.lineTo(430, 236); x.bezierCurveTo(430, 360, 340, 438, 250, 468); x.bezierCurveTo(160, 438, 70, 360, 70, 236); x.lineTo(70, 104); x.closePath(); x.fill();
      cut(x, () => { x.lineWidth = 44; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(166, 258); x.lineTo(228, 320); x.lineTo(340, 196); x.stroke(); }); },        // verified: shield + tick
    x => { x.beginPath(); x.moveTo(300, 20); x.lineTo(110, 280); x.lineTo(236, 280); x.lineTo(196, 480); x.lineTo(396, 200); x.lineTo(266, 200); x.closePath(); x.fill();
      x.lineCap = 'round'; x.lineWidth = 22; [[40, 150, 120], [20, 240, 90], [50, 330, 110]].forEach(([a, y, l]) => { x.beginPath(); x.moveTo(a, y); x.lineTo(a + l * .55, y); x.stroke(); }); }, // fast: lightning bolt + speed lines
    x => { x.lineWidth = 40; x.lineCap = 'round'; x.beginPath(); x.arc(250, 250, 196, -0.35, Math.PI * 1.65); x.stroke();
      x.beginPath(); x.moveTo(420, 120); x.lineTo(456, 210); x.lineTo(362, 196); x.closePath(); x.fill();
      x.font = `800 150px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('90', 250, 262); },                                                          // 90-day replacement: loop + 90
    x => { x.lineWidth = 40; x.lineCap = 'round'; x.beginPath(); x.arc(250, 250, 196, Math.PI * .2, Math.PI * 1.8); x.stroke();
      x.beginPath(); x.moveTo(448, 300); x.lineTo(470, 196); x.lineTo(380, 250); x.closePath(); x.fill();
      x.font = `800 210px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('₹', 246, 262); },                                                       // full refund: rupee + return arrow
    x => { x.beginPath(); x.arc(250, 170, 92, 0, Math.PI * 2); x.fill();
      x.beginPath(); x.moveTo(80, 470); x.bezierCurveTo(80, 330, 160, 290, 250, 290); x.bezierCurveTo(340, 290, 420, 330, 420, 470); x.closePath(); x.fill();
      x.lineWidth = 26; x.lineCap = 'round'; x.beginPath(); x.arc(250, 170, 128, Math.PI * 1.05, Math.PI * 1.95); x.stroke();
      rr(x, 104, 150, 40, 80, 14); rr(x, 356, 150, 40, 80, 14);
      x.beginPath(); x.moveTo(376, 230); x.quadraticCurveTo(376, 290, 300, 292); x.stroke(); }                                                                                // one contact: person with headset
  ];

  /* how it works drawings, 500 x 500 */
  const H_PHONE = x => { rr(x, 160, 40, 180, 360, 34); cut(x, () => { rr(x, 178, 84, 144, 270, 10); });
    rr(x, 222, 58, 56, 8, 4); x.beginPath(); x.arc(250, 378, 12, 0, Math.PI * 2); x.fill();
    x.save(); x.translate(250, 210); x.rotate(-0.5); rr(x, -44, -14, 88, 28, 12); rr(x, -50, -32, 26, 46, 10); rr(x, 24, -32, 26, 46, 10); x.restore();
    x.lineWidth = 16; x.lineCap = 'round'; for (const r of [130, 168, 206]){ x.beginPath(); x.arc(250, 220, r, -0.5, 0.5); x.stroke(); x.beginPath(); x.arc(250, 220, r, Math.PI - 0.5, Math.PI + 0.5); x.stroke(); } };
  const H_CARD = x => { x.lineWidth = 22; x.lineJoin = 'round'; x.beginPath(); if (x.roundRect) x.roundRect(40, 90, 420, 320, 36); else x.rect(40, 90, 420, 320); x.stroke();
    x.beginPath(); x.arc(140, 190, 52, 0, Math.PI * 2); x.fill(); rr(x, 84, 250, 112, 46, 23);
    rr(x, 222, 156, 196, 22, 11); rr(x, 222, 200, 150, 18, 9); rr(x, 222, 238, 176, 18, 9);
    x.lineWidth = 12; [[84, 330, 98], [196, 330, 112], [322, 330, 96]].forEach(([X, Y, Wd]) => { x.beginPath(); if (x.roundRect) x.roundRect(X, Y, Wd, 44, 22); else x.rect(X, Y, Wd, 44); x.stroke(); });
    x.beginPath(); x.arc(430, 100, 46, 0, Math.PI * 2); x.fill(); cut(x, () => { x.lineWidth = 14; x.lineCap = 'round'; x.beginPath(); x.moveTo(410, 100); x.lineTo(425, 116); x.lineTo(452, 86); x.stroke(); }); };
  const H_CLIP = x => { x.lineWidth = 22; x.lineJoin = 'round'; x.beginPath(); if (x.roundRect) x.roundRect(80, 70, 340, 410, 30); else x.rect(80, 70, 340, 410); x.stroke();
    rr(x, 180, 40, 140, 66, 18); cut(x, () => { rr(x, 214, 58, 72, 22, 11); });
    [170, 270, 370].forEach((y, k) => { x.lineWidth = 14; x.beginPath(); if (x.roundRect) x.roundRect(124, y - 26, 52, 52, 10); else x.rect(124, y - 26, 52, 52); x.stroke();
      if (k < 2){ x.lineCap = 'round'; x.lineWidth = 14; x.beginPath(); x.moveTo(134, y); x.lineTo(148, y + 14); x.lineTo(176, y - 22); x.stroke(); }
      rr(x, 206, y - 12, k === 1 ? 150 : 176, 24, 12); }); };
  const phonePts = sampleCanvas(400, 400, x => {
    x.lineWidth = 9; x.lineCap = 'round';
    x.beginPath(); if (x.roundRect) x.roundRect(140, 60, 120, 250, 26); else x.rect(140, 60, 120, 250); x.stroke();
    x.beginPath(); x.moveTo(182, 84); x.lineTo(218, 84); x.stroke(); x.beginPath(); x.arc(200, 270, 18, 0, Math.PI * 2); x.fill();
    for (const r of [100, 130, 160]){ x.beginPath(); x.arc(200, 170, r, -0.55, 0.55); x.stroke(); x.beginPath(); x.arc(200, 170, r, Math.PI - 0.55, Math.PI + 0.55); x.stroke(); }
  });
  const fromData = (o) => { const out = [], s = Math.max(o.w, o.h), cw = o.w / s, ch = o.h / s; for (let i = 0; i < o.p.length; i += 2) out.push([o.p[i] / 999 - cw / 2, -(o.p[i + 1] / 999 - ch / 2)]); return out; };
  const wmPts = fromData(LB_DATA.wm);

  /* fixed particle groups */
  const S = shuffle(seekers.slice()), B = shuffle(biz.slice()), ALL = shuffle(solid.slice());
  const ownerB = B.slice(0, Math.round(B.length * .26)), ownerS = S.slice(0, Math.round(S.length * .26));
  const owner = ownerS.concat(ownerB), shopIdx = S.slice(ownerS.length).concat(B.slice(ownerB.length));
  const txt0 = S.slice(0, Math.round(S.length * .44)).concat(B.slice(0, Math.round(B.length * .44)));
  const txt1 = S.slice(Math.round(S.length * .44)), txt2 = B.slice(Math.round(B.length * .44));

  /* film shapes live in attributes; scroll scenes are swapped into aFrom / aTo as you scroll */
  const FILM = ['p0', 'iS', 'i0', 'i1'];
  const A = {}; FILM.forEach(n => { A[n] = new Float32Array(N * 3); });
  const SC = []; for (let k = 0; k <= SCENES; k++) SC.push(k === 0 ? A.p0 : new Float32Array(N * 3));
  const aFrom = new Float32Array(N * 3), aTo = new Float32Array(N * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  FILM.forEach(n => geo.setAttribute(n, new THREE.BufferAttribute(A[n], 3)));
  geo.setAttribute('aFrom', new THREE.BufferAttribute(aFrom, 3)); geo.setAttribute('aTo', new THREE.BufferAttribute(aTo, 3));
  geo.setAttribute('aType', new THREE.BufferAttribute(type, 1)); geo.setAttribute('aRand', new THREE.BufferAttribute(rnd, 1));
  const aCol = new Float32Array(N * 3); geo.setAttribute('aCol', new THREE.BufferAttribute(aCol, 3));
  const aState = new Float32Array(N); geo.setAttribute('aState', new THREE.BufferAttribute(aState, 1));
  const dustA = new Float32Array(N); for (let i = 0; i < N; i++) dustA[i] = dust[i];
  geo.setAttribute('aDust', new THREE.BufferAttribute(dustA, 1));
  const lgeo = new THREE.BufferGeometry();
  const lidx = new Uint32Array(M * 2); for (let k = 0; k < M; k++){ lidx[k * 2] = seekers[k]; lidx[k * 2 + 1] = biz[k]; }
  const LNAMES = FILM.concat(['aFrom', 'aTo']); const LA = {}; LNAMES.forEach(n => { LA[n] = new Float32Array(M * 6); });
  lgeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(M * 6), 3));
  LNAMES.forEach(n => lgeo.setAttribute(n, new THREE.BufferAttribute(LA[n], 3)));
  const ltype = new Float32Array(M * 2), lr = new Float32Array(M * 2), ld = new Float32Array(M * 2);
  for (let j = 0; j < M * 2; j++){ ltype[j] = type[lidx[j]]; lr[j] = rnd[lidx[j]]; }
  lgeo.setAttribute('aType', new THREE.BufferAttribute(ltype, 1)); lgeo.setAttribute('aRand', new THREE.BufferAttribute(lr, 1)); lgeo.setAttribute('aDust', new THREE.BufferAttribute(ld, 1)); lgeo.setAttribute('aCol', new THREE.BufferAttribute(new Float32Array(M * 6), 3)); lgeo.setAttribute('aState', new THREE.BufferAttribute(new Float32Array(M * 2), 1));
  const copyLines = (n, src) => { const dst = LA[n]; for (let j = 0; j < M * 2; j++){ const s = lidx[j] * 3, d = j * 3; dst[d] = src[s]; dst[d+1] = src[s+1]; dst[d+2] = src[s+2]; } lgeo.attributes[n].needsUpdate = true; };
  let pairK = -1;
  function setPair(k){
    const k2 = Math.min(k + 1, SCENES); if (k === pairK) return; pairK = k;
    aFrom.set(SC[k]); aTo.set(SC[k2]); geo.attributes.aFrom.needsUpdate = true; geo.attributes.aTo.needsUpdate = true;
    copyLines('aFrom', aFrom); copyLines('aTo', aTo);
  }

  const BASE = small ? 40 : 50;
  const uniforms = {
    uProg: { value: 0 }, uF: { value: 0 }, uIntro: { value: 0 }, uTime: { value: 0 }, uPix: { value: 1 }, uSize: { value: BASE }, uCrisp: { value: 1 }, uDot: { value: 1 },
    uKnot: { value: 0 }, uKnotC: { value: new THREE.Vector3() }, uWarm: { value: 0 }, uLine: { value: 0 }, uTint: { value: 0 },
    uMouse: { value: new THREE.Vector2(99, 99) }, uMR: { value: 1 }, uLogo: { value: 0 }, uIndia: { value: 0 }, uLitN: { value: 0 }, uActive: { value: 0 },
    uA: { value: new THREE.Color('#F57A00') }, uA2: { value: new THREE.Color('#F5B000') }, uB: { value: new THREE.Color('#0A4FD8') }, uB2: { value: new THREE.Color('#00A8E0') }, uW: { value: new THREE.Color('#000000') }
  };
  const anchors = { head1: new THREE.Vector3(), head2: new THREE.Vector3(), vSeek: new THREE.Vector3(), vBiz: new THREE.Vector3(), vCore: new THREE.Vector3() };
  let wideNow = true, pxPerWorld = 100, W = 1, H = 1;
  const dotFilm = { 1: .05, 2: .05, 3: .05 }, dotScene = new Float32Array(SCENES + 1), stateCam = [];
  let hiwGeom = null;
  function buildHIW(){
    if (!hiwGeom) return; const G = hiwGeom, base = G.cy - G.sz / 2;
    const one = (k, draw) => { const g = gridSample(500, 500, draw, ALL.length); G.place(SC[k], ALL, g, G.cx, base, G.sz, 1); dotScene[k] = g.step * G.sz; };
    one(HIW0, H_PHONE);
    one(HIW0 + 1, hiwMode === 'job' ? H_CARD : H_CLIP);
    if (hiwMode === 'job'){       // a person starting work at a shop nearby
      const shopN = Math.round(ALL.length * .66), shopP = ALL.slice(0, shopN), perP = ALL.slice(shopN);
      const sw = G.sz * .78, sh = sw * .88, yb = G.cy - sh * .5;
      const d1 = G.place(SC[HIW0 + 2], shopP, gridSample(500, 440, drawShop, shopP.length), G.cx + G.sz * .1, yb, sw, .88);
      const d2 = G.place(SC[HIW0 + 2], perP, gridSample(300, 600, drawPerson('wave'), perP.length), G.cx - G.sz * .42, yb, sh * .42, 2, .4);
      dotScene[HIW0 + 2] = (d1 + d2) / 2;
    } else {                     // a team of three, ready to start
      const t = Math.floor(ALL.length / 3), ph = G.sz * .36, yb = G.cy - ph;
      const parts = [ALL.slice(0, t), ALL.slice(t, 2 * t), ALL.slice(2 * t)], xs = [-.34, 0, .34];
      const ds = parts.map((pp, k) => G.place(SC[HIW0 + 2], pp, gridSample(300, 600, drawPerson(k === 1 ? 'owner' : 'stand'), pp.length), G.cx + xs[k] * G.sz, yb, ph * (k === 1 ? 1.06 : 1), 2, k === 1 ? .3 : 0));
      dotScene[HIW0 + 2] = ds[0];
    }
    pairK = -1;
  }
  function layout(){
    const w = innerWidth, h = innerHeight, asp = w / h;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 2 : 1.75));
    renderer.setSize(w, h, false); camera.aspect = asp; camera.updateProjectionMatrix();
    H = Math.tan(THREE.MathUtils.degToRad(21)) * 12; W = H * asp; const wide = asp > 1.05; wideNow = wide;
    pxPerWorld = h / (2 * H); uniforms.uMR.value = wide ? H * .28 : W * .4;
    const sx = wide ? W * 0.34 : 0, sy = wide ? 0.05 * H : H * 0.28;
    const sS = wide ? H * 1.5 : Math.min(W * 1.6, H * 0.95);
    const pick = (arr, i, j) => arr[(i * 7919 + j) % arr.length];
    uniforms.uKnotC.value.set(sx, sy, 0);
    const put = (arr, i, x, y, z) => { const o = i * 3; arr[o] = x; arr[o+1] = y; arr[o+2] = z; };
    const place = (arr, idx, g, cx, baseY, scaleW, aspect, z) => {
      const pts = g.pts; idx.forEach((i, j) => { const q = pts[j % pts.length], dup = j >= pts.length;
        put(arr, i, cx + q[0] * scaleW, baseY + (q[1] + aspect / 2) * scaleW, (z || 0) + (dup ? -.01 : 0)); });
      return g.step * scaleW;
    };
    /* film */
    /* phones: the film fills the free space between the header and the hero text */
    const capEl = story.querySelector('.hero-cap'), pxW = 2 * H / h;
    const bandTop = H - 92 * pxW, bandBot = capEl ? H - Math.max(capEl.offsetTop - 14, h * .38) * pxW : -H * .1, band = bandTop - bandBot;
    const s1 = wide ? H * .36 : Math.min(band * .84 / 2, W * .9), fyA = wide ? H * .46 : bandBot + s1 + Math.max(0, band * .84 - 2 * s1) * .5, p1x = wide ? -W * .1 : 0;
    const shopAsp = 440 / 500, shopW = wide ? W * .3 : Math.min(W * 1.22, band * .86 / shopAsp), shopH = shopW * shopAsp, shopX = wide ? W * .34 : W * .2;
    const yb = wide ? H * .12 : bandBot + (band - shopH) * .5, ownH = shopH * .86, ownX = shopX - shopW * .62;
    anchors.head1.set(p1x + s1 * .55, fyA + s1 * .98, 0); anchors.head2.set(ownX + ownH * .1, yb + ownH, 0);
    dotFilm[1] = place(A.i0, ALL, gridSample(300, 600, drawPerson('wave'), ALL.length), p1x, fyA - s1, s1, 2);
    const d1 = place(A.i1, shopIdx, gridSample(500, 440, drawShop, shopIdx.length), shopX, yb, shopW, shopAsp);
    const d2 = place(A.i1, owner, gridSample(300, 600, drawPerson('owner'), owner.length), ownX, yb, ownH * .5, 2, .5);
    dotFilm[2] = (d1 + d2) / 2;
    const T = textCanvas(wide ? [[{ t: 'One missed call.', g: 0 }], [{ t: 'Get a job.', g: 1 }, { t: '  ', g: -1 }, { t: 'Hire staff.', g: 2 }]]
                              : [[{ t: 'One missed', g: 0 }], [{ t: 'call.', g: 0 }], [{ t: 'Get a job.', g: 1 }], [{ t: 'Hire staff.', g: 2 }]]);
    const tAsp = T.ch / T.cw, TW = wide ? Math.min(W * 1.75, H * .62 / tAsp) : Math.min(W * 1.86, band * .92 / tAsp);
    const txL = -W + (wide ? W * .1 : W * .07), txB = wide ? H * .79 - tAsp * TW : bandBot + (band - tAsp * TW) * .5;
    const tx = [txt0, txt1, txt2].map((idx, g) => place(A.p0, idx, gridSample(T.cw, T.ch, T.drawGroup(g), idx.length), txL + TW / 2, txB, TW, tAsp));
    dotFilm[3] = Math.max(...tx); dotScene[0] = dotFilm[3];

    /* scene 1: the Laboura logo drawn in dots, each dot in the logo's own colour */
    { const L = window.LB_LOGO ? (small ? LB_LOGO.small : LB_LOGO.big) : null;
      const vc = wide ? [W * .4, -H * .02] : [0, H * .4], vs = wide ? H * 1.3 / (L ? L.aspect : 1) : Math.min(W * 1.5, H * .8);
      if (L){ const n = L.p.length / 5;
        ALL.forEach((i, j) => { const q = (j % n) * 5, o = i * 3;
          put(SC[1], i, vc[0] + L.p[q] * vs, vc[1] + L.p[q + 1] * vs, j >= n ? -.01 : 0);
          aCol[o] = L.p[q + 2] / 255; aCol[o + 1] = L.p[q + 3] / 255; aCol[o + 2] = L.p[q + 4] / 255; });
        for (let i = 0; i < N; i++) if (dust[i]){ const o = i * 3, c = type[i] === 0 ? [.96, .48, 0] : [.04, .31, .85]; aCol[o] = c[0]; aCol[o + 1] = c[1]; aCol[o + 2] = c[2]; }
        geo.attributes.aCol.needsUpdate = true; dotScene[1] = L.step * vs;
      } else { ALL.forEach(i => put(SC[1], i, vc[0] + gauss() * vs * .2, vc[1] + gauss() * vs * .2, 0)); dotScene[1] = 0; }
      anchors.vSeek.set(99, 99, 0); anchors.vBiz.set(99, 99, 0); anchors.vCore.set(99, 99, 0); }
    /* scenes 2-6: the five promise icons */
    const ic = wide ? [W * .42, H * .02] : [0, H * .42], isz = wide ? H * 1.25 : Math.min(W * 1.5, H * .7);
    ICONS.forEach((draw, j) => { const g = gridSample(500, 500, draw, ALL.length); place(SC[PROMISE0 + j], ALL, g, ic[0], ic[1] - isz / 2, isz, 1); dotScene[PROMISE0 + j] = g.step * isz; });

    /* scenes 7-11: India, one map held while the states light up one by one */
    const IM = window.LB_INDIA ? (small ? LB_INDIA.small : LB_INDIA.big) : null;
    const mc = wide ? [W * .36, -H * .02] : [0, H * .4], ms = wide ? H * 1.85 / (IM ? IM.aspect : 1) : Math.min(W * 1.7, H * .86 / (IM ? IM.aspect : 1));
    stateCam.length = 0;
    if (IM){ const n = IM.p.length / 3;
      ALL.forEach((i, j) => { const q = (j % n) * 3; const x = mc[0] + IM.p[q] * ms, y = mc[1] + IM.p[q + 1] * ms;
        for (let k = INDIA0; k <= INDIA1; k++) put(SC[k], i, x, y, j >= n ? -.01 : 0); aState[i] = IM.p[q + 2]; });
      geo.attributes.aState.needsUpdate = true;
      for (let k = INDIA0; k <= INDIA1; k++) dotScene[k] = IM.step * ms;
      for (let si = 1; si <= 8; si++){ const c = LB_INDIA.cent[si]; stateCam.push([mc[0] + c[0] * ms, mc[1] + c[1] * ms, Math.max(c[2] * ms, .35)]); }
    }
    /* scene 15: wordmark finale; dust everywhere */
    for (let i = 0; i < N; i++){
      if (dust[i]){ const x = (Math.random() - .5) * W * 2.6, y = (Math.random() - .5) * H * 2.6, z = -3 - Math.random() * 9;
        FILM.forEach(n => put(A[n], i, x, y, z)); for (let k = 1; k <= SCENES; k++) put(SC[k], i, x, y, z); continue; }
      put(A.iS, i, (Math.random() - .5) * W * 2.2, (Math.random() - .5) * H * 2.2, (Math.random() - .5) * 6);
      if (!IM) for (let k = INDIA0; k <= INDIA1; k++) put(SC[k], i, sx + gauss() * W * .3, sy + gauss() * H * .3, 0);
    }
    /* scene 15: the exact LABOURA wordmark, drawn from the logo's own outline on an even dot grid */
    { const sym = document.querySelector('#wm'); const paths = sym ? [...sym.querySelectorAll('path')].map(e => new Path2D(e.getAttribute('d'))) : [];
      const ws = wide ? W * 1.3 : W * 1.84, asp = 148 / 970, cy = wide ? H * .2 : H * .3;
      if (paths.length){
        const g = gridSample(1940, 296, x => { x.scale(2, 2); paths.forEach(pp => x.fill(pp)); }, Math.round(ALL.length * (wide ? .5 : .32)));
        dotScene[15] = place(SC[15], ALL, g, 0, cy - asp * ws / 2, ws, asp);
      } else ALL.forEach((i, j) => { const p = pick(wmPts, j, 5); put(SC[15], i, p[0] * ws, cy + p[1] * ws, 0); });
    }
    hiwGeom = { wide, place, put, cx: wide ? W * .58 : 0, cy: wide ? 0 : H * .5, sz: wide ? H * 1.1 : Math.min(W * 1.2, H * .56) };
    buildHIW();
    FILM.forEach(n => { geo.attributes[n].needsUpdate = true; copyLines(n, A[n]); });
    pairK = -1; setPair(0);
    uniforms.uPix.value = renderer.getPixelRatio();
  }
  const vsh = `
  attribute vec3 p0; attribute vec3 iS; attribute vec3 i0; attribute vec3 i1; attribute vec3 aFrom; attribute vec3 aTo;
  attribute float aType; attribute float aRand; attribute float aDust; attribute vec3 aCol; attribute float aState;
  uniform float uIndia; uniform float uActive;
  uniform float uProg; uniform float uF; uniform float uIntro; uniform float uTime; uniform float uPix; uniform float uSize; uniform float uKnot; uniform vec3 uKnotC;
  uniform float uCrisp; uniform float uDot; uniform vec2 uMouse; uniform float uMR;
  varying float vType; varying float vTw; varying float vR; varying vec3 vCol; varying float vState;
  vec3 I(float k){ if(k<0.5) return iS; if(k<1.5) return i0; if(k<2.5) return i1; if(k<3.5) return p0; return iS; }
  void main(){
    float st = aRand * 0.34;
    float ki = floor(uIntro); float fi = uIntro - ki; float ei = smoothstep(st, st + 0.66, fi);
    vec3 film = mix(I(ki), I(min(ki + 1.0, 4.0)), ei);
    float bi = sin(ei * 3.14159);
    film.z += bi * (aRand - 0.5) * 4.0; film.xy += bi * vec2(sin(aRand * 91.0), cos(aRand * 57.0)) * 0.7;
    float es = smoothstep(st, st + 0.66, uF);
    vec3 scr = mix(aFrom, aTo, es);
    float bs = sin(es * 3.14159) * clamp(length(aTo - aFrom) * 2.0, 0.0, 1.0);   // no burst when the shape stays put (India chapter)
    scr.z += bs * (aRand - 0.5) * 3.2; scr.xy += bs * vec2(sin(aRand * 91.0), cos(aRand * 57.0)) * 0.55;
    float take = smoothstep(0.0, 1.0, clamp(uProg, 0.0, 1.0));
    vec3 pos = mix(film, scr, take);
    float crisp = uCrisp * (1.0 - aDust);
    pos += mix(0.035, 0.004, crisp) * vec3(sin(uTime * .6 + aRand * 40.0), cos(uTime * .5 + aRand * 33.0), sin(uTime * .4 + aRand * 21.0));
    // the cursor (or a finger) gently pushes dots aside
    vec2 dm = pos.xy - uMouse; float dd = length(dm);
    pos.xy += (dm / max(dd, 0.0001)) * smoothstep(uMR, 0.0, dd) * uMR * 0.32 * (1.0 - aDust);
    vec3 q = pos - uKnotC; float a = uTime * 0.22 * uKnot; float c = cos(a), s = sin(a);
    q.xz = vec2(c * q.x - s * q.z, s * q.x + c * q.z); pos = mix(pos, q + uKnotC, uKnot);
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    float sz = mix(uSize * (0.5 + aRand * 0.9), uDot * 12.0, crisp);
    sz *= 1.0 + 0.3 * uIndia * step(abs(aState - uActive), 0.5);
    gl_PointSize = sz * uPix / -mv.z;
    gl_Position = projectionMatrix * mv;
    vCol = aCol; vState = aState; vType = aType; vR = aRand; vTw = mix(0.6 + 0.4 * sin(uTime * 1.4 + aRand * 60.0), 1.0, crisp);
  }`;
  const pmat = new THREE.ShaderMaterial({ uniforms, vertexShader: vsh, transparent: true, depthWrite: false, blending: THREE.NormalBlending,
    fragmentShader: `uniform vec3 uA; uniform vec3 uA2; uniform vec3 uB; uniform vec3 uB2; uniform vec3 uW; uniform float uWarm; uniform float uTint; uniform float uCrisp; uniform float uLogo; uniform float uIndia; uniform float uLitN; uniform float uActive;
    varying float vType; varying float vTw; varying float vR; varying vec3 vCol; varying float vState;
    void main(){ float d = length(gl_PointCoord - 0.5); float a = mix(smoothstep(0.5, 0.18, d), smoothstep(0.5, 0.42, d), uCrisp);
      float g = fract(vR * 7.0) * mix(0.65, 0.35, uCrisp); vec3 ca = mix(uA, uA2, g), cb = mix(uB, uB2, g);
      vec3 col = mix(ca, cb, vType);
      col = mix(col, ca, max(0.0, -uTint)); col = mix(col, cb, max(0.0, uTint));
      col = mix(col, vCol, uLogo);
      float act = step(abs(vState - uActive), 0.5), lit = max(act, step(0.5, vState) * step(8.5, uLitN));
      vec3 grey = vec3(0.66, 0.68, 0.72); vec3 ic = mix(grey, col, lit);
      col = mix(col, ic, uIndia); col = mix(col, uW, uWarm); gl_FragColor = vec4(col, a * vTw * 0.92); }` });
  const lmat = new THREE.ShaderMaterial({ uniforms, vertexShader: vsh, transparent: true, depthWrite: false, blending: THREE.NormalBlending,
    fragmentShader: `uniform vec3 uA; uniform vec3 uB; uniform float uLine; varying float vType;
    void main(){ gl_FragColor = vec4(mix(uA, uB, vType), uLine * 0.28); }` });
  scene.add(new THREE.Points(geo, pmat)); scene.add(new THREE.LineSegments(lgeo, lmat));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4); lgeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4);
  layout();
  if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('800 40px "Unbounded"'), document.fonts.load('800 40px "Host Grotesk"')]).then(() => layout()).catch(() => {});
  let lw = innerWidth, lh = innerHeight;
  addEventListener('resize', () => { if (Math.abs(innerWidth - lw) > 40 || Math.abs(innerHeight - lh) > 160){ lw = innerWidth; lh = innerHeight; layout(); } else { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); } });
  const mouse = { x: 0, y: 0, tx: 0, ty: 0, wx: 99, wy: 99, on: false };
  addEventListener('pointermove', e => { mouse.tx = e.clientX / innerWidth - .5; mouse.ty = e.clientY / innerHeight - .5; mouse.on = true; }, { passive: true });
  addEventListener('pointerleave', () => { mouse.on = false; });
  const camT = { x: 0, y: 0, z: 12 };
  const tmp = new THREE.Vector3();
  function toScreen(v){ tmp.copy(v).project(camera); return [(tmp.x * .5 + .5) * innerWidth, (-tmp.y * .5 + .5) * innerHeight]; }
  return {
    setMode: m => { hiwMode = m; buildHIW(); },
    anchors: () => ({ h1: toScreen(anchors.head1), h2: toScreen(anchors.head2), seek: toScreen(anchors.vSeek), biz: toScreen(anchors.vBiz), core: toScreen(anchors.vCore) }),
    wide: () => wideNow,
    render(prog, intro, t){
      const take = Math.min(Math.max(prog, 0), 1);
      const k = Math.min(Math.floor(prog), SCENES - 1), f = prog >= SCENES ? 1 : prog - k;
      setPair(k);
      /* crisp grid dots while a shape is held: in the film, and on the rings and promise icons */
      const near = Math.round(intro), dist = Math.abs(intro - near);
      const holdF = (near >= 1 && near <= 3) ? 1 - Math.min(dist / .06, 1) : 0;
      const ns = Math.round(prog), ds = Math.abs(prog - ns);
      const crispScene = ns >= 0 && ns <= SCENES && dotScene[ns] > 0;
      const holdS = crispScene ? (ns >= INDIA0 && prog > INDIA0 - .07 && prog < INDIA1 + .07 ? 1 : 1 - Math.min(ds / .07, 1)) : 0;
      const filmW = 1 - Math.min(prog / .6, 1);
      uniforms.uCrisp.value = Math.max(holdF * filmW, holdS * (prog > .4 ? 1 : 0));
      const dw = prog > .4 ? dotScene[Math.min(ns, SCENES)] : (dotFilm[near] || .05);
      uniforms.uDot.value = Math.max(dw, .01) * pxPerWorld * .95;
      uniforms.uProg.value = prog; uniforms.uF.value = f; uniforms.uIntro.value = intro; uniforms.uTime.value = reduce ? 0 : t;
      uniforms.uKnot.value = 0;
      uniforms.uLogo.value = Math.max(0, 1 - Math.abs(prog - 1) * 1.6);
      uniforms.uWarm.value = Math.min(Math.max((prog - 14.3) / 0.6, 0), 1);
      const tint = intro < 1 ? -Math.min(intro, 1) : intro < 2 ? -1 + 2 * Math.min(Math.max((intro - 1) / .7, 0), 1) : intro < 3 ? 1 - Math.min((intro - 2) / .8, 1) : 0;
      const hw = Math.max(0, 1 - Math.max(HIW0 - prog, prog - HIW1, 0) / .6);
      uniforms.uTint.value = tint * filmW + (hiwMode === 'job' ? -1 : 1) * hw * .85;
      uniforms.uLine.value = 0;
      mouse.x += (mouse.tx - mouse.x) * .06; mouse.y += (mouse.ty - mouse.y) * .06;
      const tx = mouse.on ? mouse.x * 2 * W : 99, ty = mouse.on ? -mouse.y * 2 * H : 99;
      mouse.wx += (tx - mouse.wx) * .12; mouse.wy += (ty - mouse.wy) * .12; uniforms.uMouse.value.set(mouse.wx, mouse.wy);
      /* India: light the states one by one and glide the camera to the active one */
      const iw = Math.max(0, 1 - Math.max(INDIA0 - prog, prog - INDIA1, 0) / .6);
      const sf = Math.min(Math.max((prog - INDIA0) / (INDIA1 - INDIA0) * 9, 0), 9), act = Math.round(sf);
      uniforms.uIndia.value = iw; uniforms.uActive.value = act >= 1 && act <= 8 ? act : 99; uniforms.uLitN.value = (act >= 9 || act === 0) ? 9 : 0;   // only the state in view is coloured; all 8 light up at the end
      let tx0 = 0, ty0 = 0, tz0 = 12;
      if (iw > .5 && act >= 1 && act <= 8 && stateCam[act - 1]){ const c = stateCam[act - 1];
        tz0 = Math.min(11, Math.max(7.4, c[2] * 2.6 / Math.tan(THREE.MathUtils.degToRad(21))));
        const viewW = Math.tan(THREE.MathUtils.degToRad(21)) * tz0 * camera.aspect;
        tx0 = c[0] - (wideNow ? viewW * .28 : 0); ty0 = c[1] - (wideNow ? 0 : Math.tan(THREE.MathUtils.degToRad(21)) * tz0 * .3); }
      const now = performance.now(), cdt = Math.min((now - (this._ct || now)) / 1000, .1); this._ct = now; const ce = 1 - Math.exp(-cdt * 2.6);
      camT.x += (tx0 - camT.x) * ce; camT.y += (ty0 - camT.y) * ce; camT.z += (tz0 - camT.z) * ce;
      camera.position.set(camT.x + (reduce ? 0 : mouse.x * 0.5), camT.y + (reduce ? 0 : -mouse.y * 0.3), camT.z); camera.lookAt(camT.x, camT.y, 0);
      renderer.render(scene, camera);
    }
  };
}
hiwTabs.forEach(t => t.addEventListener('click', () => {
  hiwMode = t.dataset.mode; hiw.dataset.mode = hiwMode;
  hiwTabs.forEach(x => { const on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; });
  hiwPaths.forEach(p => p.classList.toggle('on', p.dataset.mode === hiwMode));
  if (gl) gl.setMode(hiwMode);
}));
if (hiw) hiw.dataset.mode = 'job';
let gl = null; try { gl = initGL(); } catch(e){ console.error(e); gl = null; }

function countUp(el){ if (reduce) return;
  el.querySelectorAll('dd[data-n]').forEach(dd => { const to = +dd.dataset.n, t0 = performance.now();
    const step = now => { const k = Math.min((now - t0) / 1300, 1), v = Math.round(to * (1 - Math.pow(1 - k, 3))); dd.textContent = v.toLocaleString('en-IN'); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step); }); }
/* progress follows the scroll with a soft lag, so every move is visible instead of jumping */
let shown = rawProgress(), lastT = performance.now(), last = -1;
function frame(now){
  const dt = Math.min((now - lastT) / 1000, .1); lastT = now;
  const stop = rawStop();
  /* leaving a one-frame stop resets it, so the film never runs through the other promises or states */
  if (stop < 1.05 && pIdx !== 0) pIdx = 0;
  if ((stop < 2.05 || stop > 3.95) && iK !== 0) iK = 0;
  const atP = Math.abs(stop - 2) < .12;
  if (!atP) pStart = now;
  else if (!reduce && now > pPause && now - pStart > ROTATE_MS) setPromise((pIdx + 1) % 5, false);
  const target = toFilm(stop);
  if (Math.abs(target - shown) > 1.2) shown = target;
  shown += (target - shown) * (reduce ? 1 : 1 - Math.exp(-dt * 7));
  if (Math.abs(target - shown) < .0005) shown = target;
  const prog = shown;
  const intro = filmValue(now);
  caps.forEach(c => {
    const d = prog - (+c.dataset.i); const o = Math.max(0, 1 - Math.abs(d) * 2.2);
    c.style.opacity = o; c.style.transform = reduce ? 'none' : `translateY(${d * -70}px)`;
    c.style.pointerEvents = o > .5 ? 'auto' : 'none'; c.inert = o < .5;
    c.classList.toggle('on', Math.abs(d) < .35);
  });
  scrubEls.forEach(s => { const d = prog - 1; const lit = Math.max(0, Math.min(1, (d + .6) / .5)); const n = Math.round(lit * s.spans.length);
    s.spans.forEach((w, i) => { w.classList.toggle('lit', i < n); }); });
  if (hiw){
    const inH = prog > HIW0 - .5 && prog < HIW1 + .5; hiw.classList.toggle('show', inH); hiw.inert = !inH;
    stage.classList.toggle('hiw-on', inH && Math.abs(prog - HIW0) < .45);
  }
  if (panel){
    const inI = prog > INDIA0 - .5 && prog < INDIA1 + .5; panel.classList.toggle('show', inI);
    const sf = Math.min(Math.max((prog - INDIA0) / (INDIA1 - INDIA0) * 9, 0), 9), act = Math.round(sf);
    ips.forEach((el, i) => { const on = inI && i === act; if (on && !el.classList.contains('on')) countUp(el); el.classList.toggle('on', on); el.inert = !on; });
    if (statebar){ statebar.classList.toggle('show', inI);
      sbBtns.forEach(b => { const k = +b.dataset.s; b.classList.toggle('on', k === act); b.classList.toggle('lit', act === 0 || act >= 9); b.setAttribute('aria-pressed', k === act); }); }
  }
  if (dial){
    const vis = prog > PROMISE0 - .6 && prog < PROMISE1 + .6; dial.classList.toggle('show', vis);
    if (dialHint) dialHint.classList.toggle('show', vis && !tapped);
    const act = Math.min(Math.max(Math.round(prog) - PROMISE0, 0), 4);
    const tf = now < pPause ? 1 : Math.min((now - pStart) / ROTATE_MS, 1);
    dialBtns.forEach((b, i) => { const on = i === act; if (on && !b.classList.contains('on') && dial.scrollWidth > dial.clientWidth) dial.scrollTo({ left: b.offsetLeft - 40, behavior: 'smooth' });
      b.classList.toggle('on', on); b.setAttribute('aria-current', on ? 'step' : 'false');
      b.style.setProperty('--fill', on ? tf.toFixed(3) : 0); });
  }
  if (gl){
    const a = gl.anchors(), mid = !gl.wide();
    if (bub1){
      const on1 = intro > 0.97 && intro < 1.25, on2 = intro > 1.97 && intro < 2.25;
      bub1.style.left = (mid ? innerWidth / 2 : a.h1[0]) + 'px'; bub1.style.top = Math.max(a.h1[1] - 10, 132) + 'px'; bub1.classList.toggle('on', on1 && prog < .05);
      bub2.style.left = (mid ? innerWidth / 2 : a.h2[0]) + 'px'; bub2.style.top = (a.h2[1] - 10) + 'px'; bub2.classList.toggle('on', on2 && prog < .05);
      bub1.classList.toggle('mid', mid); bub2.classList.toggle('mid', mid);
    }
    const vOn = Math.abs(prog - 1) < .3;
    [['seek', vennEls.seek], ['biz', vennEls.biz], ['core', vennEls.core]].forEach(([key, el]) => { if (!el) return;
      el.style.left = a[key][0] + 'px'; el.style.top = a[key][1] + 'px'; el.classList.toggle('on', vOn); el.tabIndex = vOn && key !== 'core' ? 0 : -1; });
  }
  const tick = Math.round(stop); if (tick !== last){ ticks.forEach((b, i) => b.classList.toggle('on', i === tick)); last = tick; }
  if (gl && story.getBoundingClientRect().bottom > 0) gl.render(prog, intro, now / 1000);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
})();
