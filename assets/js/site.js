/*
 * Page interactions: the light/dark toggle, the hero's field selector and pause button, and the publication filter.
 * Everything here is optional: without scripts the page still shows all of its content.
 */
(function () {
  'use strict';

  const root = document.documentElement;

  // ---------- Theme ----------

  const themeButtons = Array.from(document.querySelectorAll('[data-theme-toggle]'));

  function syncThemeButtons() {
    const light = root.classList.contains('theme-light');
    themeButtons.forEach((b) => b.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme'));
  }

  themeButtons.forEach((b) => b.addEventListener('click', () => {
    const light = root.classList.toggle('theme-light');
    try { localStorage.setItem('pf-theme', light ? 'light' : 'dark'); } catch (e) {}
    syncThemeButtons();
  }));
  syncThemeButtons();

  // ---------- Hero ----------

  const canvas = document.querySelector('.hero-canvas');
  const lensButtons = Array.from(document.querySelectorAll('.lens-btn'));
  const captions = Array.from(document.querySelectorAll('.lens-caption [data-lens]'));
  const avatar = document.querySelector('.avatar');
  const pauseButton = document.querySelector('[data-pause]');
  let hero = null;

  function showLens(i) {
    lensButtons.forEach((b, k) => {
      b.classList.toggle('is-on', k === i);
      b.setAttribute('aria-pressed', String(k === i));
    });
    captions.forEach((c) => { c.hidden = Number(c.dataset.lens) !== i; });
    if (avatar) {
      avatar.classList.remove('av-0', 'av-1', 'av-2');
      avatar.classList.add('av-' + i);
    }
  }

  function pickLens(i) {
    if (hero) hero.setLens(i, true);
    else showLens(i);
  }

  if (canvas && window.HeroScene) {
    hero = new window.HeroScene(canvas, { onLens: showLens });
    hero.start();
  }

  lensButtons.forEach((b, i) => {
    b.addEventListener('click', () => pickLens(i));
    // Hovering with a mouse previews a field; on touch screens a tap is enough.
    b.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') pickLens(i); });
  });

  if (pauseButton) {
    pauseButton.addEventListener('click', () => {
      const paused = pauseButton.dataset.paused !== 'true';
      pauseButton.dataset.paused = String(paused);
      pauseButton.setAttribute('aria-label', paused ? 'Play background animation' : 'Pause background animation');
      if (hero) hero.setPaused(paused);
    });
  }

  // ---------- Publication filter ----------

  const chips = Array.from(document.querySelectorAll('.chip[data-filter]'));
  const pubs = Array.from(document.querySelectorAll('.pub'));
  const pubCount = document.querySelector('[data-pub-count]');
  const tagsOf = (p) => (p.dataset.tags || '').split(/\s+/);
  const matches = (p, f) => f === 'all' || tagsOf(p).indexOf(f) >= 0;

  function applyFilter(f) {
    let shown = 0;
    pubs.forEach((p) => {
      const on = matches(p, f);
      p.hidden = !on;
      if (on) shown += 1;
    });
    chips.forEach((c) => {
      const on = c.dataset.filter === f;
      c.classList.toggle('is-on', on);
      c.setAttribute('aria-pressed', String(on));
    });
    if (pubCount) pubCount.textContent = 'Showing ' + shown + ' of ' + pubs.length;
  }

  // The counts on the chips come from the list itself, so adding a paper updates them automatically.
  chips.forEach((c) => {
    const n = c.querySelector('.chip-n');
    if (n) n.textContent = String(pubs.filter((p) => matches(p, c.dataset.filter)).length);
    c.addEventListener('click', () => applyFilter(c.dataset.filter));
  });
  if (chips.length) applyFilter('all');
})();
