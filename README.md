# Zodiac Tech Soft — website

Static website for **Zodiac Tech Soft Software & IT Services Pvt. Ltd.**
Plain HTML + CSS + JavaScript. No framework, no build step, no dependencies.

**This repository is the Vercel deploy root — the pages sit at the top level on purpose.**
Every file here is generated from the PHP source project by `tools/build-vercel.py`, which also
audits the output before it is allowed to be committed. Change copy in the PHP source
(`includes/data.php`) or directly in the `.html` here, then re-run that script if you want the
generated tree rebuilt.

Positioning: a **software and IT services company** — software development, websites, mobile
apps, UI/UX, IT infrastructure, cloud and support. **Digital marketing is one of its services**,
not the company's identity.

---

## Repository layout

```
/                          <- Vercel project root
├── index.html             homepage (the full conversion journey)
├── services.html          the ten service verticals
├── work.html              client-stated outcomes + the full client roster
├── growth-system.html     how we work — six delivery stages
├── about.html             positioning, directors, offices
├── insights.html          free IT & digital audit (lead capture)
├── contact.html           contact details, offices, FAQ, enquiry form
├── 404.html               branded not-found page (root-absolute paths on purpose)
├── favicon.ico
├── robots.txt
├── sitemap.xml
├── vercel.json            cache + security headers
├── api/
│   └── lead.js            serverless function that receives both forms
└── assets/
    ├── css/style.css      the whole design system (one hand-written file)
    ├── js/main.js         scroll reveal, mobile nav, form guards
    ├── js/forms.js        posts the forms to /api/lead and shows the result
    └── img/
        ├── clients/       23 real client logos, 256px white tiles
        └── founders/      the five directors' portraits
```

---

## Deploy in five steps

1. **Create the repository** on github.com → *New repository* → name it e.g. `zodiac-tech`.
2. **Upload the files** — either:
   * **GitHub website:** *Add file → Upload files*, then drag **the contents** of this folder
     (the files *and* the `assets` and `api` folders) — **not** the folder itself, and **not** a
     `.zip`. Before pressing *Commit changes*, check the list shows ~30 files including
     `index.html`, `assets/css/style.css` and `api/lead.js`.
   * **git:** `git add -A && git commit -m "Site" && git push`
3. **Import to Vercel** — vercel.com → *Add New… → Project* → **Import Git Repository**.
4. **Framework Preset: `Other`.** Leave *Build Command*, *Output Directory* and *Install Command*
   empty; Root Directory stays `./`. There is nothing to build.
5. **Deploy.** Every later `git push` redeploys automatically.

---

## "It loads but the CSS / UI is missing" — how to check

Every page requests the stylesheet with a **relative** path (`assets/css/style.css`), so it works
at the domain root and under any subpath. If a deployment looks unstyled or 404s:

| Symptom | Cause | Fix |
|---|---|---|
| `404: NOT_FOUND` on every URL, including `/robots.txt` | The repository is empty, or the site is nested inside a folder, so there is no `index.html` at the root | Put `index.html` at the repo root, then redeploy |
| Page loads, no styling | The `assets` folder did not get uploaded (GitHub's web uploader keeps only folders you actually drag in) | Confirm `assets/css/style.css` exists in the repo and redeploy |
| Styling missing after an update | Browser / edge cache | Hard refresh (`Ctrl` + `Shift` + `R`) |

**Two-second proof it is deployed correctly:** open

```
https://<your-project>.vercel.app/assets/css/style.css
```

CSS source (not a 404) means the UI renders. `F12 → Network` names any file Vercel cannot find.

---

## Making the forms send somewhere

Both forms POST to `/api/lead`. Out of the box the function validates the submission and **logs it
in Vercel** (Project → *Logs*, search `LEAD`), but it does not email anyone yet — and it does not
pretend otherwise: the visitor sees a clear "please email/WhatsApp us" message.

Turn on real delivery with **one environment variable** (Vercel → Settings → Environment
Variables → add → **Redeploy**):

| Variable | What it does |
|---|---|
| `LEAD_WEBHOOK_URL` | POSTs each lead as JSON to that URL — Zapier, Make, n8n, Slack, Formspree or any CRM. Easiest option. |
| `RESEND_API_KEY` + `LEAD_EMAIL_TO` | Emails the lead through resend.com. Also set `LEAD_EMAIL_FROM` once a domain is verified there. |

---

## Editing the content

* **The ten verticals** and their "what's included" lists live in `includes/data.php`
  (`$PILLARS`) in the PHP source; in this repo they are plain markup in `services.html` and the
  vertical grid in `index.html`.
* **The numbers** — `24+ clients`, `172+ projects`, `94% on time`, `8+ years` — appear in
  `index.html`, `about.html`, `work.html` and the footer of every page. Change them everywhere or
  not at all: they are the claim the whole site rests on.
* **Client logos** — `assets/img/clients/<slug>.png`, 256×256 white tiles. To add one, drop the
  file in and reference it in the roster markup (`work.html`) and the animated wall (`index.html`).
* **Directors** — `assets/img/founders/*.jpg` (square, 360×360 or larger).
* **Contact details** — search for `sam.andnkar1990@gmail.com` and `9325695631`.
* **Colours and type** — the CSS custom properties at the top of `assets/css/style.css`.

## After attaching a real domain

Update the host in `robots.txt` (the `Sitemap:` line) and every `<loc>` in `sitemap.xml`, then push.
Vercel → *Settings → Domains* to attach the domain.

---

## What is deliberately not here

* **No PHP.** Vercel does not run PHP, so this is the static build; the PHP version is the source
  project (with server-side form storage) for cPanel/shared hosting.
* **No build tooling or `package.json`.** Nothing to install. The one function in `api/` uses only
  Node's built-in `fetch`.
* **No invented numbers or logos.** `172+ projects`, `24+ clients` and `94% on time` are the
  client's own figures; every logo in `assets/img/clients/` was recovered from the company's own
  site, and the two photographs (Aditya Infraventures, Erai Dam Project) are theirs.
* **No agency framing.** The site presents a software and IT services company in which digital
  marketing is one service among ten verticals.
