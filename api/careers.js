/**
 * Movement Mechanics - careers / expression-of-interest form handler
 * (Vercel Function). Replaces the old careers-handler.php - Vercel doesn't
 * run PHP, so this does the same job (validate, optionally attach a CV,
 * send email, redirect back with ?sent=1 or ?error=1) using Node + Resend
 * instead of PHP's mail().
 *
 * Uses Vercel's Web-standard function signature (Request in, Response out)
 * with the native request.formData() parser, which handles multipart file
 * uploads directly (the CV field arrives as a standard File object) - no
 * extra body-parsing dependency needed.
 *
 * Requires one environment variable in the Vercel project settings:
 *   RESEND_API_KEY   - from resend.com (free tier is plenty for this volume)
 * Optional:
 *   TO_EMAIL          - defaults to movementmechanics.sa@gmail.com
 *   RESEND_FROM       - defaults to onboarding@resend.dev
 *
 * NOTE on file size: Vercel Functions cap the total request body at ~4.5MB,
 * slightly under the 5MB the old PHP handler allowed. MAX_BYTES below is
 * set to 4MB to leave headroom for the rest of the form fields - the
 * client-side check in assets/js/careers.js is kept in sync with this.
 */

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const TO_EMAIL = process.env.TO_EMAIL || "movementmechanics.sa@gmail.com";
const FROM_EMAIL = process.env.RESEND_FROM || "Movement Mechanics Website <onboarding@resend.dev>";
const SITE_NAME = "Movement Mechanics";
const MAX_BYTES = 4 * 1024 * 1024; // 4MB - stays under Vercel's ~4.5MB request cap
const ALLOWED_EXT = ["pdf", "doc", "docx"];
const ALLOWED_MIME = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/octet-stream",
];

function clean(v) {
  return String(v || "").trim();
}

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function redirect(location) {
  return new Response(null, { status: 302, headers: { Location: location } });
}

export async function POST(request) {
  let form;
  try {
    form = await request.formData();
  } catch (err) {
    return redirect("/careers.html?error=1");
  }

  const get = (k) => clean(form.get(k));

  // Honeypot spam trap - if filled in, silently pretend success and bail
  if (get("website")) {
    return redirect("/careers.html?sent=1");
  }

  const name = get("name");
  const email = get("email");
  const phone = get("phone");
  const role = get("role");
  const link = get("link");
  const message = get("message");

  if (!name || !email || !message || !isValidEmail(email)) {
    return redirect("/careers.html?error=1");
  }

  // ---- Handle the optional CV attachment ----
  let attachments = [];
  let attachmentNote = "No CV attached.";
  const cvFile = form.get("cv");

  if (cvFile && typeof cvFile === "object" && cvFile.size > 0) {
    const originalName = cvFile.name || "cv";
    const ext = originalName.split(".").pop().toLowerCase();
    const mime = cvFile.type || "";

    if (!ALLOWED_EXT.includes(ext)) {
      attachmentNote = `CV attachment skipped - file type not allowed (${originalName}).`;
    } else if (cvFile.size > MAX_BYTES) {
      attachmentNote = `CV attachment skipped - file was over 4MB (${originalName}).`;
    } else if (mime && !ALLOWED_MIME.includes(mime)) {
      attachmentNote = `CV attachment skipped - could not verify file type (${originalName}).`;
    } else {
      try {
        const buf = Buffer.from(await cvFile.arrayBuffer());
        attachments.push({ filename: originalName, content: buf.toString("base64") });
        attachmentNote = `CV attached: ${originalName}`;
      } catch (err) {
        console.error("CV read failed:", err);
        attachmentNote = "CV attachment skipped - could not read the uploaded file.";
      }
    }
  }

  const textBody = [
    "New careers / expression of interest submission",
    "----------------------------------------",
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    `Role / Area of Interest: ${role}`,
    `LinkedIn / Portfolio Link: ${link}`,
    attachmentNote,
    "----------------------------------------",
    `Message:\n${message}`,
    "----------------------------------------",
    `Submitted: ${new Date().toISOString()}`,
  ].join("\n");

  try {
    // IMPORTANT: the Resend SDK does NOT throw on API failures - it resolves
    // with { data: null, error: {...} }. Checking result.error is what
    // actually catches a bad API key / rejected send, not just the try/catch.
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      replyTo: `${name} <${email}>`,
      subject: `New careers application - ${SITE_NAME}${role ? ` (${role})` : ""}`,
      text: textBody,
      attachments,
    });
    if (result.error) {
      console.error("Resend send error (careers):", result.error);
      return redirect("/careers.html?error=1");
    }
    return redirect("/careers.html?sent=1");
  } catch (err) {
    console.error("Resend send threw (careers):", err);
    return redirect("/careers.html?error=1");
  }
}

export async function GET() {
  return redirect("/careers.html");
}
