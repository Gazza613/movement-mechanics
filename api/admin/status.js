/**
 * GET /api/admin/status
 *
 * The dashboard polls this. It stitches together three things GitHub keeps in
 * separate places - the issue (the request), the pull request (the work), and
 * the Vercel bot's comment (the preview URL) - into one list the client can
 * actually read.
 */

import {
  authorised,
  configured,
  findBranch,
  findPr,
  gh,
  isOurs,
  json,
  openPr,
  repo,
} from "../../lib/github.js";

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
    // Fetch recent issues WITHOUT filtering by label, then match on the body
    // marker. Filtering server-side by label looked tidier, but if the label
    // ever fails to attach the request becomes invisible here while existing
    // perfectly well on GitHub - which is precisely what happened.
    const [rawIssues, pullsInitial, branches] = await Promise.all([
      gh(`/repos/${repo()}/issues?state=all&per_page=30&sort=created&direction=desc`),
      gh(`/repos/${repo()}/pulls?state=all&per_page=30&sort=updated&direction=desc`),
      gh(`/repos/${repo()}/branches?per_page=100`),
    ]);

    let pulls = pullsInitial;

    // The issues endpoint also returns pull requests. Drop those, and anything
    // that wasn't raised from this dashboard.
    const issues = (rawIssues || [])
      .filter((i) => !i.pull_request)
      .filter(isOurs)
      .slice(0, 10);

    const results = [];
    const notices = [];

    for (const issue of issues) {
      let pr = findPr(pulls, issue.number);

      // Claude pushed a branch but left the PR for a human to open. Open it,
      // so the client gets a preview instead of a request that never finishes.
      if (!pr && issue.state === "open") {
        const branch = findBranch(branches, issue.number);

        // No branch yet simply means Claude is still working - that's the
        // normal in-progress state, not something to alarm the client about.
        if (branch) {
          try {
            pr = await openPr(branch, issue);
            pulls = [pr, ...pulls];
          } catch (err) {
            // Surface it. Silently swallowing this is what made the last two
            // failures so hard to see.
            notices.push(`#${issue.number}: couldn't open PR from ${branch} - ${err.message}`);
            pulls = await gh(`/repos/${repo()}/pulls?state=all&per_page=30`);
            pr = findPr(pulls, issue.number);
          }
        }
      }

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

    return json({ configured: true, requests: results, notices });
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
