# Movement Mechanics - Website

A 9-page static site for movementmechanics.co.za: Home, About, Programs & Rates,
Schools, Research & Development (IMPACT), Gallery, Ambassadors, Careers, and
Contact/Booking.

## Developer agency - start here

This is a handoff package. **Read `AGENCY-ONBOARDING.md` first** - it
covers the design-fidelity mandate, account ownership, environment
variables, and the DNS handoff process for this specific engagement.
`DEPLOYMENT.md` still has useful technical detail (it was originally
written for the client to self-deploy) but `AGENCY-ONBOARDING.md` is the
authoritative document for this handoff.

The site deploys via **GitHub → Vercel**, with domains.co.za used only
for DNS.

The cPanel/PHP hosting path below is legacy - kept for reference only.
The matching PHP files live in `legacy-cpanel-php/`.

## What's inside

```
index.html                   Home
about.html                   About Us
programs.html                Programs & Rates (Private / Group & Workshops / House Calls / Schools tabs)
schools.html                 For Schools - dashboard preview + testing booking
research-development.html    Research & Development (IMPACT)
gallery.html                 Photo gallery with lightbox
ambassadors.html             Ambassadors & Partners
careers.html                 Careers - open roles + expression-of-interest form
contact.html                 Contact + booking enquiry form
api/contact.js               Contact form handler (Vercel Function + Resend)
api/careers.js               Careers form handler (Vercel Function + Resend, CV attachment)
package.json                 Node dependencies for the two /api functions
DEPLOYMENT.md                Full GitHub -> Vercel -> domains.co.za deployment plan
legacy-cpanel-php/           Old PHP mail() handlers, kept for reference only (not deployed)
sitemap.xml, robots.txt      SEO files
favicon.ico, favicon-*.png, apple-touch-icon.png
assets/css/styles.css        All site styling
assets/js/main.js            Preloader, nav, tabs, carousel, lightbox, animations
assets/js/careers.js         Job board rendering (reads from a Google Sheet - see below)
assets/img/                  Logos and photography
```

## Legacy: going live on movementmechanics.co.za via cPanel (domain.co.za hosting)

This section is no longer the primary deployment path (see `DEPLOYMENT.md`)
but is kept in case you ever move back to traditional PHP hosting.

domain.co.za hosting packages run on **cPanel with PHP support**, which this
site was originally built for. Two ways to upload:

**Option A - cPanel File Manager (easiest, no extra software)**
1. Log in to your domain.co.za client area and open **cPanel**.
2. Open **File Manager** → navigate to `public_html` (this is the web root for
   movementmechanics.co.za).
3. If there's a placeholder `index.html` already there, delete it.
4. Copy `contact-handler.php` and `careers-handler.php` from
   `legacy-cpanel-php/` back into the project root, and switch the form
   `action` attributes in `contact.html`/`careers.html` back to those
   filenames (see the note at the bottom of `DEPLOYMENT.md`).
