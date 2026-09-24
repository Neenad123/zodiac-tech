/* ==========================================================================
   Conversion tracking + the consultation dialog
   --------------------------------------------------------------------------
   Every event the brief asks for is pushed to window.dataLayer from here:

     whatsapp_click        any WhatsApp link (data-track="whatsapp_click")
     phone_click           any tel: link
     cta_click             any primary CTA button or link
     service_cta_click     a CTA inside a service / category block
     contact_form_submit   a lead form was submitted
     consultation_booked   a form was submitted successfully
     case_study_view       a case study scrolled into view

   Why dataLayer and not gtag directly: it is the one contract GTM, GA4 and any
   server-side tag container all read. With $ANALYTICS empty in the PHP source
   no tag is loaded at all, so these events sit in the dataLayer until an ID is
   configured — nothing is sent anywhere, and nothing has to be rewritten later.

   Also handles: opening/closing the consultation <dialog> from any
   [data-modal="consult"] trigger, and click-outside dismissal.
   ========================================================================== */
(function () {
  'use strict';

  window.dataLayer = window.dataLayer || [];
  window.__zodiacTrackingLoaded = true;

  var CFG = window.ZODIAC_ANALYTICS || {};
  var fired = {};                                    /* dedupe once-only events */

  function push(event, params) {
    var payload = {};
    for (var k in params) { if (Object.prototype.hasOwnProperty.call(params, k)) payload[k] = params[k]; }
    payload.event = event;
    payload.page_path = location.pathname;
    payload.page_title = document.title;

    window.dataLayer.push(payload);

    /* optional direct forwarding, only when the tag is actually loaded */
    if (typeof window.gtag === 'function') { window.gtag('event', event, payload); }
    if (typeof window.fbq === 'function') {
      var meta = { contact_form_submit: 'Lead', consultation_booked: 'Lead', whatsapp_click: 'Contact', phone_click: 'Contact' }[event];
      if (meta) { window.fbq('track', meta, payload); } else if (event !== 'case_study_view') { window.fbq('trackCustom', event, payload); }
    }
  }
  window.zodiacTrack = push;

  /* ------------------------------------------------ click delegation */
  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-track]') : null;
    if (!el) return;

    var name = el.getAttribute('data-track');
    if (!name) return;

    var params = {};
    Array.prototype.forEach.call(el.attributes, function (a) {
      if (a.name.indexOf('data-track-') === 0) { params[a.name.slice(11)] = a.value; }
    });
    if (el.tagName === 'A') { params.link_url = el.getAttribute('href') || ''; }
    params.link_text = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);

    push(name, params);
  }, true);                     /* capture: still fires when another handler preventDefaults */

  /* ------------------------------------------------ case study views */
  var cases = document.querySelectorAll('[data-case]');
  if (cases.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var id = en.target.getAttribute('data-case');
        if (en.isIntersecting && !fired['case:' + id]) {
          fired['case:' + id] = true;
          push('case_study_view', { case_id: id, case_title: en.target.getAttribute('data-case-title') || '' });
        }
      });
    }, { threshold: 0.2 });        /* case-study cards are tall, so 0.5 could never be met on a phone */
    cases.forEach(function (c) { io.observe(c); });
  }

  /* ------------------------------------------------ lead forms */
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form || !form.matches || !form.matches('form[data-lead]')) return;
    var isConsult = form.getAttribute('data-consult-form') === 'true' || form.closest('#consultModal') !== null;
    push('contact_form_submit', {
      form_source: form.getAttribute('data-source') || (isConsult ? 'consultation' : 'contact'),
      service: (form.querySelector('[name="goal"]') || {}).value || '',
      form_type: isConsult ? 'consultation' : 'lead'
    });
  }, true);

  /* forms.js fires this after the endpoint returns ok (AJAX path) */
  window.addEventListener('zodiac:lead', function (ev) {
    push('consultation_booked', { form_source: (ev.detail && ev.detail.source) || 'contact', form_type: (ev.detail && ev.detail.type) || 'lead' });
  });

  /* the no-JavaScript POST is redirected back with ?sent=1 (PHP host) */
  if (/[?&]sent=1/.test(location.search) && !fired.sentRedirect) {
    fired.sentRedirect = true;
    push('consultation_booked', { form_source: 'server_redirect', form_type: 'lead' });
  }

  /* ------------------------------------------------ consultation dialog */
  var dlg = document.getElementById('consultModal');
  if (dlg && typeof dlg.showModal === 'function') {
    document.addEventListener('click', function (e) {
      var trigger = e.target.closest ? e.target.closest('[data-modal="consult"]') : null;
      if (trigger) {
        e.preventDefault();
        try { dlg.showModal(); } catch (err) { location.href = trigger.getAttribute('href') || 'contact.php'; return; }
        push('cta_click', { location: 'modal_open', label: 'consultation' });
        var first = dlg.querySelector('input[name="name"]');
        if (first) { window.setTimeout(function () { first.focus(); }, 60); }
        return;
      }
      if (e.target.closest && e.target.closest('[data-modal-close]')) {
        e.preventDefault();
        dlg.close();
        return;
      }
      /* click on the backdrop (the dialog element itself, outside the card) */
      if (e.target === dlg) { dlg.close(); }
    });
  } else if (dlg) {
    /* very old browser: turn the triggers into plain links to contact.php */
    Array.prototype.forEach.call(document.querySelectorAll('[data-modal="consult"]'), function (t) {
      t.setAttribute('href', 'contact.php#start');
    });
  }
})();
