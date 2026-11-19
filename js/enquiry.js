/* Company enquiry form: job lines with a people counter, a live total, and sending.
   If the form has a data-endpoint (for example a form service URL), the enquiry is posted there.
   Otherwise it opens WhatsApp with the enquiry written out, ready to send. */
(() => {
  const form = document.getElementById('eq-form'); if (!form) return;
  const WA = 'https://wa.me/91XXXXXXXXXX';
  const list = document.getElementById('eq-jobs'), add = document.getElementById('eq-add');
  const err = document.getElementById('eq-err'), done = document.getElementById('eq-done');
  const tot = document.getElementById('eq-total'), totL = document.getElementById('eq-total-l');
  const jn = document.getElementById('eq-jobs-n'), jnL = document.getElementById('eq-jobs-l');
  let uid = 0;

  const line = (role = '', n = 1) => {
    const id = ++uid, li = document.createElement('li');
    li.className = 'eq-job';
    li.innerHTML = `<label class="eq-role"><span class="sr">Job ${id}</span><input list="eq-roles" name="role" autocomplete="off" placeholder="Type or pick a job" required></label>
      <div class="eq-step" role="group" aria-label="How many people">
        <button type="button" class="eq-minus" aria-label="One less">&minus;</button>
        <input type="number" name="count" inputmode="numeric" min="1" max="9999" step="1" aria-label="How many people">
        <button type="button" class="eq-plus" aria-label="One more">+</button>
      </div>
      <button type="button" class="eq-del" aria-label="Remove this job"><span aria-hidden="true">&times;</span></button>`;
    const r = li.querySelector('[name=role]'), c = li.querySelector('[name=count]');
    r.value = role; c.value = n;
    const bump = d => { c.value = Math.max(1, Math.min(9999, (parseInt(c.value, 10) || 0) + d)); li.classList.remove('pop'); void li.offsetWidth; li.classList.add('pop'); sum(); };
    li.querySelector('.eq-minus').addEventListener('click', () => bump(-1));
    li.querySelector('.eq-plus').addEventListener('click', () => bump(1));
    c.addEventListener('input', sum);
    c.addEventListener('blur', () => { c.value = Math.max(1, Math.min(9999, parseInt(c.value, 10) || 1)); sum(); });
    li.querySelector('.eq-del').addEventListener('click', () => { li.classList.add('out'); setTimeout(() => { li.remove(); sum(); (list.querySelector('.eq-job:last-child [name=role]') || add).focus(); }, 220); });
    list.appendChild(li); sum(); return r;
  };

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
    const d = data(), url = form.dataset.endpoint, btn = form.querySelector('.eq-send');
    if (url){
      btn.disabled = true; btn.classList.add('wait');
      try {
        const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ subject: 'Company enquiry: ' + d.company, ...d, jobs: d.jobs.map(j => `${j.role}: ${j.count}`).join(', '), message: text(d) }) });
        if (!r.ok) throw 0;
        finish(d, 'We have your enquiry. Our team will call you back on ' + d.phone + '.');
        return;
      } catch (_) { /* fall back to WhatsApp below */ }
      finally { btn.disabled = false; btn.classList.remove('wait'); }
    }
    window.open(WA + '?text=' + encodeURIComponent(text(d)), '_blank', 'noopener');
    finish(d, 'Your enquiry is ready in WhatsApp. Press send there, and our team will call you back.');
  });

  document.getElementById('eq-again').addEventListener('click', () => {
    form.reset(); list.innerHTML = ''; line(); done.hidden = true; form.hidden = false; form.elements.company.focus();
  });
})();
