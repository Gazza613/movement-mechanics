# Movement Mechanics - Developer Handoff & Onboarding

**Client:** Movement Mechanics (Jordan Leondiris / Trevino Larry)
**Contact:** movementmechanics.sa@gmail.com
**Target domain:** movementmechanics.co.za (registered via domains.co.za)

This folder is the complete, finished website exactly as approved by the
client. It is a **static export of the client's local build** - not a live
repo they're actively editing from this point forward. Treat everything in
here as the final source of truth for design, layout, copy, and assets.

## 1. Mandate: implement exactly as provided, no redesign

The client's instruction is to reproduce this build **forensically** - pixel
for pixel, interaction for interaction. Please do not:

- Substitute fonts, colors, spacing, or layout for "improvements"
- Swap in different stock imagery or icons
- Change copy, headings, or page structure
- Simplify or remove any of the interactive/motion details (the vertical
  scroll runner indicator, the preloader animation, card tilt effects,
  carousel, lightbox, scroll-reveal animations, etc.) - these were built to
  the client's explicit spec over several iterations and are considered
  final.

If something looks like a bug or an odd choice, flag it to the client before
changing it rather than "fixing" it unilaterally.

## 2. What's in this package

```
index.html, about.html, programs.html, schools.html,
research-development.html, gallery.html, ambassadors.html,
careers.html, contact.html          All 9 pages, final content/design
assets/css/styles.css               Full design system (CSS custom properties,
                                     all component/page styles)
assets/js/main.js                   Preloader, nav, tabs, carousel, lightbox,
                                     scroll-reveal, scroll-runner indicator
assets/js/careers.js                Careers job board (reads an optional
                                     Google Sheet - see section 6) + CV upload UX
assets/img/                         Every image/logo used on the site (30
                                     files) - nothing external to source
api/contact.js                      Contact form handler (Vercel Function)
api/careers.js                      Careers form handler (Vercel Function,
                                     handles the CV attachment)
package.json                        One dependency: resend (for the two
                                     functions above)
favicon.ico, favicon-*.png,
apple-touch-icon.png                Favicons
robots.txt, sitemap.xml             SEO files
legacy-cpanel-php/                  Old PHP form handlers from an earlier
                                     hosting plan - reference only, not used,
                                     safe to ignore or delete
DEPLOYMENT.md                       An earlier deployment plan written for
                                     the client doing this themselves - most
                                     of the technical detail still applies,
                                     but this document (AGENCY-ONBOARDING.md)
                                     is the authoritative one for this handoff
```

All imagery the site uses is already inside `assets/img/` - there is nothing
to source separately. If a design comp or brand asset you'd expect to see
isn't here, it wasn't used in the final build; ask the client rather than
substituting something.

## 3. Tech stack (already decided, please stick to it)

**GitHub** (source control) → **Vercel** (hosting/deploy, auto-deploy on
push to `main`) → **domains.co.za** (DNS only, not hosting) → **Resend**
(transactional email for the two forms) → GitHub Codespaces + Claude as the
dev environment/assistant.

The site is plain static HTML/CSS/JS (no framework, no build step) plus two
small Vercel Functions for the forms. There is nothing to "migrate" - build
directly from these files.

## 4. Account ownership for this project

Per the client: **your agency creates and owns** the GitHub repository, the
Vercel project, and the Resend account for this build. The client is not
setting these up themselves.

The one exception is the **domain**: the client keeps full control of the
movementmechanics.co.za registration and DNS at domains.co.za. Your agency
will never need login access to it - see section 7 for how the DNS handoff
works instead.

## 5. Setup steps

1. **Create your GitHub repo** (e.g. `movement-mechanics-website`), initialize
   it with the contents of this folder exactly as-is:
   ```bash
   git init
   git add .
   git commit -m "Initial import - client-approved static build"
   git branch -M main
   git remote add origin <your-agency-github-url>
   git push -u origin main
   ```
2. **Import into Vercel**: Add New Project → select the repo → Framework
   Preset: **Other** (no build command, no output directory override - it's
   static plus two `/api` functions).
3. **Create a Resend account** (resend.com) under your agency's own email.
   Generate an API key (Dashboard → API Keys).
