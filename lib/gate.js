/**
 * Movement Mechanics - development gate: session token signing.
 *
 * Shared by middleware.js (Edge runtime) and api/login.js (Node runtime), so
 * this sticks to Web Crypto, which exists in both.
 *
 * The cookie holds an expiry timestamp plus an HMAC of that timestamp. The
 * password is never stored in the cookie and never reaches the browser - a
 * stolen cookie grants access until it expires, but it cannot be turned back
 * into the password, and it cannot be forged without GATE_SECRET.
 */

const enc = new TextEncoder();

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

function b64url(buf) {
  let s = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Token = "<expiry-ms>.<hmac>" */
export async function signToken(secret, expiryMs) {
  const payload = String(expiryMs);
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret), enc.encode(payload));
  return `${payload}.${b64url(sig)}`;
}

/**
 * Compare without leaking length/content through timing. Overkill for a dev
 * gate, but it costs nothing and the habit is worth keeping.
 */
export function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyToken(secret, token) {
  if (!secret || !token) return false;

  const dot = token.lastIndexOf(".");
  if (dot < 1) return false;

  const expiry = Number(token.slice(0, dot));
  if (!Number.isFinite(expiry) || Date.now() > expiry) return false;

  // Re-sign the claimed expiry and check it matches the presented signature.
  const expected = await signToken(secret, expiry);
  return safeEqual(token, expected);
}

/** Read one cookie out of a request without pulling in a cookie library. */
export function readCookie(request, name) {
  const header = request.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return null;
}

export const COOKIE_NAME = "mm_gate";
export const SESSION_SECONDS = 60 * 60 * 12; // 12 hours
