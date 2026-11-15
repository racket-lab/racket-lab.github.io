(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktop = window.matchMedia('(min-width: 960px)');

  /* ---------- header: solid once the dark page top is scrolled past ---------- */
  const header = $('[data-header]');
  const setSolid = () => header.classList.toggle('is-solid', window.scrollY > 60);
  setSolid();
  window.addEventListener('scroll', setSolid, { passive: true });

  /* ---------- mobile menu ---------- */
  const toggle = $('[data-menu-toggle]');
  const nav = $('#main-nav');
  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    header.classList.toggle('menu-open', open);
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  desktop.addEventListener('change', (m) => { if (m.matches) setMenu(false); });

  /* ---------- dropdowns (desktop: hover or click; mobile: always expanded) ---------- */
  const subs = $$('.has-sub');
  const closeSubs = (except) => subs.forEach((li) => {
    if (li === except) return;
    li.classList.remove('is-open');
    $('.sub-toggle', li).setAttribute('aria-expanded', 'false');
  });
  subs.forEach((li) => {
    const btn = $('.sub-toggle', li);
    btn.addEventListener('click', () => {
      const open = !li.classList.contains('is-open');
      closeSubs(li);
      li.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
    li.addEventListener('mouseenter', () => { if (desktop.matches) { closeSubs(li); li.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); } });
    li.addEventListener('mouseleave', () => { if (desktop.matches) { li.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); } });
    li.addEventListener('focusout', (e) => { if (desktop.matches && !li.contains(e.relatedTarget)) { li.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); } });
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('.has-sub')) closeSubs(); });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = subs.find((li) => li.classList.contains('is-open'));
    if (open) { closeSubs(); $('.sub-toggle', open).focus(); return; }
    if (nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
  });
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) { setMenu(false); closeSubs(); } });

  /* ---------- tabbed sections (one visible at a time, driven by the URL hash) ---------- */
  const panels = $$('[data-panel]');
  if (panels.length) {
    const tabs = $$('[data-tab]');
    const showPanel = (scroll) => {
      const id = location.hash.slice(1);
      const target = panels.find((p) => p.id === id) || panels[0];
      panels.forEach((p) => { p.hidden = p !== target; });
      tabs.forEach((t) => { if (t.dataset.tab === target.id) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current'); });
      if (scroll && panels.some((p) => p.id === id)) target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    };
    showPanel(!!location.hash);
    window.addEventListener('hashchange', () => showPanel(true));
  }

  /* ---------- background videos: play only while visible, never with reduced motion ---------- */
  const videos = $$('video[data-autoplay]');
  videos.filter((v) => v.dataset.start).forEach((v) => {
    const start = parseFloat(v.dataset.start);
    v.addEventListener('timeupdate', () => { if (v.currentTime < start - 0.05) v.currentTime = start; });
  });
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const visible = new Set();
    const vio = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { visible.add(en.target); en.target.play().catch(() => {}); }
        else { visible.delete(en.target); en.target.pause(); }
      });
    }, { rootMargin: '120px 0px' });
    videos.forEach((v) => { v.muted = true; vio.observe(v); });
    /* iPhone im Stromsparmodus blockiert Autoplay; nach der ersten Berührung dürfen Videos starten.
       Bis dahin zeigt das poster-Standbild. */
    const kick = () => visible.forEach((v) => { if (v.paused) v.play().catch(() => {}); });
    ['touchstart', 'click', 'scroll'].forEach((ev) => window.addEventListener(ev, kick, { passive: true }));
  }

  /* ---------- reveal on scroll ---------- */
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const targets = $$('[data-reveal] > *');
    targets.forEach((el) => el.classList.add('reveal'));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const i = [...en.target.parentElement.children].indexOf(en.target);
        en.target.style.transitionDelay = Math.min(i, 5) * 60 + 'ms';
        en.target.classList.add('is-visible');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    targets.forEach((el) => io.observe(el));
  }

  const yr = $('[data-year]');
  if (yr) yr.textContent = new Date().getFullYear();
})();
