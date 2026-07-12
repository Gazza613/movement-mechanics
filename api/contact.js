/**
 * Movement Mechanics - contact form handler (Vercel Function).
 * Replaces the old contact-handler.php - Vercel doesn't run PHP, so this
 * does the same job (validate, send email, redirect back with ?sent=1 or
 * ?error=1) using Node + Resend instead of PHP's mail().
 *
 * Uses Vercel's Web-standard function signature (Request in, Response out)
 * with the native request.formData() parser - no extra body-parsing
 * dependency needed.
 *
 * Requires one environment variable in the Vercel project settings:
 *   RESEND_API_KEY   - from resend.com (free tier is plenty for this volume)
 * Optional:
 *   TO_EMAIL          - defaults to movementmechanics.sa@gmail.com
 *   RESEND_FROM       - defaults to onboarding@resend.dev (see DEPLOYMENT.md
 *                        for switching to a verified movementmechanics.co.za sender)
 */

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const TO_EMAIL = process.env.TO_EMAIL || "movementmechanics.sa@gmail.com";
const FROM_EMAIL = process.env.RESEND_FROM || "Movement Mechanics Website <onboarding@resend.dev>";
const SITE_NAME = "Movement Mechanics";

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
    return redirect("/contact.html?error=1");
  }

  const get = (k) => clean(form.get(k));

  // Honeypot spam trap - if filled in, silently pretend success and bail
  if (get("website")) {
    return redirect("/contact.html?sent=1");
  }

  const name = get("name");
  const email = get("email");
  const phone = get("phone");
  const service = get("service");
  const athletes = get("athletes");
  const dates = get("dates");
  const venue = get("venue");
  const message = get("message");

  if (!name || !email || !service || !message || !isValidEmail(email)) {
    return redirect("/contact.html?error=1");
  }

  const textBody = [
    "New website enquiry",
    "----------------------------------------",
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    `Service Interest: ${service}`,
    `Number of Athletes: ${athletes}`,
    `Preferred Date(s): ${dates}`,
    `Preferred Testing Location: ${venue}`,
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
      subject: `New enquiry from ${SITE_NAME} website - ${service}`,
      text: textBody,
    });
    if (result.error) {
      console.error("Resend send error (contact):", result.error);
      return redirect("/contact.html?error=1");
    }
    return redirect("/contact.html?sent=1");
  } catch (err) {
    console.error("Resend send threw (contact):", err);
    return redirect("/contact.html?error=1");
  }
}

export async function GET() {
  return redirect("/contact.html");
}
