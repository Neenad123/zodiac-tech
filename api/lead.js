/**
 * POST /api/lead — receives the contact form and the free-audit form on Vercel.
 *
 * Vercel turns any file in /api into a serverless function at /api/<name>.
 * No build step, no dependencies, no package.json needed — this file uses only
 * standard Node APIs (http response methods and global fetch), so it behaves the
 * same on Vercel, under `node api/lead.js` style harnesses, and anywhere else.
 *
 * WHERE THE LEAD GOES (first one that is configured wins)
 *   1. LEAD_WEBHOOK_URL                 POSTs the lead as JSON to that URL
 *                                       (Zapier, Make, n8n, Slack, Formspree, your CRM)
 *   2. RESEND_API_KEY + LEAD_EMAIL_TO   emails it through Resend
 *   Neither set → 503, and the browser shows an email/WhatsApp fallback rather than
 *   pretending the message was sent. Every lead is also written to the function log,
 *   so nothing is silently lost.
 *
 * Set these in Vercel → Project → Settings → Environment Variables, then redeploy.
 */

const CONTACT = {
  email: 'sam.andnkar1990@gmail.com',
  phone: '+91 93256 95631',
  whatsapp: '919325695631',
};

const MAX_BODY = 32 * 1024; // 32 KB is plenty for a lead

/* ------------------------------------------------------------------ responses */

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function html(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(body);
}

function seeOther(res, location) {
  res.statusCode = 303;
  res.setHeader('Location', location);
  res.setHeader('Cache-Control', 'no-store');
  res.end();
}

/* -------------------------------------------------------------------- helpers */

function readBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === 'object') return resolve(req.body); // runtime already parsed it
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > MAX_BODY) { reject(new Error('body too large')); req.destroy(); }
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      const type = String(req.headers['content-type'] || '');
      if (type.includes('application/json')) {
        try { return resolve(JSON.parse(raw)); } catch (e) { return resolve({}); }
      }
      const out = {};                                   // application/x-www-form-urlencoded
      for (const [k, v] of new URLSearchParams(raw)) {
        if (k.endsWith('[]')) {
          const key = k.slice(0, -2);
          (out[key] = out[key] || []).push(v);
        } else if (out[k] === undefined) {
          out[k] = v;
        }
      }
      resolve(out);
    });
    req.on('error', reject);
  });
}

const clean = (v, max = 500) =>
  String(v === undefined || v === null ? '' : Array.isArray(v) ? v.join(', ') : v)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, max);

function validate(data) {
  const errors = {};
  const name = clean(data.name, 190);
  const email = clean(data.email, 190);
  const phone = clean(data.phone, 40);

  if (name.length < 2) errors.name = 'Please enter your name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Please enter a valid email address.';
  if (phone.replace(/\D/g, '').length < 8) errors.phone = 'Please enter a reachable phone number.';

  return {
    errors,
    lead: {
      name, email, phone,
      company: clean(data.company, 190),
      website: clean(data.website, 190),
      goal: clean(data.goal, 120),
      budget: clean(data.budget, 120),
      services: Array.isArray(data.services)
        ? data.services.map((s) => clean(s, 120)).filter(Boolean).slice(0, 20)
        : [],
      message: clean(data.message, 4000),
      source: clean(data.source, 40) || 'contact',
      page: clean(data.page, 190),
      receivedAt: new Date().toISOString(),
    },
  };
}

/* ------------------------------------------------------------------- delivery */

