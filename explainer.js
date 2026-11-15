/* Kennwerte-Animationen – racket-lab.de (v2)
   Echter Schläger (Freisteller) auf Sandplatz-Bühne, weiche Physik-Bewegungen,
   HTML-Readout mit Wert + typischem Bereich.
   Usage: <div class="xp-frame" data-explainer="static|balance|swing|twist"></div> */
(() => {
  const IMG = 'assets/img/racket-cutout.webp';
  // Freisteller-Geometrie (px im Bild): Griffende-Mitte als Ursprung, Schläger zeigt nach oben
  const R = { w: 347, h: 900, buttX: 174.6, buttY: 890, headCy: 229.9, headRx: 169.1, headRy: 230.7 };
  const PX_CM = R.buttY / 68.6;                                   // 27 Zoll Schlägerlänge
  const MONO = 'IBM Plex Mono, monospace';
  let uid = 0;

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const easeOut = (x) => 1 - Math.pow(1 - x, 3);
  const easeIn = (x) => x * x * x;
  const easeInOut = (x) => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const easeOutBack = (x) => { const c = 1.4; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  const lerp = (a, b, x) => a + (b - a) * x;
  const rad = (d) => (d * Math.PI) / 180;
  const de = (n, d = 0) => n.toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });

  /* ---------- shared drawing ---------- */
  // Draufsicht: echter Rahmen (Freisteller) + fein gezeichnete Bespannung 16×19 ohne Logo
  const racket = (strings = true) => {
    let s = '';
    if (strings) {
      const id = 'xpstr' + (uid++);
      const cx = 172.5 - R.buttX, cy = R.headCy - R.buttY, rx = 155, ry = 217;
      let d = '';
      for (let i = 0; i < 16; i++) { const x = cx - rx * .94 + (i * 2 * rx * .94) / 15; d += `M${x.toFixed(1)},${(cy - ry).toFixed(1)}V${(cy + ry).toFixed(1)}`; }
      for (let j = 0; j < 19; j++) { const y = cy - ry * .95 + (j * 2 * ry * .95) / 18; d += `M${(cx - rx).toFixed(1)},${y.toFixed(1)}H${(cx + rx).toFixed(1)}`; }
      s += `<clipPath id="${id}"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/></clipPath>` +
           `<g clip-path="url(#${id})"><path d="${d}" transform="translate(2.5 3)" stroke="#2a120a" stroke-opacity=".28" stroke-width="2.6" fill="none"/>` +
           `<path d="${d}" stroke="#f4f1ec" stroke-opacity=".92" stroke-width="2.2" fill="none"/></g>`;
    }
    return s + `<image href="${IMG}" x="${-R.buttX}" y="${-R.buttY}" width="${R.w}" height="${R.h}"/>`;
  };

  // Seitenansicht (Profil) in cm, Ursprung = Griffende, Schläger zeigt nach +x
  const profile = (k, id) => {
    const P = (cm) => (cm * k).toFixed(1);
    const half = (cm) => (cm * k / 2).toFixed(1);
    // Kontur: Griffkappe 0–0,6 | Griff 0,6–19 (3,0 cm) | Übergang 19–22 | Hals 22–34 (2,2) | Kopf 34–68,6 (2,4)
    const top = [[0, 1.6], [0.6, 1.6], [0.6, 1.5], [19, 1.5], [22, 1.1], [34, 1.1], [36, 1.2], [67.6, 1.2], [68.6, .55]];
    let d = `M0,${-half(3.2)}`;
    top.forEach(([x, h]) => { d += `L${P(x)},${(-h * k).toFixed(1)}`; });
    [...top].reverse().forEach(([x, h]) => { d += `L${P(x)},${(h * k).toFixed(1)}`; });
    d += 'Z';
    let wraps = '';
    for (let x = 1.6; x < 18.6; x += 1.45) wraps += `M${P(x)},${(-1.5 * k).toFixed(1)}L${P(x + .9)},${(1.5 * k).toFixed(1)}`;
    return `<defs><linearGradient id="${id}fr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#ece9e4"/><stop offset="1" stop-color="#c3bdb5"/></linearGradient>
        <linearGradient id="${id}gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d98454"/><stop offset=".5" stop-color="#c0673d"/><stop offset="1" stop-color="#94492a"/></linearGradient>
        <clipPath id="${id}gc"><rect x="${P(.6)}" y="${(-1.5 * k).toFixed(1)}" width="${P(18.4)}" height="${(3 * k).toFixed(1)}" rx="${(.5 * k).toFixed(1)}"/></clipPath></defs>
      <path d="${d}" fill="url(#${id}fr)" stroke="#8f877e" stroke-opacity=".35" stroke-width="1.2" stroke-linejoin="round"/>
      <rect x="${P(.6)}" y="${(-1.5 * k).toFixed(1)}" width="${P(18.4)}" height="${(3 * k).toFixed(1)}" rx="${(.5 * k).toFixed(1)}" fill="url(#${id}gr)"/>
      <path d="${wraps}" clip-path="url(#${id}gc)" stroke="#7a3a1f" stroke-opacity=".45" stroke-width="${Math.max(1, .09 * k).toFixed(1)}"/>
      <rect x="0" y="${-half(3.2)}" width="${P(.7)}" height="${(3.2 * k).toFixed(1)}" rx="${(.35 * k).toFixed(1)}" fill="#e8e3dc" stroke="#8f877e" stroke-opacity=".4"/>
      <path d="M${P(36.5)},0H${P(67)}" stroke="#a49c92" stroke-opacity=".55" stroke-width="${Math.max(1, .18 * k).toFixed(1)}" stroke-dasharray="${Math.max(1, .12 * k).toFixed(1)} ${(.7 * k).toFixed(1)}"/>`;
  };
  const shadowFilter = (id, o = {}) =>
    `<filter id="${id}" x="-40%" y="-40%" width="180%" height="180%" color-interpolation-filters="sRGB">` +
    `<feDropShadow data-r="${o.ref || 'sh'}" dx="${o.dx ?? 10}" dy="${o.dy ?? 14}" stdDeviation="${o.sd ?? 9}" flood-color="#2a120a" flood-opacity="${o.op ?? .38}"/></filter>`;

  const stage = () => {
    const i = uid++;
    return `<svg viewBox="0 0 1600 900" aria-hidden="true" preserveAspectRatio="xMidYMid slice"><defs>
      <linearGradient id="xpb${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b8734f"/><stop offset=".55" stop-color="#a5603f"/><stop offset="1" stop-color="#8a4b33"/></linearGradient>
      <radialGradient id="xpl${i}" cx="28%" cy="18%" r="70%"><stop offset="0" stop-color="#ffd9b8" stop-opacity=".32"/><stop offset=".6" stop-color="#ffd9b8" stop-opacity="0"/></radialGradient>
      <radialGradient id="xpv${i}" cx="50%" cy="50%" r="75%"><stop offset=".6" stop-color="#1f0c06" stop-opacity="0"/><stop offset="1" stop-color="#1f0c06" stop-opacity=".42"/></radialGradient>
      <filter id="xpg${i}"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 .2  0 0 0 0 .08  0 0 0 0 .03  0 0 0 .5 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
      <filter id="xpg2${i}"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="3" seed="3"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 .85  0 0 0 0 .7  0 0 0 .16 -.02"/></filter>
    </defs>
    <rect width="1600" height="900" fill="url(#xpb${i})"/>
    <rect width="1600" height="900" filter="url(#xpg2${i})"/>
    <rect width="1600" height="900" fill="#000" filter="url(#xpg${i})" opacity=".55"/>
    <path d="M-60,812 L1660,598" stroke="#f4ece3" stroke-opacity=".5" stroke-width="18"/>
    <path d="M-60,812 L1660,598" stroke="#a5603f" stroke-opacity=".25" stroke-width="18" stroke-dasharray="3 9"/>
    <rect width="1600" height="900" fill="url(#xpl${i})"/>
    <rect width="1600" height="900" fill="url(#xpv${i})"/></svg>`;
  };

  /* ---------- scenes ---------- */
  const SCENES = {
    /* 01 – Statisches Gewicht: Schläger senkt sich auf die Waage, Anzeige zählt hoch */
    static: {
      title: 'Statisches Gewicht', duration: 7.2, still: 3.6,
      read: { k: 'Statisches Gewicht', unit: 'g', min: 285, max: 340, dec: 0 },
      build(f) {
        const s = .82, bx = 435, by = 452;
        let a = `<defs>${shadowFilter(f)}${shadowFilter(f + 'd', { ref: 'shd', dx: 0, dy: 18, sd: 22, op: .35 })}
          <linearGradient id="${f}sc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf7f1"/><stop offset="1" stop-color="#e8ddd0"/></linearGradient>
          <linearGradient id="${f}pl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".9"/><stop offset="1" stop-color="#f1e8dd" stop-opacity=".9"/></linearGradient></defs>`;
        a += `<g data-r="dev"><g filter="url(#${f}d)"><rect x="370" y="270" width="860" height="390" rx="46" fill="url(#${f}sc)"/></g>`;
        a += `<rect x="372" y="272" width="856" height="386" rx="44" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="2"/>`;
        a += `<rect x="398" y="296" width="804" height="270" rx="28" fill="url(#${f}pl)" stroke="#1f1a17" stroke-opacity=".08" stroke-width="2"/>`;
        a += `<rect x="660" y="580" width="280" height="62" rx="14" fill="#1f1a17"/>`;
        a += `<rect x="663" y="583" width="274" height="56" rx="12" fill="none" stroke="#fff" stroke-opacity=".06"/>`;
        a += `<text data-r="disp" x="916" y="622" font-family="${MONO}" font-size="34" font-weight="500" fill="#d6f03c" text-anchor="end" letter-spacing="1">0 g</text>`;
        a += `<circle data-r="led" cx="688" cy="611" r="7" fill="#d6f03c" opacity=".35"/></g>`;
        a += `<g data-r="rk"><g filter="url(#${f})"><g transform="translate(${bx} ${by}) rotate(90) scale(${s})">${racket()}</g></g></g>`;
        return a;
      },
      tick(r, t) {
        // 0..1 = in der Luft, 0 = liegt auf der Waage
        const down = easeOutBack(seg(t, .5, 1.7));
        const up = easeIn(seg(t, 5.4, 6.4));
        const h = clamp(1 - down + up, 0, 1.2);
        const cx = 800, cy = 452, sc = 1 + .14 * h;
        r.rk.setAttribute('transform', `translate(${-30 * h} ${-46 * h}) translate(${cx} ${cy}) scale(${sc}) translate(${-cx} ${-cy})`);
        r.rk.setAttribute('opacity', clamp(1.25 - h * 1.1));
        r.sh.setAttribute('dx', 10 + 70 * h); r.sh.setAttribute('dy', 14 + 90 * h);
        r.sh.setAttribute('stdDeviation', 9 + 26 * h); r.sh.setAttribute('flood-opacity', .38 - .2 * clamp(h));
        // Waage gibt minimal nach
        const dip = Math.exp(-Math.max(0, t - 1.45) / .18) * (t > 1.45 ? Math.sin((t - 1.45) * 28) : 0);
        r.dev.setAttribute('transform', `translate(800 465) scale(${1 - .006 * dip}) translate(-800 -465)`);
        let g = 0;
        if (t > 1.5 && t < 5.6) {
          const k = seg(t, 1.5, 2.6);
          g = 318 * easeOut(k);
          if (k >= 1) g = 318 + (t < 2.9 ? Math.round(Math.sin(t * 40)) : 0);
        }
        const shown = Math.round(g);
        r.disp.textContent = `${shown} g`;
        r.led.setAttribute('opacity', shown > 0 ? .95 : .35);
        return g > 0 ? g : null;
      },
    },

    /* 02 – Balance: Seitenansicht wie auf dem Tisch – der Auflagepunkt wandert, bis der Schläger waagerecht liegt */
    balance: {
      title: 'Balance', duration: 9, still: 5,
      read: { k: 'Balance', unit: 'cm', min: 31, max: 34.5, dec: 1, top: true },
      build(f) {
        const k = 14.6, bx = 300, board = 560, tipH = 64;          // px/cm, Griffende x, Tischkante y, Höhe der Schneide
        const ay = board - tipH - 1.1 * k;                          // Schlägerachse (liegt mit der Unterkante auf der Schneide)
        let a = `<defs>${shadowFilter(f, { dx: 0, dy: 16, sd: 8, op: .32 })}${shadowFilter(f + 't', { ref: 'sht', dx: 0, dy: 10, sd: 10, op: .35 })}
          <linearGradient id="${f}tb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf8f4"/><stop offset="1" stop-color="#e2d6c8"/></linearGradient>
          <linearGradient id="${f}kn" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d9cdbf"/><stop offset=".5" stop-color="#fbf8f4"/><stop offset="1" stop-color="#cfc1b1"/></linearGradient></defs>`;
        // Tisch / Messbrett mit Skala
        a += `<g filter="url(#${f}t)"><rect x="200" y="${board}" width="1200" height="34" rx="6" fill="url(#${f}tb)"/></g>`;
        let ticks = '';
        for (let c = 0; c <= 68; c++) { const x = bx + c * k, big = c % 10 === 0, mid = c % 5 === 0; ticks += `M${x.toFixed(1)},${board + 2}v${big ? 18 : mid ? 12 : 7}`; }
        a += `<path d="${ticks}" stroke="#1f1a17" stroke-opacity=".45" stroke-width="1.6"/>`;
        for (let c = 0; c <= 60; c += 10) a += `<text x="${(bx + c * k).toFixed(1)}" y="${board + 62}" font-family="${MONO}" font-size="24" fill="#fbf8f4" text-anchor="middle" opacity=".85">${c}</text>`;
        // Schneide (Auflagepunkt)
        a += `<g data-r="knife"><path d="M0,${board - tipH} L-30,${board} H30 Z" fill="url(#${f}kn)" stroke="#1f1a17" stroke-opacity=".15" stroke-linejoin="round"/>`;
        a += `<path data-r="guide" d="M0,${board + 26}V${board + 40}" stroke="#d6f03c" stroke-width="3" opacity="0"/></g>`;
        // Schläger im Profil
        a += `<g data-r="rk"><g filter="url(#${f})"><g transform="translate(${bx} ${ay})">${profile(k, f)}</g></g></g>`;
        a += `<g data-r="mark"><rect x="-92" y="${board + 84}" width="184" height="52" rx="26" fill="#d6f03c"/><text data-r="markt" x="0" y="${board + 119}" font-family="${MONO}" font-size="26" font-weight="500" fill="#1f1a17" text-anchor="middle">32,9 cm</text></g>`;
        this._g = { k, bx, ay, board, tipH };
        return a;
      },
      tick(r, t) {
        const { k, bx, ay, board, tipH } = this._g;
        const BAL = 32.9, F0 = 25;
        const go = easeInOut(seg(t, .9, 3.6)), back = easeInOut(seg(t, 7.6, 8.8));
        const fpos = lerp(F0, BAL, go * (1 - back));
        const px = bx + fpos * k;
        // liegt der Auflagepunkt vor dem Schwerpunkt, kippt der Kopf, bis die Spitze den Tisch berührt
        const reach = (68.6 - fpos) * k;
        const maxAng = Math.asin(clamp((tipH) / reach, 0, 1)) * 180 / Math.PI;
        const lift = 1 - easeInOut(seg(BAL - fpos, 0, .9));        // 0 = liegt auf, 1 = frei
        let ang = maxAng * (1 - lift);
        const tb = 3.6;
        if (t > tb && t < 7.6) ang += 1.6 * Math.exp(-(t - tb) / .6) * Math.sin(2 * Math.PI * (t - tb) / 1.05);
        r.rk.setAttribute('transform', `rotate(${ang.toFixed(3)} ${px.toFixed(1)} ${board - tipH})`);
        r.knife.setAttribute('transform', `translate(${px.toFixed(1)} 0)`);
        const balanced = seg(t, 3.4, 3.9) * (1 - seg(t, 7.4, 7.8));
        r.guide.setAttribute('opacity', balanced.toFixed(2));
        r.mark.setAttribute('transform', `translate(${px.toFixed(1)} 0)`);
        r.mark.setAttribute('opacity', (.4 + .6 * balanced).toFixed(2));
        r.markt.textContent = `${de(fpos, 1)} cm`;
        return fpos;
      },
    },

    /* 03 – Swingweight: Pendel um die Achse 10 cm über dem Griffende, parallel zur Bespannung –
       der Schläger schwingt mit der Schlagfläche voran (Seitenansicht wie im Messgerät) */
    swing: {
      title: 'Swingweight', duration: 5.2, still: 1.3,
      read: { k: 'Swingweight', unit: 'kg·cm²', min: 280, max: 340, dec: 0 },
      build(f) {
        const k = 10.4, px = 800, py = 128;
        const arm = (68.6 - 10) * k;
        let a = `<defs>${shadowFilter(f, { dx: 6, dy: 12, sd: 7, op: .3 })}
          <linearGradient id="${f}cl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a332f"/><stop offset="1" stop-color="#1f1a17"/></linearGradient></defs>`;
        const A = 34;
        const p0 = [px - arm * Math.sin(rad(A)), py + arm * Math.cos(rad(A))], p1 = [px + arm * Math.sin(rad(A)), py + arm * Math.cos(rad(A))];
        a += `<path d="M${p0[0].toFixed(1)},${p0[1].toFixed(1)} A${arm.toFixed(1)},${arm.toFixed(1)} 0 0 0 ${p1[0].toFixed(1)},${p1[1].toFixed(1)}" fill="none" stroke="#fbf8f4" stroke-opacity=".4" stroke-width="2.5" stroke-dasharray="2 10" stroke-linecap="round"/>`;
        // Halterung oben
        a += `<rect x="${px - 120}" y="${py - 96}" width="240" height="26" rx="8" fill="url(#${f}cl)"/><rect x="${px - 14}" y="${py - 74}" width="28" height="60" fill="url(#${f}cl)"/>`;
        // Schläger hängt nach unten: Profil um 90° gedreht, Achse 10 cm über dem Griffende
        const rk = (ghost) => `<g transform="translate(${px} ${py}) rotate(90) translate(${-10 * k} 0)">${ghost ? `<rect x="0" y="${-1.4 * k}" width="${68.6 * k}" height="${2.8 * k}" rx="${k}" fill="#fbf8f4"/>` : profile(k, f + 'p')}</g>`;
        for (let i = 5; i >= 1; i--) a += `<g data-r="g${i}" opacity="0">${rk(true)}</g>`;
        a += `<g data-r="rk"><g filter="url(#${f})">${rk(false)}</g></g>`;
        // Klemme + Achse
        a += `<g transform="translate(${px} ${py})"><rect x="-30" y="-26" width="60" height="52" rx="10" fill="url(#${f}cl)" stroke="#fff" stroke-opacity=".1"/>` +
             `<circle data-r="pulse" r="18" fill="none" stroke="#d6f03c" stroke-width="2"/><circle r="9" fill="#1f1a17" stroke="#d6f03c" stroke-width="3"/><circle r="3" fill="#d6f03c"/></g>`;
        a += `<g transform="translate(${px + 54} ${py + 4})"><rect x="0" y="-27" width="282" height="52" rx="26" fill="#1f1a17" fill-opacity=".55"/><text x="24" y="8" font-family="${MONO}" font-size="22" fill="#fbf8f4" letter-spacing="1">ACHSE · 10 CM</text></g>`;
        this._g = { px, py, A };
        return a;
      },
      tick(r, t) {
        const { px, py, A } = this._g;
        const T = 2.6, th = (tt) => A * Math.sin((2 * Math.PI * tt) / T);
        r.rk.setAttribute('transform', `rotate(${th(t).toFixed(3)} ${px} ${py})`);
        const speed = Math.abs(Math.cos((2 * Math.PI * t) / T));
        for (let i = 1; i <= 5; i++) {
          r['g' + i].setAttribute('transform', `rotate(${th(t - i * .04).toFixed(3)} ${px} ${py})`);
          r['g' + i].setAttribute('opacity', (speed * (.16 - i * .028)).toFixed(3));
        }
        const pk = (t % 1.3) / 1.3;
        r.pulse.setAttribute('r', 14 + 22 * pk); r.pulse.setAttribute('opacity', (1 - pk) * .8);
        return 300;
      },
    },
    /* 04 – Twistweight: exzentrischer Treffer verdreht den Schläger – mit Gewicht bei 3/9 Uhr deutlich weniger */
    twist: {
      title: 'Twistweight', duration: 10, still: 4.6,
      read: { k: 'Twistweight', unit: 'kg·cm²', min: 13, max: 16, dec: 1 },
      chip: true,
      build(f) {
        const s = .78, cx = 800, by = 866;
        const hy = by - (R.buttY - R.headCy) * s, hrx = R.headRx * s;
        let a = `<defs>${shadowFilter(f, { dx: 10, dy: 16, sd: 10, op: .36 })}${shadowFilter(f + 'b', { ref: 'shb', dx: 8, dy: 14, sd: 6, op: .35 })}
          <radialGradient id="${f}ball" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#f4ff9a"/><stop offset=".55" stop-color="#d6f03c"/><stop offset="1" stop-color="#9fb520"/></radialGradient>
          <mask id="${f}m" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="1600" height="900"><g transform="translate(${cx} ${by}) scale(${s})">${racket(false)}</g></mask></defs>`;
        a += `<g data-r="rk"><g filter="url(#${f})"><g transform="translate(${cx} ${by}) scale(${s})">${racket()}</g>`;
        a += `<g data-r="wt" opacity="0"><rect x="${(cx + hrx - 12).toFixed(1)}" y="${(hy - 30).toFixed(1)}" width="11" height="60" rx="4" fill="#d6f03c" stroke="#1f1a17" stroke-opacity=".35"/>` +
             `<rect x="${(cx - hrx + 1).toFixed(1)}" y="${(hy - 30).toFixed(1)}" width="11" height="60" rx="4" fill="#d6f03c" stroke="#1f1a17" stroke-opacity=".35"/></g></g>`;
        a += `<rect data-r="shade" x="${cx - 200}" y="80" width="400" height="800" fill="#2a120a" opacity="0" mask="url(#${f}m)"/></g>`;
        a += `<g data-r="ball" opacity="0"><g filter="url(#${f}b)"><circle r="26" fill="url(#${f}ball)"/></g>` +
             `<path d="M-19,-17 q15,17 0,34 M19,-17 q-15,17 0,34" stroke="#fbf8f4" stroke-width="2.4" fill="none" opacity=".85"/></g>`;
        this._g = { cx, hy, hrx };
        return a;
      },
      tick(r, t, ui) {
        const { cx, hy, hrx } = this._g;
        const hits = [[1.3, 58], [6.2, 22]];
        let phi = 0, bx = 0, bop = 0, bs = 1;
        for (const [ti, A] of hits) {
          if (t >= ti) { const d = t - ti; phi += A * Math.exp(-d / .5) * Math.sin((2 * Math.PI * d) / .72); }
          const hitX = cx + hrx * .72;
          if (t >= ti - .55 && t < ti) { const k = easeIn(seg(t, ti - .55, ti)); bx = lerp(1720, hitX + 26, k); bop = 1; bs = 1; }
          if (t >= ti && t < ti + 1.1) { const k = seg(t, ti, ti + 1.1); bx = lerp(hitX + 26, 1500, easeOut(k)); bop = 1 - easeIn(k); bs = 1 - .15 * k; }
        }
        const p = rad(phi), c = Math.cos(p);
        r.rk.setAttribute('transform', `translate(${cx} 0) scale(${c.toFixed(4)} 1) translate(${-cx} 0)`);
        r.shade.setAttribute('opacity', (.55 * Math.abs(Math.sin(p))).toFixed(3));
        r.sh.setAttribute('dx', (10 + 36 * Math.sin(p)).toFixed(2));
        r.ball.setAttribute('transform', `translate(${bx.toFixed(1)} ${hy}) scale(${bs.toFixed(3)})`);
        r.ball.setAttribute('opacity', bop.toFixed(3));
        const w = seg(t, 3.9, 4.5) * (1 - seg(t, 9.2, 9.8));
        r.wt.setAttribute('opacity', w.toFixed(3));
        r.wt.setAttribute('transform', `translate(${cx} ${hy}) scale(${(.6 + .4 * easeOutBack(seg(t, 3.9, 4.5))).toFixed(3)}) translate(${-cx} ${-hy})`);
        if (ui) ui.chip(w > .5 ? 'Mit Gewicht bei 3 & 9 Uhr' : 'Ohne Zusatzgewicht', w > .5);
        return lerp(14.2, 15.6, easeInOut(seg(t, 4.0, 4.8)) * (1 - easeInOut(seg(t, 9.2, 9.8))));
      },
    },
  };

  /* ---------- player ---------- */
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ICON_PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.2v14H7zM13.8 5H17v14h-3.2z" fill="currentColor"/></svg>';
  const ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>';
  const players = [];

  document.querySelectorAll('[data-explainer]').forEach((host) => {
    const sc = SCENES[host.dataset.explainer];
    if (!sc) return;
    const f = 'xp' + (uid++);
    const rd = sc.read;
    host.innerHTML = stage() +
      `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Animation: ${sc.title}">${sc.build(f)}</svg>` +
      (sc.chip ? `<span class="xp-chip" data-chip></span>` : '') +
      `<div class="xp-read${rd.top ? ' is-top' : ''}" aria-hidden="true">
         <span class="xp-read-k">${rd.k}</span>
         <span class="xp-read-v"><b data-rv>–</b><small>${rd.unit}</small></span>
         <span class="xp-read-range"><i data-rdot></i></span>
         <span class="xp-read-scale"><span>${de(rd.min, rd.dec ? 0 : 0)}</span><span>typisch</span><span>${de(rd.max, rd.max % 1 ? 1 : 0)}</span></span>
       </div>` +
      `<button class="xp-ctrl" type="button"></button>`;
    const fg = host.querySelectorAll('svg')[1];
    const refs = {};
    fg.querySelectorAll('[data-r]').forEach((el) => { if (!refs[el.dataset.r]) refs[el.dataset.r] = el; });
    const rv = host.querySelector('[data-rv]'), rdot = host.querySelector('[data-rdot]'), chipEl = host.querySelector('[data-chip]');
    let lastChip = '';
    const ui = {
      chip(text, on) {
        if (!chipEl || text === lastChip) return;
        lastChip = text; chipEl.textContent = text; chipEl.classList.toggle('is-on', on);
      },
    };
    const p = { sc, refs, ui, t: reduce ? sc.still : 0, playing: !reduce, visible: false, btn: host.querySelector('.xp-ctrl') };
    p.render = () => {
      const v = sc.tick(refs, p.t, ui);
      if (v == null) { rv.textContent = '–'; rdot.style.opacity = '0'; return; }
      rv.textContent = de(v, rd.dec);
      rdot.style.opacity = '1';
      rdot.style.left = (clamp((v - rd.min) / (rd.max - rd.min)) * 100).toFixed(1) + '%';
    };
    const setBtn = () => {
      p.btn.innerHTML = p.playing ? ICON_PAUSE : ICON_PLAY;
      p.btn.setAttribute('aria-label', p.playing ? `Animation ${sc.title} pausieren` : `Animation ${sc.title} abspielen`);
    };
    p.btn.addEventListener('click', () => { p.playing = !p.playing; setBtn(); });
    setBtn();
    p.render();
    new IntersectionObserver(([e]) => { p.visible = e.isIntersecting; }, { rootMargin: '80px' }).observe(host);
    players.push(p);
  });

  if (!players.length) return;
  let last = performance.now();
  const loop = (now) => {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    for (const p of players) {
      if (!p.playing || !p.visible) continue;
      p.t = (p.t + dt) % p.sc.duration;
      p.render();
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
