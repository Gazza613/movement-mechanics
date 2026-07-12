# Deployment plan: GitHub → Vercel → domains.co.za

> **Note for the development agency:** this document was originally written
> for the client to self-deploy under their own GitHub/Vercel/Resend
> accounts. For this handoff, **`AGENCY-ONBOARDING.md` is the authoritative
> document** - it covers the same technical ground but reflects the actual
> ownership model (your agency owns GitHub/Vercel/Resend, the client keeps
> domains.co.za) and the required Resend domain verification step. The
> architecture explanation below (why Vercel Functions replaced PHP, the
> 4MB CV cap, etc.) still applies as-is.

This replaces the old cPanel/PHP hosting plan in `README.md`. Hand this file
to whoever is doing the build (yourself in Codespaces, or Claude inside
Codespaces) - it's written as an ordered checklist.

## What changed and why

Vercel does not run PHP. `contact-handler.php` and `careers-handler.php`
(the two form handlers) have been **replaced** with:

- `api/contact.js` - handles the contact/booking form
- `api/careers.js` - handles the careers application form, including the
  optional CV attachment

These are Vercel Functions (small Node.js programs that live in `/api` and
run on demand - no server to manage). They do the same job the PHP files
did - validate the form, email the submission to
`movementmechanics.sa@gmail.com`, redirect back to the page with
`?sent=1` or `?error=1` - just using [Resend](https://resend.com) to send
the email instead of PHP's `mail()`.

The old PHP files are kept in `legacy-cpanel-php/` for reference only -
they are **not** part of the deployed site and can be ignored unless you
ever move back to cPanel hosting.

One behavior change: the CV attachment limit dropped from 5MB to **4MB**,
because Vercel caps a single Function request at ~4.5MB. This is already
updated on the form's helper text and the client-side check in
`assets/js/careers.js` - nothing else to do here.

All images live in `assets/img/` inside this project folder already -
there's nothing separate to migrate. Whatever gets pushed to GitHub is
what Vercel serves, images included.

---

## Step 1 - Create a Resend account (for form emails)

Vercel Functions can't use PHP's `mail()`, so form emails now go through
Resend - a transactional email API with a generous free tier (3,000
emails/month, more than enough for this site).

1. Go to [resend.com](https://resend.com) and sign up using
   **movementmechanics.sa@gmail.com** (this matters - see note below).
2. In the Resend dashboard, go to **API Keys** → **Create API Key**. Name
   it something like `movement-mechanics-website` and copy the key
   (starts with `re_`). You won't be able to see it again - if you lose
   it, just create a new one.
3. Keep that key somewhere safe for a minute - you'll paste it into
   Vercel in Step 3.

**Why sign up with movementmechanics.sa@gmail.com specifically:** until
you verify movementmechanics.co.za as a sending domain in Resend, emails
can only be sent *from* `onboarding@resend.dev` and *to* the address the
Resend account was created with. Since the forms already send to
`movementmechanics.sa@gmail.com`, signing up with that same address means
everything works immediately with zero extra setup. You can upgrade to a
branded sender later (see "Optional: branded sender" at the end) whenever
you have a few minutes to add some DNS records.

---

## Step 2 - Push this project to GitHub

If you're doing this from GitHub Codespaces with Claude as your coding
assistant, this is the part to hand it:

1. Create a new, empty repository on GitHub (e.g. `movement-mechanics-site`).
   Don't initialize it with a README/gitignore - this project already has
   both.
2. Open this `Website` folder in a Codespace (or push it into the new repo
   from wherever it currently lives). From a terminal in that folder:
   ```bash
   git init
   git add .
   git commit -m "Initial site - static pages + Vercel form functions"
   git branch -M main
   git remote add origin https://github.com/<your-username>/movement-mechanics-site.git
   git push -u origin main
   ```
3. Confirm on github.com that `assets/img/`, `api/`, all the `.html`
   files, `package.json`, and `.gitignore` all show up in the repo. If
   `assets/img/` looks empty or partial, the push didn't finish - re-run
   `git push`.

From here on, **every `git push` to `main` is what goes live** once
Vercel is connected (Step 3) - that's the "auto-push to Vercel" workflow
you described.

---

## Step 3 - Connect the repo to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (use **Continue
   with GitHub** so the two are linked automatically).
2. Click **Add New… → Project**, and select the `movement-mechanics-site`
   repo you just pushed.
3. Framework Preset: leave it as **Other** (this is a static site with a
   couple of Functions, not a framework app) - no build command, no
   output directory override needed. Click **Deploy**.
4. Once the first deploy finishes, go to **Settings → Environment
   Variables** on the project and add:
   | Name | Value |
   |---|---|
   | `RESEND_API_KEY` | the `re_...` key from Step 1 |
   | `TO_EMAIL` | `movementmechanics.sa@gmail.com` (optional - this is already the default) |

   Apply it to all environments (Production, Preview, Development).
5. Go to **Deployments**, open the latest one, and click **Redeploy** so
   the new environment variables take effect.
6. Visit the `*.vercel.app` URL Vercel gives you and test both forms
   right there before touching DNS (see the testing checklist below).

From now on, **every push to `main` auto-deploys to production**, and
every push to any other branch (or pull request) gets its own preview
URL - so if Claude in Codespaces is making changes on a branch, you get a
safe preview link before it ever touches the live site.

---

## Step 4 - Point movementmechanics.co.za at Vercel

domains.co.za stays exactly where it is - it's just doing DNS now
instead of hosting.

1. In the Vercel project, go to **Settings → Domains** → **Add Domain**,
   type `movementmechanics.co.za`, and add it. Vercel will also suggest
   adding `www.movementmechanics.co.za` - accept that too (Vercel will
   automatically redirect one to the other).
2. Vercel will show you the exact DNS records to add - typically:
   - An **A** record for the apex domain (`movementmechanics.co.za`)
   - A **CNAME** record for `www`
   Use the **exact values Vercel displays on that screen** rather than
   values from an old guide - Vercel sometimes assigns project-specific
   CNAME targets.
3. Log in to your domains.co.za client area → the domain's **DNS Zone
   Editor** (sometimes called DNS Management) and add those two records,
   matching the values from Vercel exactly. Remove any existing A/CNAME
   records for `@` and `www` that point somewhere else first (e.g. old
   cPanel hosting IPs), or they'll conflict.
4. DNS changes can take anywhere from a few minutes to a few hours to
   propagate. The Domains screen in Vercel will show a green checkmark
   once it verifies.

---

## Step 5 - Test everything live

Once the domain shows as verified in Vercel:

- [ ] Load `https://movementmechanics.co.za` and click through all 9
      pages.
- [ ] Submit the contact form with real details and confirm the email
      arrives at movementmechanics.sa@gmail.com within a minute or two,
      and that you land back on `contact.html?sent=1` with the success
      message.
- [ ] Submit the careers form **with a CV attached** (PDF or Word, under
      4MB) and confirm the attachment actually arrives on the email, not
      just the text.
- [ ] Submit the careers form **without** a CV and confirm it still
      sends fine ("No CV attached." note in the email body).
- [ ] Try a fake/invalid email address in either form and confirm it
      redirects to `?error=1` instead of pretending to succeed.
- [ ] Check the site on a phone (both iOS and Android are fine - it's
      the same responsive HTML/CSS for everyone, nothing OS-specific).
- [ ] In the Vercel dashboard, check **Deployments → [latest] → Functions
      → Logs** if anything above didn't work - errors from Resend
      (bad key, rate limit, etc.) get logged there.

---

## Ongoing workflow

This matches how you already work:

1. Open the repo in a Codespace, make changes (with Claude assisting as
   usual).
2. Commit and push. Pushing to `main` deploys to
   `movementmechanics.co.za` automatically within about a minute -
   pushing to any other branch gives you a preview link first if you'd
   rather check before it's live.
3. No separate "upload to host" step, no FTP, no cPanel File Manager -
   the push *is* the deploy.

---

## Optional: branded sender ("no-reply@movementmechanics.co.za")

Not required to launch - `onboarding@resend.dev` works fine from day
one for this site. When you have a few spare minutes:

1. In Resend, go to **Domains → Add Domain**, enter
   `movementmechanics.co.za`.
2. Resend will give you 2-3 DNS records (usually TXT and CNAME) - add
   those in the same domains.co.za DNS Zone Editor you used in Step 4.
3. Once Resend shows the domain as verified, go back to the Vercel
   project's environment variables and add:
   | Name | Value |
   |---|---|
   | `RESEND_FROM` | `Movement Mechanics Website <no-reply@movementmechanics.co.za>` |
4. Redeploy. Emails will now come from your own domain instead of
   resend.dev, which looks more professional and avoids any chance of
   `onboarding@resend.dev` being rate-limited or flagged over time.

---

## If something needs to roll back

The old PHP handlers are untouched in `legacy-cpanel-php/`. To go back to
cPanel hosting: copy those two files into the project root, and in
`contact.html` / `careers.html` change the form `action` attributes from
`/api/contact` and `/api/careers` back to `contact-handler.php` and
`careers-handler.php`, then upload the folder to `public_html` per the
old instructions still in `README.md`.
