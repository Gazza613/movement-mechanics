# Movement Mechanics - working rules

This is a **client-approved production website**. It is live at
https://movementmechanics.co.za and serves a real business.

Change requests arrive from the client through the `/admin` dashboard and land
here as GitHub issues. Read these rules before touching anything.

## 1. The fidelity mandate - this overrides your instincts

The client signed off on this design after several iterations. It was handed
over with an explicit instruction to reproduce it **forensically - pixel for
pixel, interaction for interaction**.

**Make only the change that was asked for. Nothing else.**

Specifically, do **not**:

- "Improve", modernise, refactor or tidy anything you were not asked to change
- Substitute fonts, colours, spacing or layout
- Swap out images or icons
- Rewrite copy you were not asked to rewrite
- Remove or simplify the interactive details (preloader, scroll-runner
  indicator, card tilt, carousel, lightbox, scroll reveals, tabs, count-up
  stats). These were built to the client's explicit spec and are final.
- Reformat files, reorder CSS, or make sweeping whitespace changes - they bury
  the real change in an unreviewable diff

If a request seems to require a redesign, or you think something is a bug: **say
so in the pull request description and do the minimum**. Do not fix it
unilaterally. A human reviews every change before it goes live - flagging a
concern is always better than acting on it.

## 2. Files you must never modify

These carry secrets, authentication, or the email pipeline. A mistake here
takes the live site down or leaks credentials. **They are out of scope for
every dashboard request, without exception.**

- `middleware.js` - the site's authentication gate
- `lib/gate.js` - session signing
- `api/**` - all serverless functions (contact form, careers form, login)
- `.github/**` - CI configuration
- `.claude/**` - permission rules
- `package.json`, `package-lock.json` - dependencies
- `CLAUDE.md` - this file

If a request genuinely requires changing one of these, **stop and say so in the
PR** rather than doing it. A developer will handle it.

## 3. What you can change

- The 9 page files: `index.html`, `about.html`, `programs.html`, `schools.html`,
  `research-development.html`, `gallery.html`, `ambassadors.html`,
  `careers.html`, `contact.html`
- `assets/css/styles.css`
- `assets/js/main.js`, `assets/js/careers.js`
- `sitemap.xml`, `robots.txt`
- Images in `assets/img/`

## 4. House style

- Plain static HTML/CSS/JS. **No framework, no build step, no new dependencies.**
- Use the existing CSS custom properties in `:root` (`--lime`, `--black`,
  `--font-display`, etc). Never hardcode a hex value that already has a variable.
- Match the surrounding code's naming, indentation and comment density.
- The site must keep working with JavaScript disabled for core content.
- Every page shares the same header/footer markup. **A change to one usually
  needs the same change to all nine** - check before you finish.

## 5. Brand

- Lime `#87ff00` on near-black `#050505`
- Display type: Anton (uppercase). Body: Inter.
- Phone: 072 823 2784. Email: movementmechanics.sa@gmail.com

## 6. Before you open the PR

- Change only the files the request requires
- Re-read the diff. If it contains anything the client did not ask for, remove it
- Write a PR description a **non-technical person** can understand: what changed,
  which pages, and anything you chose not to do and why
- **Never merge.** A human approves every change.
