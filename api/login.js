/**
 * Movement Mechanics - development gate: login + logout.
 *
 * Validates the credentials against the GATE_USER / GATE_PASSWORD environment
 * variables and, on success, sets a signed, HttpOnly session cookie. The
 * password itself is never written to the cookie and never exposed to
 * client-side JavaScript.
 */

import { COOKIE_NAME, SESSION_SECONDS, safeEqual, signToken } from "../lib/gate.js";

function redirect(location, cookie) {
  const headers = { Location: location };
  if (cookie) headers["Set-Cookie"] = cookie;
  return new Response(null, { status: 302, headers });
}

/**
 * Only ever redirect to a path on this site. Without this check, a crafted
 * ?next=https://evil.example would turn the login into an open redirect -
 * hand someone a link, they log in for real, and land somewhere hostile.
 */
function safeNext(value) {
  const v = String(value || "");
  if (!v.startsWith("/") || v.startsWith("//")) return "/";
  return v;
}

export async function POST(request) {
  const secret = process.env.GATE_SECRET;
  const expectedUser = process.env.GATE_USER;
  const expectedPass = process.env.GATE_PASSWORD;

  let form;
  try {
    form = await request.formData();
  } catch {
    return redirect("/login.html?error=1");
  }

  const next = safeNext(form.get("next"));

  if (!secret || !expectedUser || !expectedPass) {
    return redirect("/login.html?error=config");
  }

  const username = String(form.get("username") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");

  // Both compared before branching, so a wrong username and a wrong password
  // take the same path out.
  const userOk = safeEqual(username, expectedUser.trim().toLowerCase());
  const passOk = safeEqual(password, expectedPass);

  if (!userOk || !passOk) {
    return redirect(`/login.html?error=1${next !== "/" ? `&next=${encodeURIComponent(next)}` : ""}`);
  }

  const token = await signToken(secret, Date.now() + SESSION_SECONDS * 1000);

  // HttpOnly  - unreadable from JavaScript, so an XSS bug cannot steal it.
  // Secure    - HTTPS only.
  // SameSite  - not sent on cross-site requests.
  const cookie = [
    `${COOKIE_NAME}=${token}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    `Max-Age=${SESSION_SECONDS}`,
  ].join("; ");

  return redirect(next, cookie);
}

export async function GET() {
  return redirect("/login.html");
}