5. Upload every file and folder from this `Website` folder into `public_html`
   (drag-and-drop, or zip this folder first, upload the zip, then use
   File Manager's "Extract" option). Skip `api/`, `package.json`, and
   `legacy-cpanel-php/` - they're not needed on PHP hosting.
6. Visit https://movementmechanics.co.za - it should load immediately.

**Option B - FTP**
1. In cPanel, create/find your FTP login under **FTP Accounts**.
2. Connect with any FTP client (FileZilla, Cyberduck) using those details.
3. Upload the contents of this folder into `public_html`.

No build step, no npm, no server restart required - it's all static HTML/CSS/JS
plus two small PHP files for the forms.

## What's new in this update

- **Phone number wired in everywhere**: 072 823 2784 is now clickable in the
  header, footer, contact page, and the sticky mobile call bar (Call /
  WhatsApp / Book, visible on phones). The floating WhatsApp button is now
  live and pre-filled with this number.
- **Running-men logo** now features on the homepage hero and in a scrolling
  marquee strip for extra motion/energy.
- **Programs page** is now tabbed: Private Sessions (running mechanics,
  balance & coordination, agility & speed, fundamental movement patterns),
  Group Sessions & Workshops (with a Holiday Performance Clinic example),
  At-Home House Calls, and School Testing.
- **New Schools page** (`schools.html`) with an interactive sample testing
  dashboard preview (animated stat cards and bars) and a "Book School
  Testing" flow into the contact form.
- **New Gallery page** (`gallery.html`) with a click-to-enlarge lightbox.
  Built from your existing branded photography only - see note below on
  client footage.
- **Testimonials carousel** added to the homepage - currently clearly-marked
  placeholder slots, not invented quotes (see checklist below).
- General interactivity pass: tilting cards, tabs, auto-rotating carousel,
  animated count-up stats, scroll reveals throughout.
- **New Careers page** (`careers.html`), linked from the footer only (not the
  main nav). Frames Movement Mechanics as a young, vibrant company giving
  opportunities to up-and-coming sports scientists and business people. Job
  listings are pulled from a Google Sheet you control - no coding needed to
  post or remove a role (full setup steps below). Includes an
  expression-of-interest / internship application form and a LinkedIn CTA.
- **LinkedIn icon** added to the footer alongside Instagram and Facebook, on
  every page.
- **Mobile testing unit given top billing** on the homepage: a new "Testing,
  wherever you are" feature covers Schools, Clubs, the Sports Science
  Institute, and at-home visits, with a photo of athletes mid-sprint-drill.
  The Programs page and contact form now also reference the Sports Science
  Institute as a testing venue, and the enquiry form has a new "Preferred
  Testing Location" field.

## Setting up the Careers job board (no coding required)

`careers.html` reads its list of open roles from a Google Sheet, so you (or
anyone on the team) can post or remove a job without touching any code:

1. Create a Google Sheet with these exact column headers in row 1: `Title`,
   `Type`, `Location`, `Blurb`, `Active`.
   - Example row: `Sports Science Intern` | `Internship · 6 months` |
     `Cape Town - Newlands base + mobile unit travel` |
     `Support testing days, data capture and reporting.` | `yes`
   - Set `Active` to `no` to hide a role without deleting it.
2. In Google Sheets: **File → Share → Publish to web** → choose the sheet →
   format **Comma-separated values (.csv)** → **Publish** → copy the link.
3. Open `assets/js/careers.js` and paste that link into
   `window.MM_CAREERS_SHEET_CSV_URL = "";` between the quotes.
4. Re-upload `careers.js` to your host. From then on, editing the sheet
   updates the careers page automatically (Google re-publishes it every few
   minutes) - no further file changes needed.

If you'd rather skip Google Sheets entirely, edit the `MM_JOBS_FALLBACK` array
near the top of the same file directly - it uses the same fields.

Applications submitted through the form on `careers.html` are emailed to
movementmechanics.sa@gmail.com via `api/careers.js` (see `DEPLOYMENT.md`),
the same way the main contact form works. Applicants can optionally attach
a CV/resume (PDF, .doc or .docx, up to 4MB) - it arrives as a normal email
attachment, no extra setup needed. If attachments ever stop arriving,
check the Function logs in the Vercel dashboard (Deployments → latest →
Functions → Logs) for the actual error from Resend.

## Before you launch - a short checklist

1. **Testimonials** - the homepage carousel (`index.html`, search for
   "Placeholder Quote") has 3 sample slots. Swap in 2-4 real quotes from
   clients, parents, or schools with their name/team.
2. **Gallery - client footage** - your Clients folder has real testing videos
   (Salie, Sidney, Michael Forner, Sam Jeffery, Amilie Smith, Maria van der
   Vyver), but these weren't used since they don't look pre-cleared for public
   marketing use, and a couple may involve minors. If you get signed
   consent from specific clients to feature their footage publicly, send me
   the names and I'll add them to `gallery.html`.
3. **Social links** - LinkedIn is already set to the real page
   (linkedin.com/company/movement-mechanics-sa). The Instagram/Facebook
   icons in the footer still point to `#` - search each HTML file for
   `aria-label="Instagram"` and `aria-label="Facebook"` and update the
   `href` values once those pages exist.
4. **Careers job board** - set up the Google Sheet (see section above) and
   post your first role, or leave it empty - the page gracefully shows an
   "expression of interest" prompt instead when there are no open roles.
5. **Test the contact form** once it's live - submit a real enquiry and
   confirm it arrives at movementmechanics.sa@gmail.com (see `DEPLOYMENT.md`
   for the Resend setup this depends on).
6. **Google Search Console** - once live, add the site at
   search.google.com/search-console, verify ownership, and submit
   `https://movementmechanics.co.za/sitemap.xml`.
7. **Founder photos** - the About page uses cropped versions of the photos
   from your old website mockup (low resolution). Swap in high-res headshots
   of Jordan and Trevino when you have them.
8. **Ambassadors page** - add real partner logos and links as they're
   confirmed (currently placeholder cards for The Recovery Lab, Rhino, and an
   open slot).

## Notes on images

Two stock photos found in your Branding folder (an iStock-watermarked lab
photo and a Freepik-style "neon runner" illustration) were **not** used on the
site, since their licensing for commercial web use isn't confirmed. Everything
used instead is your own branded photography, renders, or product imagery.

## Performance & SEO already built in

- Every page has a unique title, meta description, canonical URL and Open
  Graph/Twitter tags.
- JSON-LD structured data (SportsActivityLocation) on the homepage.
- Images compressed and resized for fast loading.
- Semantic HTML, descriptive alt text, mobile-first responsive layout.
- `robots.txt` + `sitemap.xml` (now including Schools, Gallery and Careers) included.
