/* ==========================================================================
   Zodiac Tech — front-end behaviour
   Deliberately small and dependency-free: reveal, progress, sticky header,
   mobile nav lock, count-up stats, and lead-form guards.
   ========================================================================== */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------- reveal on scroll */
  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;
    if (reduce || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });

    // Fail-safe. Content must never stay invisible because observation failed
    // (throttled/background tab, restored scroll position, an IO quirk, or a
    // stalling renderer). Everything un-hides shortly after load regardless.
    window.setTimeout(function () {
      items.forEach(function (el) { el.classList.add('is-in'); });
    }, 2200);
  }

  /* ---------------------------------------------------- scroll progress + header */
  function initScroll() {
    var bar = document.querySelector('.scroll-progress span');
    var head = document.getElementById('siteHead');
    var ticking = false;

    function paint() {
      ticking = false;
      if (bar) {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        var pct = h > 0 ? (window.scrollY / h) * 100 : 0;
        bar.style.width = Math.min(100, Math.max(0, pct)) + '%';
      }
      if (head) head.classList.toggle('is-stuck', window.scrollY > 12);
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(paint); }
    }, { passive: true });
    paint();
  }

  /* ---------------------------------------------------- mobile nav */
  function initNav() {
    var toggle = document.getElementById('navtoggle');
    if (!toggle) return;
    toggle.addEventListener('change', function () {
      document.body.classList.toggle('is-locked', toggle.checked);
    });
    document.querySelectorAll('.nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        if (toggle.checked) {
          toggle.checked = false;
          document.body.classList.remove('is-locked');
        }
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.checked) {
        toggle.checked = false;
        document.body.classList.remove('is-locked');
      }
    });
  }

  /* ---------------------------------------------------- lead forms */
  function initForms() {
    document.querySelectorAll('form[data-lead]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        var ok = true;
        form.querySelectorAll('input[required], textarea[required]').forEach(function (field) {
          field.classList.remove('field-error');
          var val = (field.value || '').trim();
          if (!val) { ok = false; field.classList.add('field-error'); }
          if (field.type === 'email' && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
            ok = false; field.classList.add('field-error');
          }
        });
        var note = form.querySelector('[data-formnote]');
        if (!ok) {
          e.preventDefault();
          if (note) note.textContent = 'Please complete the highlighted fields.';
          var first = form.querySelector('.field-error');
          if (first) first.focus();
          return;
        }
        var btn = form.querySelector('button[type="submit"]');
        if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      });
    });
  }

  /* ---------------------------------------------------- deep-link highlight */
  function initHashFlash() {
    if (!location.hash) return;
    var el = document.querySelector(location.hash);
    if (!el) return;
    el.style.transition = 'background .5s ease';
    el.style.background = 'rgba(242,183,1,.07)';
    setTimeout(function () { el.style.background = ''; }, 1400);
  }

  function boot() {
    initReveal();
    initScroll();
    initNav();
    initForms();
    initHashFlash();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
