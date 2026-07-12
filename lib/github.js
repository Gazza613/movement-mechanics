/**
 * Movement Mechanics - thin GitHub REST client for the /admin dashboard.
 *
 * The dashboard never edits the site itself. It opens a GitHub issue tagged
 * @claude, which triggers the Claude Code Action; Claude does the work on
 * GitHub's runners and opens a pull request. This file is just the glue.
 *
 * Requires two environment variables:
 *   GITHUB_REPO   e.g. "Gazza613/movement-mechanics"
 *   GITHUB_TOKEN  fine-grained PAT: Contents RW, Issues RW, Pull requests RW
 *
 * The token is scoped to this one repository and cannot merge to a protected
 * branch. Publishing stays a human action.
 */

import { COOKIE_NAME, readCookie, verifyToken } from "./gate.js";

const API = "https://api.github.com";

/** Every dashboard-created issue carries this label, for humans browsing GitHub. */
export const LABEL = "website-change-request";

/**
 * ...and this invisible marker in the body, which is what we actually filter
 * on. Labels can fail to attach (a missing label, a permissions edge case) and
 * when that happens the issue exists but a label-filtered query can't see it -
 * which looks, from the dashboard, exactly like the request vanished. The
 * marker is part of the body text, so it cannot be dropped.
 */
export const MARKER = "<!-- mm-admin-request -->";

/** Is this issue one of ours? Check the marker first, label as a fallback. */
export function isOurs(issue) {
  if (!issue) return false;
  if (String(issue.body || "").includes(MARKER)) return true;
  return (issue.labels || []).some(
    (l) => (typeof l === "string" ? l : l && l.name) === LABEL,
  );
}

export function repo() {
  return process.env.GITHUB_REPO || "";
}

export function configured() {
  return Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_REPO);
}

/**
 * The dashboard sits behind the same session cookie as the rest of the site.
 * Middleware already blocks unauthenticated requests, but these endpoints can
 * open issues and close pull requests, so they check again themselves rather
 * than trusting that a future edit to the matcher won't expose them.
 */
export async function authorised(request) {
  const secret = process.env.GATE_SECRET;
  if (!secret) return false;
  return verifyToken(secret, readCookie(request, COOKIE_NAME));
}

export async function gh(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }

  if (!res.ok) {
    const message = (body && body.message) || `GitHub API ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }

  return body;
}

/**
 * Create the label if it isn't there yet. GitHub 422s when it already exists,
 * which is fine - swallow it. Saves a manual setup step that would otherwise
 * fail silently on the very first request.
 */
export async function ensureLabel() {
  try {
    await gh(`/repos/${repo()}/labels`, {
      method: "POST",
      body: JSON.stringify({
        name: LABEL,
        color: "87ff00",
        description: "Change requested from the client admin dashboard",
      }),
    });
  } catch {
    /* already exists, or we lack permission - the issue create will tell us */
  }
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
