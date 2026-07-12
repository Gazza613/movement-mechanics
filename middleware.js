/**
 * Movement Mechanics - development gate.
 *
 * Puts the whole site behind a login while it is still in development. Runs
 * as Vercel Edge Middleware, so it intercepts *static* pages too - a plain
 * Vercel Function could not do this, because static HTML never reaches one.
 *
 * Controlled entirely by environment variables. To take the gate off, set
 * GATE_ENABLED=0 and redeploy - no code change, no revert:
 *
 *   GATE_ENABLED   "1" to gate the site, anything else to open it
 *   GATE_USER      the username (an email address, compared case-insensitively)
 *   GATE_PASSWORD  the password - set in Vercel only, never committed
 *   GATE_SECRET    long random string used to sign the session cookie
 *
 * If GATE_ENABLED is on but the other three are missing, the site is left
 * OPEN rather than locking everyone out of a live site over a config typo.
 * That is a deliberate choice: this gate hides an in-development site, it is
 * not a security boundary around anything sensitive.
 */

import { next } from "@vercel/edge";
import { COOKIE_NAME, readCookie, verifyToken } from "./lib/gate.js";

export const config = {
  // Everything except Vercel's own internals.
  matcher: "/((?!_vercel).*)",
};

/**
 * Reachable without a session. Deliberately narrow: the login page, the
 * endpoint that authenticates it, and only the assets that page needs to
 * render. Everything else - all 9 pages, the forms, the gallery images - is
 * behind the gate.
 */
const PUBLIC_PATHS = new Set([
  "/login.html",
  "/api/login",
  "/api/logout",
  "/assets/css/styles.css",
  "/assets/img/logo-full-onDark.png",
  "/assets/img/mark-lime.png",
  "/favicon.ico",
  "/favicon-16.png",
  "/favicon-32.png",
  "/favicon-192.png",
  "/apple-touch-icon.png",
]);

export default async function middleware(request) {
  if (process.env.GATE_ENABLED !== "1") return next();

  const secret = process.env.GATE_SECRET;
  const user = process.env.GATE_USER;
  const pass = process.env.GATE_PASSWORD;

  // Misconfigured: fail open. Locking a live client site out of the world
  // because someone fat-fingered an env var name is the worse failure.
  if (!secret || !user || !pass) return next();

  const url = new URL(request.url);
  if (PUBLIC_PATHS.has(url.pathname)) return next();

  const token = readCookie(request, COOKIE_NAME);
  if (await verifyToken(secret, token)) return next();

  // Send them to the login page, remembering where they were headed.
  const login = new URL("/login.html", url.origin);
  const wanted = url.pathname + url.search;
  if (wanted && wanted !== "/") login.searchParams.set("next", wanted);

  return Response.redirect(login, 302);
}
