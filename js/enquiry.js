/* Company enquiry form: job lines with a people counter, a live total, and sending.
   If the form has a data-endpoint (for example a form service URL), the enquiry is posted there.
   Otherwise it opens WhatsApp with the enquiry written out, ready to send. */
(() => {
  const form = document.getElementById('eq-form'); if (!form) return;
  const WA = 'https://wa.me/917483919241';
  const list = document.getElementById('eq-jobs'), add = document.getElementById('eq-add');
  const err = document.getElementById('eq-err'), done = document.getElementById('eq-done');
  const tot = document.getElementById('eq-total'), totL = document.getElementById('eq-total-l');
  const jn = document.getElementById('eq-jobs-n'), jnL = document.getElementById('eq-jobs-l');
  let uid = 0;

  const line = (role = '', n = 1) => {
    const id = ++uid, li = document.createElement('li');
    li.className = 'eq-job';
    li.innerHTML = `<label class="eq-role"><span class="sr">Job ${id}</span><input name="role" autocomplete="off" placeholder="Tap to pick a job, or type" required role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="eq-pick-${id}"><ul class="eq-pick" id="eq-pick-${id}" role="listbox" hidden></ul></label>
      <div class="eq-step" role="group" aria-label="How many people">
        <button type="button" class="eq-minus" aria-label="One less">&minus;</button>
        <input type="number" name="count" inputmode="numeric" min="1" max="9999" step="1" aria-label="How many people">
        <button type="button" class="eq-plus" aria-label="One more">+</button>
      </div>
      <button type="button" class="eq-del" aria-label="Remove this job"><span aria-hidden="true">&times;</span></button>`;
    const r = li.querySelector('[name=role]'), c = li.querySelector('[name=count]');
    r.value = role; c.value = n;
    picker(r, li.querySelector('.eq-pick'));
    const bump = d => { c.value = Math.max(1, Math.min(9999, (parseInt(c.value, 10) || 0) + d)); li.classList.remove('pop'); void li.offsetWidth; li.classList.add('pop'); sum(); };
    li.querySelector('.eq-minus').addEventListener('click', () => bump(-1));
    li.querySelector('.eq-plus').addEventListener('click', () => bump(1));
    c.addEventListener('input', sum);
    c.addEventListener('blur', () => { c.value = Math.max(1, Math.min(9999, parseInt(c.value, 10) || 1)); sum(); });
    li.querySelector('.eq-del').addEventListener('click', () => { li.classList.add('out'); setTimeout(() => { li.remove(); sum(); (list.querySelector('.eq-job:last-child [name=role]') || add).focus(); }, 220); });
    list.appendChild(li); sum(); return r;
  };

  /* Job picker: a list that opens on tap and filters as you type (the built-in
     datalist shows nothing on many Android phones until you type). */
  const ROLES = [...document.querySelectorAll('#eq-roles option')].map(o => o.value);
  function picker(input, box){
    let items = [], at = -1, quiet = 0;
    const show = () => {
      if (Date.now() < quiet) return;
      const q = input.value.trim().toLowerCase();
      const exact = ROLES.some(r => r.toLowerCase() === q);
      items = ROLES.filter(r => !q || exact || r.toLowerCase().includes(q));
      if (q && !exact) items.push('__own__');
      at = -1;
      box.innerHTML = items.map((r, i) => r === '__own__'
        ? `<li role="option" id="${box.id}-${i}" class="own">Use "${input.value.trim().replace(/[<>&"]/g, '')}"</li>`
        : `<li role="option" id="${box.id}-${i}">${r}</li>`).join('');
      box.hidden = !items.length; input.setAttribute('aria-expanded', String(!box.hidden));
    };
    const hide = () => { box.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); };
    const pick = (i, tap) => { if (items[i] && items[i] !== '__own__') input.value = items[i]; quiet = Date.now() + 400; hide(); input.removeAttribute('aria-invalid'); if (tap) input.blur(); };
    const mark = i => { at = (i + items.length) % items.length; [...box.children].forEach((li, k) => li.classList.toggle('on', k === at));
      const el = box.children[at]; if (el){ el.scrollIntoView({ block: 'nearest' }); input.setAttribute('aria-activedescendant', el.id); } };
    input.addEventListener('focus', show);
    input.addEventListener('click', () => { if (box.hidden) show(); });
    input.addEventListener('input', show);
    input.addEventListener('blur', () => setTimeout(hide, 150));
    input.addEventListener('keydown', e => {
      if (box.hidden && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { show(); e.preventDefault(); return; }
      if (box.hidden) return;
      if (e.key === 'ArrowDown') { mark(at + 1); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { mark(at - 1); e.preventDefault(); }
      else if (e.key === 'Enter' && at >= 0) { pick(at); e.preventDefault(); }
      else if (e.key === 'Escape') hide();
    });
    box.addEventListener('pointerdown', e => e.preventDefault());   // keep the input focused while tapping
    box.addEventListener('click', e => { const li = e.target.closest('li'); if (li) pick([...box.children].indexOf(li), true); });
  }

  function sum(){
    const rows = [...list.querySelectorAll('.eq-job:not(.out)')];
    const people = rows.reduce((a, li) => a + Math.max(0, parseInt(li.querySelector('[name=count]').value, 10) || 0), 0);
    tot.textContent = people.toLocaleString('en-IN'); totL.textContent = people === 1 ? 'person' : 'people';
    jn.textContent = rows.length; jnL.textContent = rows.length === 1 ? 'job' : 'jobs';
    list.classList.toggle('one', rows.length < 2);
  }

  add.addEventListener('click', () => line().focus());
  line();

  const phone = form.elements.phone;
  phone.addEventListener('input', () => { phone.value = phone.value.replace(/[^\d]/g, '').slice(0, 10); });

  const fail = (el, msg) => { err.textContent = msg; err.hidden = false; el.setAttribute('aria-invalid', 'true'); el.focus(); return false; };
  const check = () => {
    form.querySelectorAll('[aria-invalid]').forEach(x => x.removeAttribute('aria-invalid')); err.hidden = true;
    const f = form.elements;
    if (!f.company.value.trim()) return fail(f.company, 'Please write your company name.');
    if (!f.name.value.trim()) return fail(f.name, 'Please write your name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.value.trim())) return fail(f.email, 'Please check the email address.');
    if (!/^[6-9]\d{9}$/.test(phone.value)) return fail(phone, 'Please write a 10-digit mobile number.');
    for (const r of list.querySelectorAll('[name=role]')) if (!r.value.trim()) return fail(r, 'Please write the job for every line, or remove the empty line.');
    return true;
  };

  const data = () => {
    const f = form.elements;
    const jobs = [...list.querySelectorAll('.eq-job')].map(li => ({ role: li.querySelector('[name=role]').value.trim(), count: parseInt(li.querySelector('[name=count]').value, 10) || 1 }));
    return { company: f.company.value.trim(), name: f.name.value.trim(), email: f.email.value.trim(), phone: '+91 ' + phone.value, jobs,
             total: jobs.reduce((a, j) => a + j.count, 0) };
  };

  const text = d => ['Company enquiry from the Laboura website', '', 'Company: ' + d.company, 'Name: ' + d.name, 'Email: ' + d.email, 'Phone: ' + d.phone, '',
    'Jobs:', ...d.jobs.map(j => `- ${j.role}: ${j.count} ${j.count === 1 ? 'person' : 'people'}`), '', `Total: ${d.total} ${d.total === 1 ? 'person' : 'people'}`].join('\n');

  const finish = (d, msg) => {
    document.getElementById('eq-who').textContent = d.name.split(' ')[0];
    document.getElementById('eq-done-msg').textContent = msg;
    form.hidden = true; done.hidden = false; done.focus();
  };

  form.addEventListener('submit', async e => {
    e.preventDefault(); if (!check()) return;
    const d = data(), btn = form.querySelector('.eq-send');
    const wa = document.getElementById('eq-wa');
    if (wa) wa.href = WA + '?text=' + encodeURIComponent(text(d));
    if (window.LB_LEADS && LB_LEADS.on){
      btn.disabled = true; btn.classList.add('wait');
      try {
        await LB_LEADS.send('enquiry', { company: d.company, name: d.name, email: d.email, phone: d.phone,
          jobs: d.jobs.map(j => `${j.role}: ${j.count}`).join(', '), total: d.total, website: (form.elements.website || {}).value || '' });
        if (wa) wa.hidden = false;
        finish(d, 'We have your enquiry. Our team will call you back on ' + d.phone + ' within 24 hours.');
        return;
      } catch (_) { /* not saved: fall back to WhatsApp below */ }
      finally { btn.disabled = false; btn.classList.remove('wait'); }
    }
    if (wa) wa.hidden = true;
    window.open(WA + '?text=' + encodeURIComponent(text(d)), '_blank', 'noopener');
    finish(d, 'Your enquiry is ready in WhatsApp. Press send there, and our team will call you back.');
  });

  document.getElementById('eq-again').addEventListener('click', () => {
    form.reset(); list.innerHTML = ''; line(); done.hidden = true; form.hidden = false; form.elements.company.focus();
  });
})();