4. **Important - domain verification is required on day one**, not optional:
   the form's `TO_EMAIL` is `movementmechanics.sa@gmail.com`, but your Resend
   account will be signed up under your agency's email, not the client's.
   Resend's default `onboarding@resend.dev` sender can only deliver to the
   email address that created the Resend account - so until you verify
   `movementmechanics.co.za` as a sending domain in Resend, form emails will
   **fail to reach the client**. Go to Resend → Domains → Add Domain →
   `movementmechanics.co.za`, and note the DNS records it gives you (see
   section 7 - these get bundled with the Vercel domain records and sent to
   the client together).
5. **Set environment variables** in the Vercel project (Settings →
   Environment Variables, applied to all environments):
   | Name | Value |
   |---|---|
   | `RESEND_API_KEY` | your Resend API key |
   | `TO_EMAIL` | `movementmechanics.sa@gmail.com` |
   | `RESEND_FROM` | `Movement Mechanics <no-reply@movementmechanics.co.za>` (only works once the Resend domain is verified per step 4 - use `onboarding@resend.dev` as a placeholder sender for early testing only, it will not reach the client until verification is done) |
6. Redeploy after setting environment variables so they take effect.
7. Add `movementmechanics.co.za` and `www.movementmechanics.co.za` as
   domains on the Vercel project (Settings → Domains). Vercel will show you
   the exact A/CNAME records needed.

## 6. Careers job board (optional, client-controlled)

`assets/js/careers.js` can read open roles from a Google Sheet the client
manages themselves (no code changes needed for them to post/remove a role).
If `window.MM_CAREERS_SHEET_CSV_URL` is left blank, the page falls back to
the `MM_JOBS_FALLBACK` array in the same file, or shows an "expression of
interest" prompt if that's also empty. Leave this as-is unless the client
asks you to change it - it's their content workflow, not a dev task.

## 7. DNS handoff process (client keeps domains.co.za control)

Because the client is handling their own DNS, please **batch every DNS
change into one message** rather than sending them one record at a time:

1. Complete Vercel domain setup (section 5, step 7) and Resend domain
   verification (section 5, step 4) first, so you have the full, final set
   of records.
2. Send the client one consolidated list, e.g.:
   > Please add these records in your domains.co.za DNS Zone Editor for
   > movementmechanics.co.za:
   > - A record, host `@`, value `<Vercel's exact value>`
   > - CNAME record, host `www`, value `<Vercel's exact value>`
   > - TXT/CNAME record(s) for Resend domain verification: `<Resend's exact values>`
   >
   > Please remove any old A/CNAME records pointing at previous hosting
   > first, then add these.
3. The client will add these directly (they've asked to keep DNS access
   private rather than share domains.co.za login credentials).
4. DNS propagation can take minutes to a few hours. Confirm both the Vercel
   Domains screen and the Resend Domains screen show verified before
   considering the domain live.

## 8. Acceptance checklist before calling this done

- [ ] All 9 pages load at `https://movementmechanics.co.za` and match the
      provided build (spot-check against the client's local copy if there's
      any doubt about a detail).
- [ ] Contact form: submit a real test enquiry, confirm it arrives at
      movementmechanics.sa@gmail.com, and that the page redirects to
      `contact.html?sent=1` with the success message shown.
- [ ] Careers form: submit with a CV attached (PDF or Word, under 4MB) and
      confirm the attachment actually arrives on the email, not just the
      text. Also test a submission with no CV attached.
- [ ] Submit either form with an invalid email and confirm it redirects to
      `?error=1` rather than falsely showing success.
- [ ] Mobile check on both iOS and Android (same responsive HTML/CSS for
      both, nothing platform-specific, but check anyway).
- [ ] `www.movementmechanics.co.za` redirects to the apex domain (or vice
      versa, per whichever Vercel set up) rather than 404ing.
- [ ] Google Search Console: add the property and submit
      `https://movementmechanics.co.za/sitemap.xml` once live.

## 9. Questions

Route any design, content, or scope questions to the client directly at
movementmechanics.sa@gmail.com. Route Vercel/Resend/GitHub technical
questions within your own team first - this doc plus the inline comments in
`api/contact.js` and `api/careers.js` cover the architecture decisions
already made (why Vercel Functions instead of PHP, why the 4MB CV cap, why
Resend's error handling is checked explicitly rather than relying on
try/catch alone).
