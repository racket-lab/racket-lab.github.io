/* Tuning-Simulator – racket-lab.de
   Gewicht an 5 Positionen verändern und sehen, wie sich die 4 Kennwerte verändern.
   Physik (Punktmassen-Näherung, Schlägerlänge 68,6 cm):
     Gewicht:      m' = m + Δm
     Balance:      b' = (m·b + Δm·x) / (m + Δm)                x = Abstand vom Griffende
     Swingweight:  SW' = SW + Δm·(x − 10)²   [kg·cm²]          Drehachse 10 cm über dem Griffende
     Twistweight:  TW' = TW + Δm·r²          [kg·cm²]          r = Abstand zur Längsachse
*/
(() => {
  const root = document.querySelector('[data-tsim]');
  if (!root) return;

  const BASE = { m: 300, b: 32.5, sw: 300, tw: 14.5 };          // Beispielschläger (besaitet)
  const POS = {                                                 // x = cm ab Griffende, r = cm zur Längsachse
    '12':    { x: 67.5, r: 0 },
    '39':    { x: 52,   r: 12.3 },                               // Gewicht verteilt auf beide Seiten
    '6':     { x: 37,   r: 0 },
    'heart': { x: 30,   r: 0 },
    'grip':  { x: 5,    r: 0 },
  };
  const MIN = -10, MAX = 10;
  const val = Object.fromEntries(Object.keys(POS).map((k) => [k, 0]));

  const fmt = (n, d = 0) => n.toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });
  const sign = (n, d = 0) => (n > 0 ? '+' : n < 0 ? '−' : '±') + fmt(Math.abs(n), d);

  function compute() {
    let m = BASE.m, mom = BASE.m * BASE.b, sw = BASE.sw, tw = BASE.tw;
    for (const [k, g] of Object.entries(val)) {
      const { x, r } = POS[k], kg = g / 1000;
      m += g; mom += g * x;
      sw += kg * (x - 10) ** 2;
      tw += kg * r * r;
    }
    return { weight: m, balance: mom / m, sw, tw };
  }

  /* ---------- results ---------- */
  const RES = {
    weight:  { base: BASE.m,  dec: 0, ddec: 0, scale: 50, up: 'schwerer, stabiler', down: 'leichter, wendiger' },
    balance: { base: BASE.b,  dec: 1, ddec: 1, scale: 2.5, up: 'kopflastiger', down: 'grifflastiger' },
    sw:      { base: BASE.sw, dec: 0, ddec: 0, scale: 65, up: 'mehr Wucht im Schwung', down: 'leichter zu schwingen' },
    tw:      { base: BASE.tw, dec: 1, ddec: 1, scale: 2,  up: 'stabiler bei Off-Center-Treffern', down: 'verdreht leichter' },
  };
  const resEls = Object.fromEntries([...root.querySelectorAll('[data-res]')].map((li) => [li.dataset.res, {
    li, v: li.querySelector('[data-v]'), d: li.querySelector('[data-d]'), bar: li.querySelector('[data-bar]'), note: li.querySelector('[data-note]'),
  }]));

  function renderResults() {
    const now = compute();
    for (const [k, cfg] of Object.entries(RES)) {
      const e = resEls[k]; if (!e) continue;
      const delta = now[k] - cfg.base;
      const shown = Math.abs(delta) < (cfg.ddec ? 0.05 : 0.5) ? 0 : delta;
      e.v.textContent = fmt(now[k], cfg.dec);
      e.d.textContent = shown === 0 ? 'unverändert' : sign(shown, cfg.ddec);
      e.li.dataset.dir = shown > 0 ? 'up' : shown < 0 ? 'down' : 'flat';
      const pct = Math.max(-1, Math.min(1, delta / cfg.scale)) * 50;
      e.bar.style.left = (pct < 0 ? 50 + pct : 50) + '%';
      e.bar.style.width = Math.abs(pct) + '%';
      e.note.textContent = shown === 0 ? '' : shown > 0 ? cfg.up : cfg.down;
    }
  }

  /* ---------- knobs ---------- */
  const ARC_R = 26, SWEEP = 135;                               // ±135° für ±10 g
  const pt = (deg) => { const a = (deg - 90) * Math.PI / 180; return [32 + ARC_R * Math.cos(a), 32 + ARC_R * Math.sin(a)]; };
  function arcPath(v) {
    if (!v) return '';
    const end = (v / MAX) * SWEEP;
    const [x0, y0] = pt(0), [x1, y1] = pt(end);
    return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${ARC_R} ${ARC_R} 0 ${Math.abs(end) > 180 ? 1 : 0} ${end > 0 ? 1 : 0} ${x1.toFixed(2)} ${y1.toFixed(2)}`;
  }

  const knobs = [...root.querySelectorAll('[data-knob]')];
  const marks = [...root.querySelectorAll('[data-mark]')];

  function set(key, v) {
    v = Math.max(MIN, Math.min(MAX, Math.round(v)));
    if (val[key] === v) return;
    val[key] = v;
    renderKnob(key);
    renderResults();
  }

  function renderKnob(key) {
    const v = val[key];
    const k = root.querySelector(`[data-knob="${key}"]`);
    const label = (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v) + ' g';
    k.setAttribute('aria-valuenow', v);
    k.setAttribute('aria-valuetext', `${v > 0 ? 'plus ' : v < 0 ? 'minus ' : ''}${Math.abs(v)} Gramm`);
    k.querySelector('.knob-arc').setAttribute('d', arcPath(v));
    k.querySelector('.knob-ptr').style.transform = `rotate(${(v / MAX) * SWEEP}deg)`;
    k.dataset.dir = v > 0 ? 'up' : v < 0 ? 'down' : 'flat';
    const row = k.closest('.knob-row'); row.dataset.dir = k.dataset.dir;
    root.querySelector(`[data-val="${key}"]`).textContent = label;
    marks.filter((m) => m.dataset.mark === key).forEach((m) => {
      m.dataset.dir = k.dataset.dir;
      // 3 und 9 Uhr: Gewicht teilt sich auf beide Seiten
      const each = key === '39' ? v / 2 : v;
      m.querySelector('b').textContent = v ? (each > 0 ? '+' : '−') + fmt(Math.abs(each), Number.isInteger(each) ? 0 : 1) + ' g' : '';
      m.style.setProperty('--s', (1 + Math.abs(v) / MAX * 0.9).toFixed(2));
    });
  }

  knobs.forEach((k) => {
    const key = k.dataset.knob;
    // ziehen: nach oben = mehr, nach unten = weniger (12 px pro Gramm)
    let startY = 0, startV = 0, dragging = false;
    k.addEventListener('pointerdown', (e) => {
      dragging = true; startY = e.clientY; startV = val[key];
      k.setPointerCapture(e.pointerId); k.classList.add('is-drag'); k.focus({ preventScroll: true });
      e.preventDefault();
    });
    k.addEventListener('pointermove', (e) => { if (dragging) set(key, startV + (startY - e.clientY) / 12); });
    const end = () => { dragging = false; k.classList.remove('is-drag'); };
    k.addEventListener('pointerup', end); k.addEventListener('pointercancel', end);
    k.addEventListener('wheel', (e) => { if (document.activeElement !== k) return; e.preventDefault(); set(key, val[key] + (e.deltaY < 0 ? 1 : -1)); }, { passive: false });
    k.addEventListener('keydown', (e) => {
      const map = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 5, PageDown: -5 };
      if (e.key in map) { e.preventDefault(); set(key, val[key] + map[e.key]); }
      else if (e.key === 'Home') { e.preventDefault(); set(key, MIN); }
      else if (e.key === 'End') { e.preventDefault(); set(key, MAX); }
      else if (e.key === '0' || e.key === 'Delete') { e.preventDefault(); set(key, 0); }
    });
    k.addEventListener('dblclick', () => set(key, 0));
    k.closest('.knob-row').querySelectorAll('[data-step]').forEach((b) =>
      b.addEventListener('click', () => set(key, val[key] + Number(b.dataset.step))));
    renderKnob(key);
  });

  root.querySelector('[data-reset]').addEventListener('click', () => {
    Object.keys(val).forEach((k) => { val[k] = 0; renderKnob(k); });
    renderResults();
  });

  renderResults();
})();
