/* ============================================================
   HiTend Digital — shared behaviour
   Save as: /script.js  (repo root)
   Load with: <script src="script.js" defer></script>
   From /apps/ or /tools/ pages: <script src="../script.js" defer></script>
   ============================================================ */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Scroll reveals with auto-stagger ---------- */
  function initReveals() {
    var items = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
    if (!items.length) return;

    // Give each element an index within its own parent so groups of cards
    // cascade instead of popping together. Respect a hand-set --i.
    var counters = new Map();
    items.forEach(function (el) {
      if (el.style.getPropertyValue('--i')) return;
      var parent = el.parentElement || document.body;
      var n = counters.get(parent) || 0;
      counters.set(parent, n + 1);
      el.style.setProperty('--i', Math.min(n, 8)); // cap so late cards don't lag
    });

    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-revealed'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target); // reveal once, then stop watching
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    items.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- 2. Nav state on scroll ---------- */
  function initNav() {
    var nav = document.querySelector('.nav');
    if (!nav) return;

    var ticking = false;
    function update() {
      nav.classList.toggle('is-scrolled', window.scrollY > 8);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  /* ---------- 3. Live search filter ----------
     Markup:
     <input class="search__input" data-search data-search-target="#apps-grid"
            data-search-empty="#apps-empty">
     <div id="apps-grid"> <a class="card" data-keywords="udhar khata shop">…</a> </div>
     <p id="apps-empty" class="search__empty">Nothing matched…</p>
  ------------------------------------------------ */
  function initSearch() {
    var inputs = document.querySelectorAll('[data-search]');
    if (!inputs.length) return;

    Array.prototype.forEach.call(inputs, function (input) {
      var grid = document.querySelector(input.getAttribute('data-search-target'));
      if (!grid) return;
      var emptyMsg = document.querySelector(input.getAttribute('data-search-empty') || '');
      var items = Array.prototype.slice.call(grid.children);

      function filter() {
        var q = input.value.trim().toLowerCase();
        var shown = 0;

        items.forEach(function (item) {
          var hay = (item.getAttribute('data-keywords') || '') + ' ' + item.textContent;
          var hit = !q || hay.toLowerCase().indexOf(q) !== -1;
          item.classList.toggle('is-hidden', !hit);
          if (hit) {
            shown++;
            // anything filtered back into view must not stay invisible
            item.classList.add('is-revealed');
          }
        });

        if (emptyMsg) emptyMsg.classList.toggle('is-shown', shown === 0);
      }

      input.addEventListener('input', filter);
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { input.value = ''; filter(); }
      });
      filter();
    });
  }

  /* ---------- 4. Split download button (Siphon) ----------
     Hover opens it on desktop via CSS. This adds click/tap + keyboard,
     so touchscreens can reach both options.
  ------------------------------------------------ */
  function initSplitButtons() {
    var splits = document.querySelectorAll('.dl-split');
    if (!splits.length) return;

    function closeAll(except) {
      Array.prototype.forEach.call(splits, function (s) {
        if (s === except) return;
        s.classList.remove('is-open');
        var t = s.querySelector('.dl-split__trigger');
        if (t) t.setAttribute('aria-expanded', 'false');
      });
    }

    Array.prototype.forEach.call(splits, function (split) {
      var trigger = split.querySelector('.dl-split__trigger');
      if (!trigger) return;

      trigger.setAttribute('aria-expanded', 'false');
      trigger.setAttribute('aria-haspopup', 'true');

      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var open = !split.classList.contains('is-open');
        closeAll(split);
        split.classList.toggle('is-open', open);
        trigger.setAttribute('aria-expanded', String(open));
      });

      // choosing an option closes the menu
      split.querySelectorAll('.dl-option').forEach(function (opt) {
        opt.addEventListener('click', function () {
          split.classList.remove('is-open');
          trigger.setAttribute('aria-expanded', 'false');
        });
      });
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.dl-split')) closeAll(null);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAll(null);
    });
  }

  /* ---------- 5. In-page jumps (e.g. All versions → history) ---------- */
  function initAnchors() {
    document.querySelectorAll('[data-scroll-to]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        var target = document.querySelector(el.getAttribute('data-scroll-to'));
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({
          behavior: reduceMotion ? 'auto' : 'smooth',
          block: 'start'
        });
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      });
    });
  }

  /* ---------- 6. Footer year ---------- */
  function initYear() {
    document.querySelectorAll('[data-year]').forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }
  /* ============================================================
   Screenshot lightbox — add this as a new numbered section in script.js
   (e.g. "7. Screenshot lightbox"), and add initLightbox(); to the
   init() function's call list at the bottom of the file.
   ============================================================ */

function initLightbox() {
  var shots = Array.prototype.slice.call(document.querySelectorAll('.gallery .shot'));
  if (!shots.length) return;

  // Build the lightbox markup once and append it to <body>.
  var box = document.createElement('div');
  box.className = 'lightbox';
  box.innerHTML =
    '<div class="lightbox__frame">' +
      '<button type="button" class="lightbox__close" aria-label="Close">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>' +
      '</button>' +
      '<button type="button" class="lightbox__nav lightbox__nav--prev" aria-label="Previous screenshot">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      '</button>' +
      '<img alt="">' +
      '<button type="button" class="lightbox__nav lightbox__nav--next" aria-label="Next screenshot">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      '</button>' +
      '<span class="lightbox__counter"></span>' +
    '</div>';
  document.body.appendChild(box);

  var img = box.querySelector('img');
  var counter = box.querySelector('.lightbox__counter');
  var btnClose = box.querySelector('.lightbox__close');
  var btnPrev = box.querySelector('.lightbox__nav--prev');
  var btnNext = box.querySelector('.lightbox__nav--next');

  var index = 0;
  var lastFocused = null;

  function sources(i) {
    var inner = shots[i].querySelector('img');
    return { src: inner.currentSrc || inner.src, alt: inner.alt || '' };
  }

  function open(i) {
    index = i;
    var s = sources(index);
    img.src = s.src;
    img.alt = s.alt;
    counter.textContent = (index + 1) + ' / ' + shots.length;
    lastFocused = document.activeElement;
    box.classList.add('is-open');
    btnClose.focus();
    document.body.style.overflow = 'hidden';
  }

  function close() {
    box.classList.remove('is-open');
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  }

  function step(delta) {
    index = (index + delta + shots.length) % shots.length;
    var s = sources(index);
    img.src = s.src;
    img.alt = s.alt;
    counter.textContent = (index + 1) + ' / ' + shots.length;
  }

  shots.forEach(function (shot, i) {
    shot.setAttribute('tabindex', '0');
    shot.setAttribute('role', 'button');
    shot.setAttribute('aria-label', 'Expand screenshot ' + (i + 1) + ' of ' + shots.length);

    shot.addEventListener('click', function () { open(i); });
    shot.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
    });
  });

  btnClose.addEventListener('click', close);
  btnPrev.addEventListener('click', function () { step(-1); });
  btnNext.addEventListener('click', function () { step(1); });

  box.addEventListener('click', function (e) {
    if (e.target === box) close(); // click on the dimmed backdrop, not the frame
  });

  document.addEventListener('keydown', function (e) {
    if (!box.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });

  // basic touch swipe
  var touchStartX = null;
  box.addEventListener('touchstart', function (e) { touchStartX = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', function (e) {
    if (touchStartX === null) return;
    var dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) step(dx > 0 ? -1 : 1);
    touchStartX = null;
  }, { passive: true });
}

  /* ---------- boot ---------- */
  function init() {
    initReveals();
    initNav();
    initSearch();
    initSplitButtons();
    initAnchors();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
