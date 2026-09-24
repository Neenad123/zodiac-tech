DROP REAL SCREENSHOTS HERE
==============================================================================

Every visual-proof panel on the site (CRM boards, ERP reports, the mobile app,
the ads view, the WhatsApp flow, the homepage hero) looks in THIS folder first.
If the file exists it is used; if it does not, the panel draws a branded
CSS interface preview and clearly labels itself "Illustrative interface preview".

So you can swap in real screenshots later without touching a single template.

EXACT FILENAMES THE SITE LOOKS FOR
------------------------------------------------------------------------------
  hero-dashboard.png     homepage hero panel (CRM + campaigns + automation)
  crm-pipeline.png       software section — CRM sales pipeline view
  erp-report.png         software section — ERP operations report
  mobile-app.png         software section — field app, phone frame (portrait)
  ads-performance.png    digital marketing section — Google/Meta campaign view
  whatsapp-flow.png      AI & automation section — WhatsApp follow-up, phone

HOW TO ADD ONE
------------------------------------------------------------------------------
  1. Crop the screenshot so no client name, phone number, email address, GST
     number or customer record is visible — or take a demo/sandbox account for
     the screenshot. These images go on a public website.
  2. Keep it under ~1600px wide and under 300 KB (PNG for UI, JPG for photos).
  3. Save it in this folder with the exact filename above.
  4. Rebuild: python tools/build-vercel.py — then commit and push.

The caption under each panel stays the same, so nothing needs editing.

NOTE ON HONESTY
------------------------------------------------------------------------------
The "Illustrative interface preview" label disappears automatically once the real
file is present. Until then the site says plainly that the panel is a preview —
which is the only defensible way to show a UI mock on a page that claims to have
delivered 172+ projects. Do not remove the previews without replacing them.
