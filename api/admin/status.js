/**
 * GET /api/admin/status
 *
 * The dashboard polls this. It stitches together three things GitHub keeps in
 * separate places - the issue (the request), the pull request (the work), and
 * the Vercel bot's comment (the preview URL) - into one list the client can
 * actually read.
 */

import { LABEL, authorised, configured, gh, json, repo } from "../../lib/github.js";

/** Vercel's bot posts the preview link as a comment on the PR. Pull it out. */
function previewUrlFrom(comments) {
  for (const c of comments || []) {
    const m = String(c.body || "").match(/https:\/\/[a-z0-9-]+\.vercel\.app/gi);
    if (!m) continue;
    // The bot's comment lists both the preview and the inspector; the preview
    // is the one on the project's own subdomain.
    const preview = m.find((u) => !u.includes("vercel.com"));
    if (preview) return preview;
  }
  return null;
}

function describe(issue, pr) {
  if (pr && pr.merged_at) {
    return { state: "published", label: "Published - live on the site" };
  }
  if (pr && pr.state === "closed") {
    return { state: "discarded", label: "Discarded - nothing changed" };
  }
  if (pr && pr.state === "open") {
    return { state: "review", label: "Ready to preview - awaiting approval" };
  }
  if (issue.state === "closed") {
    return { state: "closed", label: "Closed" };
  }
  return { state: "working", label: "Claude is working on it..." };
}

export async function GET(request) {
  if (!(await authorised(request))) return json({ error: "Not signed in." }, 401);
  if (!configured()) return json({ requests: [], configured: false });

  try {
    const [rawIssues, pulls] = await Promise.all([
      gh(`/repos/${repo()}/issues?state=all&labels=${LABEL}&per_page=10&sort=created&direction=desc`),
      gh(`/repos/${repo()}/pulls?state=all&per_page=30&sort=updated&direction=desc`),
    ]);

    // The issues endpoint also returns pull requests. Drop those.
    const issues = (rawIssues || []).filter((i) => !i.pull_request);

    const results = [];

    for (const issue of issues) {
      // Claude links its PR back to the issue ("Closes #12"), so match on that.
      const pr = (pulls || []).find((p) =>
        new RegExp(`#${issue.number}\\b`).test(`${p.body || ""} ${p.title || ""}`),
      );

      let preview = null;
      // Only chase the preview URL for PRs still awaiting review - it's an
      // extra API call each, and it's meaningless once merged or closed.
      if (pr && pr.state === "open") {
        try {
          const comments = await gh(`/repos/${repo()}/issues/${pr.number}/comments?per_page=20`);
          preview = previewUrlFrom(comments);
        } catch {
          preview = null;
        }
      }

      const status = describe(issue, pr);

      results.push({
        number: issue.number,
        title: issue.title,
        requested: issue.created_at,
        issueUrl: issue.html_url,
        prNumber: pr ? pr.number : null,
        prUrl: pr ? pr.html_url : null,
        preview,
        ...status,
      });
    }

    return json({ configured: true, requests: results });
  } catch (err) {
    console.error("Status lookup failed:", err);
    // Surface GitHub's own message. This endpoint is behind the login, so it's
    // only ever the site owner reading it - and "Bad credentials" vs "Not
    // Found" is the difference between a wrong token and a wrong repo name.
    return json(
      { error: `Couldn't load your requests. GitHub said: ${err.message} (repo: ${repo() || "NOT SET"})` },
      502,
    );
  }
}
