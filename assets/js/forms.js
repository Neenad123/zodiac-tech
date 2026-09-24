/* ==========================================================================
   Form handling for the static/Vercel build
   --------------------------------------------------------------------------
   The PHP build validates and stores leads server-side. On a static host there
   is no PHP, so this file posts the same fields to /api/lead (the serverless
   function in /api/lead.js) and renders the result inline.

   If the function is not configured yet, or the request cannot be made at all
   (opened straight from disk, offline), the visitor is given a real email and
   WhatsApp link instead of a false "message sent".
   ========================================================================== */
(function () {
  'use strict';

  /* first line of the file: if this is unset in a page, the script never ran at all */
  window.__zodiacFormsLoaded = true;

  var ENDPOINT = '/api/lead';
  var forms = document.querySelectorAll('form[data-lead]');
  if (!forms.length) return;

  /* ---------------------------------------------------------------- helpers */

  function panel(form, kind, html) {
    var el = form.querySelector('[data-formnote]');
    if (!el) {
      el = document.createElement('p');
      el.setAttribute('data-formnote', '');
      form.appendChild(el);
    }
    el.className = 'formnote formnote--' + kind;
    el.innerHTML = html;
    el.style.marginTop = '1rem';
    return el;
  }

  function escapeHtml(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function payload(form) {
    var data = {};
    var services = [];
    form.querySelectorAll('input, select, textarea').forEach(function (field) {
      var name = field.name;
      if (!name) return;
      if (name.endsWith('[]')) {
        if (field.type === 'checkbox' ? field.checked : field.value) services.push(field.value);
        return;
      }
      if (field.type === 'checkbox' || field.type === 'radio') {
        if (field.checked) data[name] = field.value;
        return;
      }
      data[name] = field.value;
    });
    if (services.length) data.services = services;
    data.ajax = true;
    data.page = location.pathname;
    data.source = form.getAttribute('data-source') || 'contact';
    return data;
  }

  function fieldsValid(form) {
    var ok = true;
    form.querySelectorAll('input[required], textarea[required]').forEach(function (field) {
      field.classList.remove('field-error');
      var val = (field.value || '').trim();
      if (!val) { ok = false; field.classList.add('field-error'); return; }
      if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        ok = false; field.classList.add('field-error');
      }
    });
    return ok;
  }

  function reenable(form) {
    var btn = form.querySelector('button[type="submit"]');
    if (btn) {
      btn.disabled = false;
      if (btn.getAttribute('data-label')) btn.textContent = btn.getAttribute('data-label');
    }
  }

  function success(form) {
    var card = form.closest('.leadcard') || form;
    var done = document.createElement('div');
    done.className = 'leadform leadform--done';
    done.innerHTML =
      '<p class="kicker">MESSAGE RECEIVED</p>' +
      '<h3 style="margin:.3rem 0 .6rem">Thanks — we\'ve got it.</h3>' +
      '<p class="lede">We reply within one working day with next steps' +
      ' (Mon–Sat, 9 AM – 6:30 PM IST). If it is urgent, WhatsApp us on ' +
      '<a href="https://wa.me/919325695631">+91 93256 95631</a>.</p>';
    if (card === form) { form.parentNode.insertBefore(done, form); form.style.display = 'none'; }
    else { card.appendChild(done); form.style.display = 'none'; }
  }

  function contactFallback(form, reason) {
    var email = 'sam.andnkar1990@gmail.com';
    var subject = encodeURIComponent('Website enquiry — ' + (payload(form).name || 'new enquiry'));
    panel(form, 'bad',
      '<strong>We could not submit the form automatically.</strong><br>' +
      (reason === 'network'
        ? 'Your connection blocked the request. '
        : 'The form is not connected to a mailbox yet. ') +
      'Please email <a href="mailto:' + email + '?subject=' + subject + '">' + email + '</a> ' +
      'or WhatsApp <a href="https://wa.me/919325695631">+91 93256 95631</a> — ' +
      'we answer within one working day.');
    reenable(form);
  }

  /* ----------------------------------------------------------------- submit */

  forms.forEach(function (form) {
    var btn = form.querySelector('button[type="submit"]');
    if (btn && !btn.getAttribute('data-label')) btn.setAttribute('data-label', btn.textContent.trim());

    form.addEventListener('submit', function (e) {
      /* let the shared main.js validator paint field errors first */
      if (!fieldsValid(form)) { return; }

      e.preventDefault();
      panel(form, 'wait', 'Sending…');

      var body = JSON.stringify(payload(form));

      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: body
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (json) {
            return { status: res.status, json: json };
          });
        })
        .then(function (r) {
          if (r.status === 200 && r.json.ok) { success(form); return; }

          if (r.status === 422 && r.json.errors) {
            Object.keys(r.json.errors).forEach(function (field) {
              var el = form.querySelector('[name="' + field + '"]');
              if (el) el.classList.add('field-error');
            });
            panel(form, 'bad', 'Please check the highlighted fields and try again.');
            reenable(form);
            return;
          }
          contactFallback(form, r.json.reason === 'not_configured' ? 'not_configured' : 'network');
        })
        .catch(function () { contactFallback(form, 'network'); });
    });
  });

  /* a no-JavaScript POST gets redirected back with ?sent=1 — show the same panel */
  if (/[?&]sent=1/.test(location.search)) {
    forms.forEach(function (form) { success(form); });
  }

  /* marker for automated checks — proves this file executed and found the forms */
  window.__zodiacForms = { forms: forms.length, endpoint: ENDPOINT };
})();
