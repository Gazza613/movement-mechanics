/**
 * Movement Mechanics - branded HTML email template.
 *
 * Shared by api/contact.js and api/careers.js so both notification emails
 * stay visually identical. Lives in /lib rather than /api because Vercel
 * turns every file in /api into a public endpoint - this is a helper, not
 * a route.
 *
 * Email HTML is not web HTML. The constraints driving the odd-looking
 * markup below:
 *   - Table-based layout, not flex/grid (Outlook uses the Word engine).
 *   - Every style inlined - <style> blocks are stripped by Gmail et al.
 *   - No web fonts. Anton/Inter won't load, so the display stack falls
 *     back to condensed system faces that approximate Anton's weight.
 *   - Images referenced by absolute HTTPS URL. Remote images beat base64,
 *     which Gmail refuses to render entirely.
 *   - Dark theme uses explicit hex on every cell so clients don't invert it.
 */

const LIME = "#87ff00";
const BLACK = "#050505";
const CARD = "#0a0a0a";
const PANEL = "#101010";
const BORDER = "#232323";
const WHITE = "#ffffff";
const GREY = "#a6a6a6";
const GREY_DIM = "#7a7a7a";

const FONT_DISPLAY = "'Arial Narrow', 'Helvetica Neue', Arial, sans-serif";
const FONT_BODY = "'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif";

/**
 * Escape user-supplied text before it goes anywhere near the HTML body.
 * The plain-text email never needed this; the HTML one does, or a stray
 * "<" in someone's message silently mangles the layout - and a crafted
 * one could inject markup into an email the client trusts.
 */
function esc(v) {
  return String(v == null ? "" : v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Preserve the line breaks a user typed into a <textarea>. */
function nl2br(v) {
  return esc(v).replace(/\r?\n/g, "<br>");
}

/** Render the submission timestamp in the client's own timezone, not raw UTC ISO. */
function stamp() {
  try {
    return new Intl.DateTimeFormat("en-ZA", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "Africa/Johannesburg",
    }).format(new Date()) + " (SAST)";
  } catch {
    return new Date().toISOString();
  }
}

/** One label/value row. Empty values are skipped by the caller, not rendered blank. */
function row(label, value, opts = {}) {
  const inner = opts.href
    ? `<a href="${esc(opts.href)}" style="color:${LIME};text-decoration:none;">${esc(value)}</a>`
    : esc(value);

  return `
    <tr>
      <td style="padding:0 0 2px;font-family:${FONT_BODY};font-size:11px;line-height:16px;letter-spacing:0.08em;text-transform:uppercase;color:${GREY_DIM};">${esc(label)}</td>
    </tr>
    <tr>
      <td style="padding:0 0 18px;font-family:${FONT_BODY};font-size:16px;line-height:24px;color:${WHITE};font-weight:600;border-bottom:1px solid ${BORDER};">
        <div style="padding-bottom:14px;">${inner}</div>
      </td>
    </tr>`;
}

/**
 * Build the full HTML email.
 *
 * @param {object} o
 * @param {string} o.kicker    Small lime label above the title (e.g. "NEW ENQUIRY")
 * @param {string} o.title     Big display headline
 * @param {string} o.preheader Inbox preview text (hidden in the body)
 * @param {Array}  o.fields    [{ label, value, href? }] - falsy values are dropped
 * @param {string} o.message   The free-text message body
 * @param {string} [o.badge]   Optional status chip (used for the CV attachment note)
 * @param {string} o.siteUrl   Absolute origin for images/links
 */
export function renderEmail(o) {
  const siteUrl = String(o.siteUrl || "").replace(/\/$/, "");
  const logo = `${siteUrl}/assets/img/logo-full-onDark.png`;

  const fields = (o.fields || [])
    .filter((f) => f && f.value)
    .map((f) => row(f.label, f.value, { href: f.href }))
    .join("");

  const badge = o.badge
    ? `<tr><td style="padding:0 0 24px;">
         <table role="presentation" cellpadding="0" cellspacing="0" border="0">
           <tr>
             <td style="background:rgba(135,255,0,0.1);border:1px solid rgba(135,255,0,0.35);border-radius:999px;padding:8px 16px;font-family:${FONT_BODY};font-size:13px;font-weight:600;color:${LIME};">
               ${esc(o.badge)}
             </td>
           </tr>
         </table>
       </td></tr>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${esc(o.title)}</title>
</head>
<body style="margin:0;padding:0;background:${BLACK};">

  <!-- Inbox preview line. Hidden in the body itself. -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;height:0;width:0;">
    ${esc(o.preheader || "")}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BLACK};padding:32px 16px;">
    <tr>
      <td align="center">

        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:${CARD};border:1px solid ${BORDER};border-radius:14px;overflow:hidden;">

          <!-- Lime rule across the top -->
          <tr><td style="height:4px;background:${LIME};font-size:0;line-height:0;">&nbsp;</td></tr>

          <!-- Logo -->
          <tr>
            <td style="padding:32px 32px 0;">
              <img src="${logo}" width="200" alt="Movement Mechanics" style="display:block;width:200px;max-width:60%;height:auto;border:0;outline:none;">
            </td>
          </tr>

          <!-- Kicker + title -->
          <tr>
            <td style="padding:28px 32px 0;">
              <div style="font-family:${FONT_BODY};font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${LIME};padding-bottom:8px;">
                ${esc(o.kicker)}
              </div>
              <div style="font-family:${FONT_DISPLAY};font-size:34px;line-height:38px;font-weight:700;letter-spacing:0.01em;text-transform:uppercase;color:${WHITE};">
                ${esc(o.title)}
              </div>
            </td>
          </tr>

          <!-- Detail fields -->
          <tr>
            <td style="padding:32px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${fields}
              </table>
            </td>
          </tr>

          ${badge ? `<tr><td style="padding:24px 32px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${badge}</table></td></tr>` : ""}

          <!-- Message -->
          <tr>
            <td style="padding:8px 32px 0;">
              <div style="font-family:${FONT_BODY};font-size:11px;line-height:16px;letter-spacing:0.08em;text-transform:uppercase;color:${GREY_DIM};padding-bottom:10px;">Message</div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${PANEL};border-left:3px solid ${LIME};border-radius:0 8px 8px 0;">
                <tr>
                  <td style="padding:18px 20px;font-family:${FONT_BODY};font-size:15px;line-height:24px;color:${GREY};">
                    ${nl2br(o.message) || "<em style=\"color:#4a4a4a;\">No message provided.</em>"}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Reply hint -->
          <tr>
            <td style="padding:28px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${BORDER};">
                <tr>
                  <td style="padding-top:20px;font-family:${FONT_BODY};font-size:13px;line-height:20px;color:${GREY_DIM};">
                    Hit <strong style="color:${GREY};">Reply</strong> to respond directly to the sender.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px 32px;">
              <div style="font-family:${FONT_BODY};font-size:12px;line-height:18px;color:#4a4a4a;">
                Submitted ${esc(stamp())}<br>
                Sent automatically by the <a href="${esc(siteUrl)}" style="color:${GREY_DIM};text-decoration:none;">movementmechanics.co.za</a> website.
              </div>
            </td>
          </tr>

        </table>

        <div style="font-family:${FONT_BODY};font-size:11px;line-height:16px;color:#3a3a3a;padding-top:20px;">
          Movement Mechanics &middot; Performance Testing &amp; Movement Science
        </div>

      </td>
    </tr>
  </table>

</body>
</html>`;
}
