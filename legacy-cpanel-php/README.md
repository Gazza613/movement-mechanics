# Legacy cPanel PHP handlers (not used on Vercel)

`contact-handler.php` and `careers-handler.php` were the original form
handlers for the site when it was planned for cPanel/PHP hosting via
domains.co.za. They're kept here for reference only.

**These are not deployed** - they live outside the site root that gets
pushed live, so Vercel never sees them (Vercel doesn't run PHP anyway).
The live site now uses `/api/contact.js` and `/api/careers.js` (Node
serverless functions using Resend for email) instead. See `DEPLOYMENT.md`
in the project root for the full explanation and setup steps.

If Movement Mechanics ever moves back to cPanel/PHP hosting instead of
Vercel, these two files can be copied back into the site root and the two
form `action` attributes in `contact.html` / `careers.html` switched back
from `/api/contact` and `/api/careers` to `contact-handler.php` and
`careers-handler.php`.