async function deliver(lead) {
  const webhook = process.env.LEAD_WEBHOOK_URL;
  const resendKey = process.env.RESEND_API_KEY;
  const emailTo = process.env.LEAD_EMAIL_TO;

  if (webhook) {
    const r = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...lead, to: emailTo || CONTACT.email }),
    });
    if (!r.ok) throw new Error(`webhook responded ${r.status}`);
    return { via: 'webhook' };
  }

  if (resendKey && emailTo) {
    const lines = [
      `Name:     ${lead.name}`,
      `Email:    ${lead.email}`,
      `Phone:    ${lead.phone}`,
      lead.company ? `Company:  ${lead.company}` : '',
      lead.website ? `Website:  ${lead.website}` : '',
      lead.goal ? `Goal:     ${lead.goal}` : '',
      lead.budget ? `Budget:   ${lead.budget}` : '',
      lead.services.length ? `Services: ${lead.services.join(', ')}` : '',
      lead.page ? `Page:     ${lead.page}` : '',
      '',
      lead.message || '(no message)',
      '',
      `Received: ${lead.receivedAt}`,
    ].filter(Boolean);

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.LEAD_EMAIL_FROM || 'Zodiac Tech Website <onboarding@resend.dev>',
        to: [emailTo],
        reply_to: lead.email,
        subject: `New ${lead.source === 'audit' ? 'growth-audit request' : 'website enquiry'} — ${lead.name}` +
                 (lead.company ? ` (${lead.company})` : ''),
        text: lines.join('\n'),
      }),
    });
    if (!r.ok) throw new Error(`resend responded ${r.status}`);
    return { via: 'email' };
  }

  return { via: null };
}

/* -------------------------------------------------------------------- handler */

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { ok: false, reason: 'method_not_allowed' });
  }

  let data;
  try {
    data = await readBody(req);
  } catch (e) {
    return json(res, 413, { ok: false, reason: 'payload_too_large' });
  }

  const wantsHtml = String(req.headers.accept || '').includes('text/html') && !data.ajax;

  /* honeypot: a real person never fills this. Answer as if all is well, store nothing. */
  if (clean(data.hp)) {
    return wantsHtml ? seeOther(res, '/contact.html?sent=1') : json(res, 200, { ok: true });
  }

  const { errors, lead } = validate(data);
  if (Object.keys(errors).length) {
    return wantsHtml
      ? seeOther(res, '/contact.html?error=1')
      : json(res, 422, { ok: false, reason: 'validation', errors });
  }

  // always keep a copy in the function log — a lead must never vanish
  console.log('LEAD ' + JSON.stringify(lead));

  try {
    const { via } = await deliver(lead);

    if (!via) {
      const payload = {
        ok: false,
        reason: 'not_configured',
        message: 'The form is not connected to a mailbox yet.',
        contact: CONTACT,
      };
      return wantsHtml ? html(res, 503, fallbackHtml(payload)) : json(res, 503, payload);
    }

    return wantsHtml
      ? seeOther(res, '/contact.html?sent=1')
      : json(res, 200, { ok: true, via });
  } catch (e) {
    console.error('delivery failed', e);
    const payload = { ok: false, reason: 'delivery_failed', contact: CONTACT };
    return wantsHtml ? html(res, 502, fallbackHtml(payload)) : json(res, 502, payload);
  }
};

/** plain page for no-JavaScript submissions */
function fallbackHtml({ message }) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Please email us directly — Zodiac Tech</title>
<style>
 body{margin:0;background:#04070a;color:#dae0e5;font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
      display:flex;min-height:100vh;align-items:center;justify-content:center;padding:2rem}
 .box{max-width:560px;border:1px solid rgba(242,183,1,.28);border-radius:18px;padding:2rem;background:#080d13}
 h1{margin:0 0 .6rem;font-size:1.35rem;color:#fff}
 a{color:#ffd54a}
 p{margin:.6rem 0}
</style></head><body><div class="box">
<h1>One step left — please reach us directly</h1>
<p>${message || 'The form could not deliver your message right now.'}</p>
<p>Email <a href="mailto:${CONTACT.email}">${CONTACT.email}</a><br>
WhatsApp or call <a href="https://wa.me/${CONTACT.whatsapp}">${CONTACT.phone}</a></p>
<p><a href="/contact.html">Back to the contact page</a></p>
</div></body></html>`;
}

/* exported for testing */
module.exports._internal = { validate, clean, readBody, deliver, CONTACT };
