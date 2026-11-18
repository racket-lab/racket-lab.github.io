/* Booking form: one service, service-specific options, live price summary, validation, e-mail delivery */
(() => {
  const form = document.querySelector('[data-booking]');
  if (!form) return;
  const $ = (s, r = form) => r.querySelector(s);
  const $$ = (s, r = form) => [...r.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- delivery ----------
     Versand über FormSubmit (formsubmit.co) an DELIVERY – ohne Mailprogramm beim Besucher.
     Die erste Nachricht löst eine einmalige Aktivierungsmail an DELIVERY aus.
     Auf der Seite angezeigt wird nur MAIL (Platzhalter). */
  const MAIL = 'max.mustermann@example.com';           // öffentlich angezeigte Adresse
  const DELIVERY = 'tilman.christian@outlook.com';     // echte Empfangsadresse
  const ENDPOINT = `https://formsubmit.co/ajax/${DELIVERY}`;

  /* ---------- prices (EUR) – change here ---------- */
  const PRICE = {
    stringOwn: 25,          // stringing per racket, customer brings the string
    stringOurs: 30,         // stringing per racket incl. our standard string
    stringCombo: -5,        // per racket, when stringing right after matching/tuning
    addConsult30: 25,       // 30 min consulting as add-on (stringing or matching)
    addConsult60: 45,       // 60 min consulting as add-on (tuning)
    matchingPerRacket: 30,  // matching per racket (min. 2)
    tuningPerRacket: 40,    // tuning per racket
    consult30: 30,          // consulting only: 30 min stringing questions
    consult60: 50,          // consulting only: 60 min play analysis & racket optimisation
  };
  const eur = (n) => `${n.toLocaleString('de-DE')} €`;
  $$('[data-price="consult30"]').forEach((el) => { el.textContent = `+${eur(PRICE.addConsult30)}`; });
  $$('[data-price="consult60"]').forEach((el) => { el.textContent = `+${eur(PRICE.addConsult60)}`; });

  const services = $$('input[name="leistung"]');
  const service = () => (services.find((s) => s.checked) || {}).value || '';
  const labelOf = (v) => services.find((s) => s.value === v).dataset.label;
  const val = (name) => (form.elements[name] && form.elements[name].value) || '';
  const yes = (name) => val(name) === 'ja';
  const wishRequired = () => service() === 'tuning' && !yes('t_beratung');

  /* ---------- preselect via hash, e.g. buchen.html#matching ---------- */
  const preselect = () => {
    const hit = services.find((s) => s.value === location.hash.slice(1));
    if (hit) hit.checked = true;
  };
  preselect();
  window.addEventListener('hashchange', () => { preselect(); update(); });

  /* ---------- date: no past days ---------- */
  const today = new Date();
  $('#datum').min = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  /* ---------- racket count stepper ---------- */
  const anzahl = $('#anzahl');
  const minRackets = () => (service() === 'matching' ? 2 : 1);
  const count = () => Math.min(12, Math.max(minRackets(), parseInt(anzahl.value, 10) || minRackets()));
  $$('[data-step]').forEach((b) => b.addEventListener('click', () => {
    anzahl.value = Math.min(12, Math.max(minRackets(), count() + parseInt(b.dataset.step, 10)));
    update();
  }));
  anzahl.addEventListener('blur', () => { anzahl.value = count(); update(); });

  /* ---------- line items ---------- */
  function items() {
    const s = service(), n = count(), out = [];
    const stringing = (combo) => {
      const own = yes('saite');
      const unit = (own ? PRICE.stringOwn : PRICE.stringOurs) + (combo ? PRICE.stringCombo : 0);
      out.push({ label: `Besaitung · ${own ? 'eigene Saite' : 'ausgewählte Saite'}${combo ? ' · Kombi-Preis' : ''}`, qty: n, unit });
    };
    if (s === 'besaitung') {
      stringing(false);
      if (yes('b_beratung')) out.push({ label: '30 Min. Besaitungs-Beratung', qty: 1, unit: PRICE.addConsult30 });
    }
    if (s === 'matching') {
      out.push({ label: 'Schläger-Matching', qty: n, unit: PRICE.matchingPerRacket });
      if (yes('m_beratung')) out.push({ label: '30 Min. Beratung', qty: 1, unit: PRICE.addConsult30 });
      if (yes('besaiten')) stringing(true);
    }
    if (s === 'tuning') {
      if (yes('t_beratung')) out.push({ label: '60 Min. Beratung', qty: 1, unit: PRICE.addConsult60 });
      out.push({ label: 'Schläger-Tuning', qty: n, unit: PRICE.tuningPerRacket });
      if (yes('besaiten')) stringing(true);
    }
    if (s === 'beratung') {
      out.push(val('dauer') === '30'
        ? { label: '30 Min. Beratung · Besaitungsfragen', qty: 1, unit: PRICE.consult30 }
        : { label: '60 Min. Beratung · Spielanalyse & Schläger-Optimierung', qty: 1, unit: PRICE.consult60 });
    }
    return out;
  }
  const total = (list) => list.reduce((sum, i) => sum + i.qty * i.unit, 0);

  /* ---------- UI update ---------- */
  const sumList = document.querySelector('[data-sum-list]');
  const sumAnzahl = document.querySelector('[data-sum-anzahl]');
  const sumTermin = document.querySelector('[data-sum-termin]');
  const sumTotal = document.querySelector('[data-sum-total]');
  const sumPrice = document.querySelector('[data-sum-price]');
  const fmtDate = (v) => v ? new Date(v + 'T12:00').toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
  const terminText = () => {
    const zeiten = $$('input[name="zeit"]:checked').map((c) => c.value);
    const datum = fmtDate($('#datum').value);
    const flex = $('#flexibel').checked;
    let t = [datum, zeiten.join('/')].filter(Boolean).join(', ') || (flex ? 'flexibel' : 'offen');
    if (flex && (datum || zeiten.length)) t += ' (flexibel)';
    return t;
  };

  function update() {
    const s = service();
    const stringingActive = s === 'besaitung' || ((s === 'matching' || s === 'tuning') && yes('besaiten'));
    $$('[data-show-for]').forEach((el) => {
      let show = el.dataset.showFor.split(' ').includes(s);
      if (el.hasAttribute('data-show-if-stringing')) show = stringingActive;
      el.hidden = !show;
    });
    $('[data-details-empty]').hidden = !!s;
    if (s === 'matching' && (parseInt(anzahl.value, 10) || 1) < 2) anzahl.value = 2;
    $('[data-matching-hint]').hidden = s !== 'matching';
    $('[data-saite-help]').textContent = `Ohne eigene Saite wird nach Absprache mit einer ausgewählten Saite besaitet (+${eur(PRICE.stringOurs - PRICE.stringOwn)} pro Schläger).`;

    // wishes: required for tuning without consulting
    const req = wishRequired();
    $('[data-wish-opt]').hidden = req;
    $('[data-wish-req]').hidden = !req;
    $('#wuensche').required = req;
    $('[data-wish-help]').textContent = req
      ? 'Ohne Beratung sind deine Angaben wichtig: Was soll sich am Schläger verändern (z. B. mehr Kontrolle, mehr Komfort), welcher Schläger, welches Spielniveau, welche Beschwerden?'
      : 'Alles, was bei der Vorbereitung hilft – z. B. Besaitungshärte, Saitentyp, Schlägermodell oder Spielniveau.';
    if (!req && !$('#wuensche-err').hidden) validate('wuensche');

    const list = items();
    sumList.innerHTML = list.length
      ? list.map((i) => `<li><span class="sum-line"><strong>${i.label}</strong><b>${eur(i.qty * i.unit)}</b></span>${i.qty > 1 ? `<span>${i.qty} × ${eur(i.unit)}</span>` : ''}</li>`).join('')
      : '<li class="sum-empty">Noch keine Leistung gewählt.</li>';
    sumTotal.hidden = !list.length;
    sumPrice.textContent = eur(total(list));
    sumAnzahl.textContent = s && s !== 'beratung' ? `${count()} Schläger` : '–';
    sumTermin.textContent = terminText();
  }

  /* ---------- validation ---------- */
  const rules = {
    leistung: () => (!service() ? 'Bitte wähle eine Leistung.' : ''),
    wuensche: () => (wishRequired() && form.elements.wuensche.value.trim().length < 10
      ? 'Ohne Beratung braucht es ein paar Angaben: Was wünschst du dir vom Tuning?' : ''),
    name: () => (form.elements.name.value.trim().length < 2 ? 'Bitte gib deinen Namen ein.' : ''),
    email: () => {
      const v = form.elements.email.value.trim();
      if (!v) return 'Bitte gib deine E-Mail-Adresse ein.';
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'Bitte prüfe die E-Mail-Adresse, z. B. name@beispiel.de.';
    },
    telefon: () => {
      const digits = form.elements.telefon.value.replace(/\D/g, '');
      if (!digits) return 'Bitte gib deine Telefonnummer ein.';
      return digits.length < 6 ? 'Bitte prüfe die Telefonnummer.' : '';
    },
    consent: () => (!form.elements.consent.checked ? 'Bitte bestätige die Einwilligung, damit eine Antwort möglich ist.' : ''),
  };
  const focusTarget = { leistung: services[0], wuensche: form.elements.wuensche, name: form.elements.name, email: form.elements.email, telefon: form.elements.telefon, consent: form.elements.consent };
  function validate(key) {
    const msg = rules[key]();
    const err = $(`#${key}-err`);
    err.textContent = msg; err.hidden = !msg;
    if (key !== 'leistung') focusTarget[key].setAttribute('aria-invalid', msg ? 'true' : 'false');
    return msg;
  }
  ['wuensche', 'name', 'email', 'telefon'].forEach((k) => {
    const el = form.elements[k];
    el.addEventListener('blur', () => { if (el.value || k === 'wuensche' && wishRequired()) validate(k); });
    el.addEventListener('input', () => { if (el.getAttribute('aria-invalid') === 'true') validate(k); });
  });
  form.elements.consent.addEventListener('change', () => validate('consent'));
  services.forEach((s) => s.addEventListener('change', () => { if (!$('#leistung-err').hidden) validate('leistung'); }));

  form.addEventListener('input', update);
  form.addEventListener('change', update);
  update();

  const summaryBox = $('[data-error-summary]');
  summaryBox.addEventListener('click', (e) => {
    const a = e.target.closest('a'); if (!a || !a.getAttribute('href').startsWith('#')) return;
    e.preventDefault();
    const el = focusTarget[a.getAttribute('href').slice(1)];
    el.focus(); el.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  /* ---------- summary text for the e-mail ---------- */
  function summaryText() {
    const f = form.elements, s = service(), list = items();
    const line = '────────────────────────────';
    const out = ['NEUE BUCHUNGSANFRAGE – racket-lab.de', line, '', 'LEISTUNG', labelOf(s)];
    if (s !== 'beratung') out.push(`Anzahl Schläger: ${count()}`);
    if (s === 'tuning') {
      out.push(`60 Min. Beratung vorab: ${yes('t_beratung') ? 'ja' : 'nein'}`);
    }
    if (s === 'matching') out.push(`30 Min. Beratung vorab: ${yes('m_beratung') ? 'ja' : 'nein'}`);
    if (s === 'matching' || s === 'tuning') out.push(`Anschließend besaiten: ${yes('besaiten') ? 'ja' : 'nein – Rückgabe unbesaitet'}`);
    if (s === 'besaitung' || ((s === 'matching' || s === 'tuning') && yes('besaiten'))) out.push(`Eigene Saite: ${yes('saite') ? 'ja' : 'nein (ausgewählte Saite nach Absprache)'}`);
    if (s === 'besaitung') out.push(`30 Min. Besaitungs-Beratung: ${yes('b_beratung') ? 'ja' : 'nein'}`);
    out.push('', 'PREIS (Richtpreis)');
    list.forEach((i) => out.push(`• ${i.label}: ${i.qty > 1 ? `${i.qty} × ${eur(i.unit)} = ` : ''}${eur(i.qty * i.unit)}`));
    out.push(`= Gesamt: ${eur(total(list))}`);
    out.push('', 'WÜNSCHE UND ANGABEN', f.wuensche.value.trim() || '–');
    out.push('', 'WUNSCHTERMIN', terminText());
    out.push('', 'KONTAKT', `Name: ${f.name.value.trim()}`, `E-Mail: ${f.email.value.trim()}`, `Telefon: ${f.telefon.value.trim()}`);
    out.push('', line, 'Gesendet über das Buchungsformular auf racket-lab.de');
    return out.join('\n');
  }

  /* ---------- submit ---------- */
  const btn = form.querySelector('.book-submit button');
  const showSuccess = (title, text) => {
    form.classList.add('is-sent');
    const ok = $('[data-success]');
    $('[data-success-title]', ok).textContent = title;
    $('[data-success-text]', ok).textContent = text;
    ok.hidden = false; ok.focus();
    ok.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errors = Object.keys(rules).map((k) => [k, validate(k)]).filter(([, m]) => m);
    if (errors.length) {
      summaryBox.querySelector('ul').innerHTML = errors.map(([k, m]) => `<li><a href="#${k}">${m}</a></li>`).join('');
      summaryBox.hidden = false; summaryBox.focus();
      return;
    }
    summaryBox.hidden = true;
    const f = form.elements, s = service();
    const subject = `Buchungsanfrage: ${labelOf(s)} – ${f.name.value.trim()}`;
    const text = summaryText();

    btn.disabled = true;
    const label = btn.innerHTML;
    btn.textContent = 'Wird gesendet …';
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: subject, _template: 'box', _captcha: 'false', _replyto: f.email.value.trim(),
          Name: f.name.value.trim(), 'E-Mail': f.email.value.trim(), Telefon: f.telefon.value.trim(), Anfrage: text,
        }),
      });
      const data = await res.json();
      if (!res.ok || String(data.success) !== 'true') throw new Error(data.message || 'send failed');
      showSuccess('Danke für deine Anfrage!', 'Deine Anfrage ist angekommen. Du bekommst persönlich einen Terminvorschlag.');
    } catch (err) {
      btn.disabled = false; btn.innerHTML = label;
      summaryBox.querySelector('ul').innerHTML = `<li>Das Senden hat leider nicht geklappt. Bitte versuche es erneut oder schreib an <a href="mailto:${MAIL}">${MAIL}</a>.</li>`;
      summaryBox.hidden = false; summaryBox.focus();
    }
  });
})();
