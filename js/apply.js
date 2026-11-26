/* Short "Get a job / Hire staff" form (apply.html).
   Saves to the Laboura Leads Google Sheet (kind "jobseeker" or "staff"); if saving fails,
   it offers WhatsApp with the details written out. ?for=job or ?for=staff picks a side. */
(() => {
  const form = document.getElementById('ap-form'); if (!form) return;
  const WA = 'https://wa.me/917483919241';
  const APP_LIVE = false;   /* switch on when the app is on the Play Store and App Store */
  const err = document.getElementById('ap-err'), done = document.getElementById('ap-done');
  const parts = [...form.querySelectorAll('.ap-part')], sumBar = form.querySelector('.ap-sum');
  const ROLES = [...document.querySelectorAll('#ap-roles option')].map(o => o.value);
  const f = form.elements;

  const side = () => (form.querySelector('[name=want]:checked') || {}).value || '';
  const choose = v => {
    parts.forEach(p => { p.hidden = p.dataset.for !== v; });
    sumBar.hidden = !v;
    form.querySelector('.eq-send').textContent = v === 'staff' ? 'Send my staff request' : 'Send my details';
    err.hidden = true;
  };
  form.querySelectorAll('[name=want]').forEach(r => r.addEventListener('change', () => {
    choose(r.value);
    const first = form.querySelector(`.ap-part[data-for="${r.value}"] input`);
    if (first) setTimeout(() => first.focus({ preventScroll: true }), 50);
  }));
  const pre = new URLSearchParams(location.search).get('for');
  if (pre === 'job' || pre === 'staff') { form.querySelector(`[name=want][value=${pre}]`).checked = true; choose(pre);
    const role = new URLSearchParams(location.search).get('role');
    if (role) (pre === 'job' ? f.jrole : f.srole).value = role.slice(0, 60); }

  /* job picker: opens on tap, filters as you type, keeps your own words */
  function picker(input, box){
    let items = [], quiet = 0;
    const show = () => {
      if (Date.now() < quiet) return;
      const q = input.value.trim().toLowerCase();
      const exact = ROLES.some(r => r.toLowerCase() === q);
      items = ROLES.filter(r => !q || exact || r.toLowerCase().includes(q));
      if (q && !exact) items.push('__own__');
      box.innerHTML = items.map((r, i) => r === '__own__'
        ? `<li role="option" id="${box.id}-${i}" class="own">Use "${input.value.trim().replace(/[<>&"]/g, '')}"</li>`
        : `<li role="option" id="${box.id}-${i}">${r}</li>`).join('');
      box.hidden = !items.length; input.setAttribute('aria-expanded', String(!box.hidden));
    };
    const hide = () => { box.hidden = true; input.setAttribute('aria-expanded', 'false'); };
    input.addEventListener('focus', show);
    input.addEventListener('click', () => { if (box.hidden) show(); });
    input.addEventListener('input', () => { show(); other(input); });
    input.addEventListener('blur', () => setTimeout(hide, 150));
    input.addEventListener('keydown', e => { if (e.key === 'Escape') hide(); });
    box.addEventListener('pointerdown', e => e.preventDefault());
    box.addEventListener('click', e => {
      const li = e.target.closest('li'); if (!li) return;
      const it = items[[...box.children].indexOf(li)];
      if (it && it !== '__own__') input.value = it;
      quiet = Date.now() + 400; hide(); input.removeAttribute('aria-invalid'); input.blur(); other(input);
    });
  }
  /* "Others": show a box to type the job that is not in the list */
  function other(input){
    const box = (input === f.jrole ? f.jother : f.sother).closest('.ap-other');
    const on = input.value.trim().toLowerCase() === 'others';
    box.hidden = !on; if (on) setTimeout(() => box.querySelector('input').focus(), 60);
  }
  const roleOf = (input, extra) => input.value.trim().toLowerCase() === 'others' ? 'Other: ' + extra.value.trim() : input.value.trim();
  picker(f.jrole, document.getElementById('ap-pick-j'));
  picker(f.srole, document.getElementById('ap-pick-s'));

  const cnt = f.scount;
  const bump = d => { cnt.value = Math.max(1, Math.min(999, (parseInt(cnt.value, 10) || 0) + d)); };
  form.querySelector('.eq-minus').addEventListener('click', () => bump(-1));
  form.querySelector('.eq-plus').addEventListener('click', () => bump(1));
  cnt.addEventListener('blur', () => bump(0));
  [f.jphone, f.sphone].forEach(p => p.addEventListener('input', () => { p.value = p.value.replace(/[^\d]/g, '').slice(0, 10); }));

  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/, PHONE = /^[6-9]\d{9}$/;
  const fail = (el, msg) => { err.textContent = msg; err.hidden = false; if (el.setAttribute) el.setAttribute('aria-invalid', 'true'); (el.focus ? el : form).focus(); return false; };
  const check = v => {
    form.querySelectorAll('[aria-invalid]').forEach(x => x.removeAttribute('aria-invalid')); err.hidden = true;
    if (!v) return fail(form.querySelector('[name=want]'), 'Please choose: I need a job, or I need staff.');
    if (v === 'job') {
      if (!f.jname.value.trim()) return fail(f.jname, 'Please write your name.');
      if (!PHONE.test(f.jphone.value)) return fail(f.jphone, 'Please write a 10-digit mobile number.');
      if (!f.jrole.value.trim()) return fail(f.jrole, 'Please pick the job you want to apply for.');
      if (f.jrole.value.trim().toLowerCase() === 'others' && !f.jother.value.trim()) return fail(f.jother, 'Please type the job you want.');
      if (!form.querySelector('[name=exp]:checked')) return fail(form.querySelector('[name=exp]'), 'Please choose your experience.');
      if (!f.jarea.value.trim()) return fail(f.jarea, 'Please tell us where you stay.');
      if (f.jemail.value.trim() && !EMAIL.test(f.jemail.value.trim())) return fail(f.jemail, 'Please check the email address, or leave it empty.');
    } else {
      if (!f.sname.value.trim()) return fail(f.sname, 'Please write your name.');
      if (!f.sbiz.value.trim()) return fail(f.sbiz, 'Please write your business name.');
      if (!PHONE.test(f.sphone.value)) return fail(f.sphone, 'Please write a 10-digit mobile number.');
      if (!f.srole.value.trim()) return fail(f.srole, 'Please pick the staff you need.');
      if (f.srole.value.trim().toLowerCase() === 'others' && !f.sother.value.trim()) return fail(f.sother, 'Please type the staff you need.');
      if (!f.sarea.value.trim()) return fail(f.sarea, 'Please tell us where your business is.');
      if (f.semail.value.trim() && !EMAIL.test(f.semail.value.trim())) return fail(f.semail, 'Please check the email address, or leave it empty.');
    }
    return true;
  };

  const data = v => v === 'job'
    ? { name: f.jname.value.trim(), phone: '+91 ' + f.jphone.value, role: roleOf(f.jrole, f.jother),
        experience: form.querySelector('[name=exp]:checked').value, area: f.jarea.value.trim(), email: f.jemail.value.trim() }
    : { name: f.sname.value.trim(), business: f.sbiz.value.trim(), phone: '+91 ' + f.sphone.value, role: roleOf(f.srole, f.sother),
        count: parseInt(cnt.value, 10) || 1, area: f.sarea.value.trim(), email: f.semail.value.trim() };

  const text = (v, d) => (v === 'job'
    ? ['Hi Laboura, I need a job.', '', 'Name: ' + d.name, 'Phone: ' + d.phone, 'Job: ' + d.role, 'Experience: ' + d.experience, 'Area: ' + d.area]
    : ['Hi Laboura, I need staff.', '', 'Name: ' + d.name, 'Business: ' + d.business, 'Phone: ' + d.phone, 'Staff: ' + d.role + ' x ' + d.count, 'Area: ' + d.area]
  ).concat(d.email ? ['Email: ' + d.email] : []).join('\n');

  const finish = (v, d) => {
    document.getElementById('ap-who').textContent = d.name.split(' ')[0];
    document.getElementById('ap-done-msg').textContent = v === 'job'
      ? `We have received your details. Our team will call you on ${d.phone} within 24 hours.`
      : `We have received your staff request. Our team will call you on ${d.phone} within 24 hours.`;
    document.getElementById('ap-wa').href = WA + '?text=' + encodeURIComponent(text(v, d));
    document.querySelector('.ap-app').hidden = !APP_LIVE;
    form.hidden = true; done.hidden = false; done.focus();
  };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const v = side(); if (!check(v)) return;
    const d = data(v), btn = form.querySelector('.eq-send');
    btn.disabled = true; btn.classList.add('wait');
    try {
      if (window.LB_LEADS && LB_LEADS.on)
        await LB_LEADS.send(v === 'job' ? 'jobseeker' : 'staff', Object.assign({ website: (f.website || {}).value || '' }, d));
    } catch (_) { /* the WhatsApp button on the next screen carries the same details */ }
    finally { btn.disabled = false; btn.classList.remove('wait'); }
    finish(v, d);
  });

  document.getElementById('ap-again').addEventListener('click', () => {
    form.reset(); choose(''); form.querySelectorAll('.ap-other').forEach(x => x.hidden = true); done.hidden = true; form.hidden = false;
  });
})();
