# Zodiac Tech — growth marketing website

Static website for **Zodiac Tech Soft Software & IT Services Pvt. Ltd.**
Plain HTML + CSS + JavaScript. No framework, no build step, no dependencies.

**This repository is the Vercel deploy root — the pages sit at the top level on purpose.**
Upload these files exactly as they are and Vercel serves them with no configuration.

---

## Repository layout

```
/                         <- Vercel project root
├── index.html            homepage (the full conversion journey)
├── services.html         the 8 growth pillars
├── work.html             client-stated outcomes + 24-organisation roster
├── growth-system.html    the six stages + engagement models
├── about.html            positioning, founders, offices
├── insights.html         free growth audit (lead capture)
├── contact.html          contact details, offices, FAQ, enquiry form
├── 404.html              branded not-found page (Vercel serves this automatically)
├── favicon.ico
├── robots.txt
├── sitemap.xml
├── vercel.json           cache + security headers
├── api/
│   └── lead.js           serverless function that receives both forms
└── assets/
    ├── css/style.css     the whole design system (one hand-written file)
    ├── js/main.js        scroll reveal, mobile nav, form guards
    ├── js/forms.js       posts the forms to /api/lead and shows the result
    └── img/              logo files, honeycomb tiles, favicon
```

---

## Deploy in five steps

1. **Create the repository** on github.com → *New repository* → name it e.g. `zodiactech-website`
   → **Public** or Private (either works with Vercel) → **do not** add a README (you already have one).
2. **Upload the files.** Pick whichever is easiest for you:

   **Option A — GitHub website (drag and drop)**
   On the empty repository page click **uploading an existing file**, then drag
   **the contents of the unzipped folder** — that means `index.html`, `assets`, `api`,
   `vercel.json`, `404.html`, `robots.txt`, `sitemap.xml`, `favicon.ico` — **not the folder
   itself**. Drag the `assets` and `api` folders together with the files; GitHub keeps the
   folder structure when you drag folders.
   Commit with a message like `Initial site`.

   **Option B — GitHub Desktop** — *Add local repository* → choose the unzipped folder →
   *Publish repository*.

   **Option C — command line**
   ```bash
   cd path/to/unzipped-folder
   git init
   git add .
   git commit -m "Initial site"
   git branch -M main
   git remote add origin https://github.com/<your-user>/<your-repo>.git
   git push -u origin main
   ```
3. **Import to Vercel** — vercel.com → *Add New… → Project* → **Import Git Repository** → pick
   the repo.
4. **Framework Preset: `Other`.** Leave *Build Command*, *Output Directory* and *Install Command*
   empty — there is nothing to build. Root Directory stays `./`.
5. **Deploy.** You get `https://<project>.vercel.app`. Every later `git push` redeploys
   automatically.

---

## "It loads but the CSS / UI is missing" — how to fix and how to check

The stylesheet is in this repo at `assets/css/style.css` and every page requests it with a
**relative** path (`assets/css/style.css`). That works at the domain root and under any subpath.
If a deployment looks unstyled, it is always one of these:

| Symptom | Cause | Fix |
|---|---|---|
| Blank page / Vercel 404 at `/` | The files were uploaded inside a folder, so the repo root has no `index.html` (e.g. the path inside the repo is `zodiactech-website/static-html/index.html`) | Move the files so `index.html` is at the repo root, then redeploy |
| Page loads, no styling | The `assets` folder did not get uploaded — GitHub's web uploader only keeps subfolders that you actually drag in | Confirm `assets/css/style.css` exists in the repo and redeploy |
| Styling missing after an update | Browser/edge cache | Hard refresh (`Ctrl` + `Shift` + `R`) |

**Two-second proof it is deployed correctly:** open

```
https://<your-project>.vercel.app/assets/css/style.css
```

You should see the CSS source (about 44 KB), not a 404. Then open
`https://<your-project>.vercel.app/assets/img/logo-primary.png` — you should see the logo.
If both load, the UI renders.

Tip: in Chrome, `F12` → **Network** tab → reload. Anything red (404) tells you exactly which
file Vercel could not find.

---

## Making the forms send somewhere

Both forms POST to `/api/lead` (the serverless function). Out of the box it validates the
submission and **logs it in Vercel** (Project → *Logs*, search for `LEAD`), but it does not
email anyone yet — and it will not pretend otherwise: the visitor sees a clear
"please email us directly" message with your email and WhatsApp link.

Turn on real delivery with **one environment variable** (Vercel → Project → *Settings* →
*Environment Variables* → add → **Redeploy**):

| Variable | What it does |
|---|---|
| `LEAD_WEBHOOK_URL` | POSTs each lead as JSON to that URL. Works with Zapier, Make, n8n, Slack, Formspree, or any CRM — the easiest option. |
| `RESEND_API_KEY` + `LEAD_EMAIL_TO` | Emails the lead through resend.com. Also set `LEAD_EMAIL_FROM` once you have verified a domain there. |

Prefer no serverless function at all? Delete `api/lead.js`, then in `contact.html` and
`insights.html` change the form's `action="/api/lead"` to your form service URL (Formspree,
Basin, Netlify Forms…), and delete the `<script src="assets/js/forms.js" defer>` line from both
pages.

---

## Editing the content

Everything is plain markup, so any text can be edited directly in the `.html` files. The things
you will most likely change:

* **Phone, email, WhatsApp, office addresses** — search for `sam.andnkar1990@gmail.com` and
  `9325695631`; they appear in `contact.html`, `about.html` and the footer of every page.
* **Services / pillars** — `services.html` (full detail) and the pillar grid in `index.html`.
* **Client roster and the three client-stated outcomes** — `work.html`.
* **Colours and type** — the CSS custom properties at the top of `assets/css/style.css`
  (`--gold`, `--ink`, `--grad-gold-r`, …).
* **Social links** — currently brand handles, not URLs. Replace with the real profile URLs.

## After you attach a real domain

Update the host in two files so search engines get correct URLs:

* `robots.txt` → the `Sitemap:` line
* `sitemap.xml` → every `<loc>` value

Then redeploy. Vercel → *Settings → Domains* to add the domain.

---

## What is deliberately not here

* **No PHP.** Vercel does not run PHP, so this is the static build. (The PHP version — with the
  same design and server-side form storage — is for cPanel/shared hosting.)
* **No build tooling or `package.json`.** Nothing to install, nothing to break. The one function
  in `api/` uses only Node's built-in `fetch`.
* **No invented numbers.** The 24-organisation roster and the three results are what the client
  published, quoted with attribution; the counts (8+ years, 23+ government departments, 94%
  on-time) come from the company's own site.
