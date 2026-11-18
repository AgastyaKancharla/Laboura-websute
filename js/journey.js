/* Job seekers: one person's journey told in dots, plus the ₹499 slip */
(function(){
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const FONT = '"Unbounded","Arial Black",Arial,sans-serif';
const COL = ['#E06A00', '#0A4FD8', '#000000', '#F5B000', '#C9CBD3'];   /* orange, blue, black, gold, grey */

/* ---------- drawings (same hand as the homepage film) ---------- */
const rr = (x, X, Y, W, H, R) => { x.beginPath(); if (x.roundRect) x.roundRect(X, Y, W, H, R); else x.rect(X, Y, W, H); x.fill(); };
const cut = (x, fn) => { x.globalCompositeOperation = 'destination-out'; fn(); x.globalCompositeOperation = 'source-over'; };
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
  limb([[88, 160], [74, 246]], 30); limb([[74, 246], [69, 322]], 25); oval(68, 336, 13, 17);
  if (variant === 'wave'){ limb([[212, 160], [252, 104]], 30); limb([[252, 104], [262, 36]], 25); oval(264, 20, 13, 17); }
  else if (variant === 'phone'){ limb([[212, 160], [236, 216]], 30); limb([[236, 216], [178, 96]], 25); rr(x, 160, 40, 34, 62, 8); }
  else { limb([[212, 160], [226, 246]], 30); limb([[226, 246], [231, 322]], 25); oval(232, 336, 13, 17); }
  cut(x, () => { x.lineWidth = 5;
    x.beginPath(); x.moveTo(126, 146); x.lineTo(150, 176); x.lineTo(174, 146); x.stroke();
    x.beginPath(); x.moveTo(98, 300); x.lineTo(202, 300); x.stroke(); x.beginPath(); x.moveTo(150, 336); x.lineTo(150, 420); x.stroke(); });
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
const drawPhone = x => { rr(x, 160, 40, 180, 360, 34); cut(x, () => { rr(x, 178, 84, 144, 270, 10); });
  rr(x, 222, 58, 56, 8, 4); x.beginPath(); x.arc(250, 378, 12, 0, Math.PI * 2); x.fill();
  x.save(); x.translate(250, 210); x.rotate(-0.5); rr(x, -44, -14, 88, 28, 12); rr(x, -50, -32, 26, 46, 10); rr(x, 24, -32, 26, 46, 10); x.restore(); };
const drawRings = x => { x.lineWidth = 16; x.lineCap = 'round'; for (const r of [130, 168, 206]){ x.beginPath(); x.arc(250, 220, r, -0.5, 0.5); x.stroke(); x.beginPath(); x.arc(250, 220, r, Math.PI - 0.5, Math.PI + 0.5); x.stroke(); } };
const drawHouse = x => { x.beginPath(); x.moveTo(20, 150); x.lineTo(130, 50); x.lineTo(240, 150); x.closePath(); x.fill(); rr(x, 46, 140, 168, 150, 4); rr(x, 180, 60, 28, 70, 3);
  cut(x, () => { rr(x, 106, 196, 48, 94, 6); rr(x, 64, 168, 34, 34, 4); rr(x, 164, 168, 34, 34, 4); }); };
const text = (lines, size) => x => { x.font = `800 ${size}px ${FONT}`; x.textBaseline = 'alphabetic'; lines.forEach((l, i) => x.fillText(l, 4, size * (0.92 + i * 1.12))); };
const measure = (lines, size) => { const m = document.createElement('canvas').getContext('2d'); m.font = `800 ${size}px ${FONT}`; return Math.ceil(Math.max(...lines.map(l => m.measureText(l).width)) + 10); };

/* even dot grid for several coloured parts that share one dot size */
function sample(w, h, parts, count){
  const masks = parts.map(p => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.strokeStyle = '#fff'; p.draw(x); return x.getImageData(0, 0, w, h).data; });
  let F = 0; masks.forEach(d => { for (let i = 3; i < d.length; i += 4) if (d[i] > 128) F++; });
  let step = Math.max(1.2, Math.sqrt(F / count) * .92), pts = [];
  for (let t = 0; t < 40; t++){
    pts = [];
    for (let y = step / 2; y < h; y += step) for (let xx = step / 2; xx < w; xx += step){ const o = (Math.floor(y) * w + Math.floor(xx)) * 4 + 3;
      for (let k = 0; k < masks.length; k++) if (masks[k][o] > 128){ pts.push([xx / w, y / h, parts[k].col]); break; } }
    if (pts.length <= count) break; step *= 1.03;
  }
  return { pts, w, h, step };
}

/* ---------- the journey ---------- */
const sec = document.querySelector('.jj');
if (sec){
  const cv = sec.querySelector('.jj-cv'), ctx = cv.getContext('2d'), caps = [...sec.querySelectorAll('.jj-caps li')], rail = sec.querySelector('.jj-rail i');
  const low = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 3;
  let W = 0, H = 0, dpr = 1, N = 0, mobile = false, SC = [], dust, rnd, built = false;
  const me = () => window.LB_ME || { verb: 'cook', city: 'Bengaluru' };
  const kind = sec.dataset.kind || 'job';
  const biz = () => { const b = window.LB_BIZ || { n: 2, role: 'cook', plural: 'cooks', salary: 10000 }; return b; };

  function box(){ return mobile ? [W * .06, H * .1, W * .88, H * .4] : [W * .44, H * .12, W * .5, H * .76]; }
  function fit(s, fill = 1){ /* place a sample into the scene box, keeping its shape */
    const [bx, by, bw, bh] = box(); const asp = s.h / s.w; let w = bw * fill, h = w * asp; if (h > bh * fill){ h = bh * fill; w = h / asp; }
    const x0 = bx + (bw - w) / 2, y0 = by + (bh - h) / 2;
    const P = new Float32Array(N * 2), C = new Uint8Array(N);
    for (let i = 0; i < N; i++){ const q = s.pts[i % s.pts.length], dup = i >= s.pts.length;
      P[i * 2] = x0 + q[0] * w + (dup ? (rnd[i] - .5) * .6 : 0); P[i * 2 + 1] = y0 + q[1] * h; C[i] = q[2]; }
    return { P, C, d: s.step / s.w * w };
  }
  function buildJob(n){
    const v = me().verb;
    const verbLines = ['I can', v + '.'];
    const T = 230, tw = measure(verbLines, T), th = Math.round(T * 2.35);
    SC = [
      fit(sample(300, 600, [{ draw: drawPerson('wave'), col: 0 }], n), .96),
      fit(sample(500, 600, [{ draw: x => { x.translate(0, 40); drawPhone(x); }, col: 1 }, { draw: x => { x.translate(0, 40); drawRings(x); }, col: 0 }], n), .9),
      fit(sample(tw, th, [{ draw: text([verbLines[0]], T), col: 2 }, { draw: x => { x.translate(0, T * 1.12); text([verbLines[1]], T)(x); }, col: 0 }], n), mobile ? 1 : .96),
      fit(sample(1000, 520, [
        { draw: x => { x.translate(10, 210); x.scale(.95, .95); drawHouse(x); }, col: 0 },
        { draw: x => { x.translate(600, 140); x.scale(.8, .8); drawShop(x); }, col: 1 },
        { draw: x => { for (let t = 0; t <= 1.0001; t += 1 / 16){ const px = 260 + t * 330, py = 470 - Math.sin(t * Math.PI) * 120; x.beginPath(); x.arc(px, py, 9, 0, Math.PI * 2); x.fill(); } }, col: 2 },
        { draw: x => { x.font = `800 92px ${FONT}`; x.fillText('2 km', 300, 250); }, col: 2 }], n), 1),
      fit(sample(820, 600, [{ draw: x => { x.translate(300, 70); x.scale(1.04, 1.04); drawShop(x); }, col: 1 }, { draw: x => { x.translate(10, 10); x.scale(.98, .98); drawPerson('wave')(x); }, col: 0 }], n), .98),
      fit(sample(measure(['30 days.', '₹499 back.'], T), th, [{ draw: text(['30 days.'], T), col: 2 }, { draw: x => { x.translate(0, T * 1.12); text(['₹499 back.'], T)(x); }, col: 0 }], n), mobile ? 1 : .96)
    ];
  }
  function buildBiz(n){
    const b = biz(), T = 230, word = b.n === 1 ? b.role : b.plural;
    const l1 = [String(b.n)], l2 = [word + '.'], th = Math.round(T * 2.35), TN = T * 2.1;
    const fee = '₹' + Math.round(b.salary / 2).toLocaleString('en-IN'), f2 = b.n > 1 ? '+ GST each' : '+ GST';
    /* people scattered around the shop: the ones inside the ring live close by */
    let seed = 7; const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const folk = []; for (let i = 0; i < 60 && folk.length < 22; i++){ const a = R() * Math.PI * 2, d = 150 + R() * 330; const x = 500 + Math.cos(a) * d * 1.3, y = 330 + Math.sin(a) * d * .6;
      if (x < 40 || x > 960 || y < 70 || y > 600) continue; if (folk.some(f => Math.hypot(f[0] - x, f[1] - y) < 92)) continue; folk.push([x, y, Math.hypot((x - 500) / 1.3, (y - 330) / .6) < 250]); }
    const mini = (x, X, Y) => { x.beginPath(); x.arc(X, Y - 62, 19, 0, Math.PI * 2); x.fill(); rr(x, X - 22, Y - 38, 44, 58, 16); rr(x, X - 19, Y + 16, 16, 36, 6); rr(x, X + 3, Y + 16, 16, 36, 6); };
    SC = [
      fit(sample(500, 460, [{ draw: drawShop, col: 1 }], n), .9),
      fit(sample(500, 600, [{ draw: x => { x.translate(0, 40); drawPhone(x); }, col: 1 }, { draw: x => { x.translate(0, 40); drawRings(x); }, col: 0 }], n), .9),
      fit(sample(Math.max(measure(l1, TN), measure(l2, T)), Math.round(TN * 1.05 + T * 1.25), [{ draw: text(l1, TN), col: 0 }, { draw: x => { x.translate(0, TN * 1.02); text(l2, T)(x); }, col: 2 }], n), mobile ? 1 : .96),
      fit(sample(1000, 640, [
        { draw: x => { x.translate(410, 250); x.scale(.36, .36); drawShop(x); }, col: 1 },
        { draw: x => { x.lineWidth = 12; x.setLineDash([2, 26]); x.lineCap = 'round'; x.beginPath(); x.ellipse(500, 330, 330, 158, 0, 0, Math.PI * 2); x.stroke(); }, col: 2 },
        { draw: x => folk.filter(f => f[2]).forEach(f => mini(x, f[0], f[1])), col: 0 },
        { draw: x => folk.filter(f => !f[2]).forEach(f => mini(x, f[0], f[1])), col: 4 }], n), 1),
      fit(sample(900, 640, [
        { draw: x => { x.translate(0, 40); x.scale(.95, .95); drawPerson('stand')(x); x.translate(300, 0); drawPerson('stand')(x); x.translate(300, 0); drawPerson('stand')(x); }, col: 0 },
        { draw: x => { x.beginPath(); x.arc(450, 70, 62, 0, Math.PI * 2); x.fill(); cut(x, () => { x.lineWidth = 18; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(420, 72); x.lineTo(442, 94); x.lineTo(484, 50); x.stroke(); }); }, col: 1 }], n), .96),
      fit(sample(measure([fee, f2], T), th, [{ draw: text([fee], T), col: 0 }, { draw: x => { x.translate(0, T * 1.12); text([f2], T)(x); }, col: 2 }], n), mobile ? 1 : .96),
      fit(sample(measure(['90 days.', 'Covered.'], T), th, [{ draw: text(['90 days.'], T), col: 2 }, { draw: x => { x.translate(0, T * 1.12); text(['Covered.'], T)(x); }, col: 1 }], n), mobile ? 1 : .96)
    ];
  }
  function build(){
    const n = Math.floor(N * .92);
    if (kind === 'biz') buildBiz(n); else buildJob(n);
    /* the last few dots are always free: they drift like dust */
    for (const s of SC) for (let i = n; i < N; i++){ s.P[i * 2] = dust[i * 2]; s.P[i * 2 + 1] = dust[i * 2 + 1]; s.C[i] = i % 2; }
    built = true;
  }
  function size(){
    const r = cv.getBoundingClientRect(); W = r.width; H = r.height; mobile = innerWidth <= 860; dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    N = low ? 1100 : mobile ? 1700 : 2800;
    rnd = new Float32Array(N); dust = new Float32Array(N * 2);
    for (let i = 0; i < N; i++){ rnd[i] = Math.random(); dust[i * 2] = Math.random() * W; dust[i * 2 + 1] = Math.random() * H; }
    build();
  }
  let lw = innerWidth; addEventListener('resize', () => { if (Math.abs(innerWidth - lw) > 30){ lw = innerWidth; size(); } });
  document.addEventListener(kind === 'biz' ? 'lb:biz' : 'lb:me', () => { if (!built) return; clearTimeout(sec._rb); sec._rb = setTimeout(build, 60); });
  if (document.fonts && document.fonts.load) document.fonts.load(`800 40px ${FONT}`).then(() => built && build()).catch(() => {});
  size();

  let last = -1, t0 = performance.now();
  const groups = [[], [], [], [], []];
  function frame(now){
    requestAnimationFrame(frame);
    const r = sec.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
    const run = sec.offsetHeight - innerHeight, p = reduce ? 0 : clamp(-r.top / run, 0, 1);
    const raw = p * (SC.length - 1), k = Math.min(Math.floor(raw), SC.length - 2), f = raw - k, g = ss(.22, .78, f);
    const on = Math.round(raw); if (on !== last){ last = on; caps.forEach((c, i) => c.classList.toggle('on', i === on)); }
    rail.style.transform = `scaleY(${p})`;
    const A = SC[k], B = SC[k + 1], t = (now - t0) / 1000;
    const dsz = Math.max(1.3, (A.d + (B.d - A.d) * g) * .8);
    groups.forEach(a => a.length = 0);
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < N; i++){
      const delay = rnd[i] * .35, e = ss(delay, delay + .65, g), lift = Math.sin(e * Math.PI) * (40 + rnd[i] * 60);
      let x = A.P[i * 2] + (B.P[i * 2] - A.P[i * 2]) * e, y = A.P[i * 2 + 1] + (B.P[i * 2 + 1] - A.P[i * 2 + 1]) * e - lift * (rnd[i] - .5);
      if (!reduce){ const w = (g > .02 && g < .98) ? 1.2 : .35; x += Math.sin(t * .9 + rnd[i] * 40) * w; y += Math.cos(t * .8 + rnd[i] * 30) * w; }
      const c = e < .5 ? A.C[i] : B.C[i]; groups[c].push(x, y);
    }
    for (let c = 0; c < 5; c++){ const a = groups[c]; if (!a.length) continue; ctx.fillStyle = COL[c]; ctx.beginPath();
      const rad = dsz / 2; for (let j = 0; j < a.length; j += 2){ ctx.moveTo(a[j] + rad, a[j + 1]); ctx.arc(a[j], a[j + 1], rad, 0, 6.2832); } ctx.fill(); }
  }
  requestAnimationFrame(frame);
}

/* ---------- the ₹499 slip prints as you scroll ---------- */
const jt = document.querySelector('.jt');
if (jt){
  const slot = jt.querySelector('.jt-slot'), lines = [...jt.querySelectorAll('.jt-lines li, .jt-total, .jt-stamp')];
  (function loop(){
    const r = slot.getBoundingClientRect(); const p = reduce ? 1 : clamp((innerHeight * .9 - r.top) / (innerHeight * .7), 0, 1);
    jt.style.setProperty('--print', p.toFixed(3));
    lines.forEach((l, i) => l.classList.toggle('on', p > .25 + i * (.7 / lines.length)));
    requestAnimationFrame(loop);
  })();
}
})();
