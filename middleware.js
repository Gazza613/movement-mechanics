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

/**
 * The admin dashboard is ALWAYS behind the login, whether or not the
 * development gate is on. When the site goes public (GATE_ENABLED=0), the
 * pages open up - but "/admin" absolutely must not, or it becomes a public
 * button for editing the client's website.
 */
function isAdminPath(pathname) {
  return pathname === "/admin.html" || pathname.startsWith("/api/admin/");
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const gateOn = process.env.GATE_ENABLED === "1";
  const admin = isAdminPath(url.pathname);

  // Nothing to protect: gate is off and this isn't an admin route.
  if (!gateOn && !admin) return next();

  const secret = process.env.GATE_SECRET;
  const user = process.env.GATE_USER;
  const pass = process.env.GATE_PASSWORD;

  if (!secret || !user || !pass) {
    // Admin routes FAIL CLOSED - a misconfigured env var must never expose the
    // dashboard. The public site FAILS OPEN, because locking a live client
    // site out of the world over a typo is the worse failure.
    return admin
      ? new Response("Admin is not configured.", { status: 503 })
      : next();
  }

  if (!admin && PUBLIC_PATHS.has(url.pathname)) return next();

  const token = readCookie(request, COOKIE_NAME);
  if (await verifyToken(secret, token)) return next();

  // Send them to the login page, remembering where they were headed.
  const login = new URL("/login.html", url.origin);
  const wanted = url.pathname + url.search;
  if (wanted && wanted !== "/") login.searchParams.set("next", wanted);

  return Response.redirect(login, 302);
}
