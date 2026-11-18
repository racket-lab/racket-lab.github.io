/* Kontaktformular – racket-lab.de
   Versand per FormSubmit an DELIVERY; auf der Seite angezeigt wird nur MAIL (Platzhalter). */
(() => {
  const MAIL = 'max.mustermann@example.com';           // öffentlich angezeigte Adresse
  const DELIVERY = 'tilman.christian@outlook.com';     // echte Empfangsadresse
  const ENDPOINT = `https://formsubmit.co/ajax/${DELIVERY}`;

  const form = document.querySelector('[data-contact]');
  if (!form) return;
  const summary = form.querySelector('[data-error-summary]');
  const list = form.querySelector('[data-error-list]');
  const success = form.querySelector('[data-success]');
  const $ = (id) => form.querySelector('#' + id);

  const rules = [
    { id: 'c-name', test: (el) => el.value.trim().length > 1, msg: 'Bitte gib deinen Namen an.' },
    { id: 'c-email', test: (el) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim()), msg: 'Bitte gib eine gültige E-Mail-Adresse an.' },
    { id: 'c-tel', test: (el) => el.value.replace(/[^\d]/g, '').length >= 6, msg: 'Bitte gib deine Telefonnummer an.' },
    { id: 'c-msg', test: (el) => el.value.trim().length > 4, msg: 'Bitte schreib kurz, worum es geht.' },
    { id: 'c-consent', test: (el) => el.checked, msg: 'Bitte bestätige die Einwilligung.' },
  ];

  const showError = (el, msg) => {
    const err = $(el.id + '-err');
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (err) { err.textContent = msg || ''; err.hidden = !msg; }
  };

  const validate = () => {
    const errors = [];
    rules.forEach((r) => {
      const el = $(r.id);
      const ok = r.test(el);
      showError(el, ok ? '' : r.msg);
      if (!ok) errors.push(r);
    });
    list.innerHTML = errors.map((r) => `<li><a href="#${r.id}">${r.msg}</a></li>`).join('');
    summary.hidden = errors.length === 0;
    if (errors.length) summary.focus();
    return errors.length === 0;
  };

  // Fehler beim Korrigieren live entfernen
  rules.forEach((r) => {
    const el = $(r.id);
    el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', () => {
      if (el.getAttribute('aria-invalid') === 'true' && r.test(el)) showError(el, '');
    });
  });

  const data = () => {
    const fd = new FormData(form);
    return {
      name: (fd.get('name') || '').trim(),
      email: (fd.get('email') || '').trim(),
      telefon: (fd.get('telefon') || '').trim(),
      nachricht: (fd.get('nachricht') || '').trim(),
    };
  };

  const text = (d) => [
    d.nachricht, '',
    '— Kontakt —',
    `Name: ${d.name}`, `E-Mail: ${d.email}`, `Telefon: ${d.telefon}`,
  ].join('\n');

  const done = (title, msg) => {
    if (title) success.querySelector('[data-success-title]').textContent = title;
    if (msg) success.querySelector('[data-success-text]').textContent = msg;
    form.classList.add('is-sent');
    success.hidden = false;
    success.focus();
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const d = data();
    const subject = `Kontaktanfrage von ${d.name}`;

    const btn = form.querySelector('[type=submit]');
    const label = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = 'Wird gesendet …';
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: subject, _template: 'box', _captcha: 'false', _replyto: d.email,
          Name: d.name, 'E-Mail': d.email, Telefon: d.telefon, Nachricht: d.nachricht,
        }),
      });
      const json = await res.json();
      if (!res.ok || String(json.success) !== 'true') throw new Error(json.message || res.status);
      done();
    } catch {
      btn.disabled = false;
      btn.innerHTML = label;
      list.innerHTML = `<li>Das Senden hat leider nicht geklappt. Bitte versuch es noch einmal oder schreib direkt an <a href="mailto:${MAIL}">${MAIL}</a>.</li>`;
      summary.hidden = false;
      summary.focus();
    }
  });
})();
