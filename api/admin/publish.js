/**
 * POST /api/admin/publish
 *
 * Merges the pull request Claude opened, which puts the change on the live
 * site (Vercel auto-deploys `main` within ~40 seconds).
 *
 * The client is trusted to publish their own changes. The safety net is not
 * approval - it is git: every change is a commit, so anything that turns out
 * badly can be reverted in seconds. The preview step still exists, and the
 * dashboard nudges them to use it.
 */

import { authorised, configured, gh, isOurs, json, repo } from "../../lib/github.js";

export async function POST(request) {
  if (!(await authorised(request))) return json({ error: "Not signed in." }, 401);
  if (!configured()) return json({ error: "The change service isn't configured yet." }, 503);

  let number;
  try {
    const form = await request.formData();
    number = parseInt(String(form.get("number") || ""), 10);
  } catch {
    return json({ error: "Couldn't read that request." }, 400);
  }

  if (!Number.isInteger(number) || number < 1) {
    return json({ error: "Unknown request." }, 400);
  }

  try {
    const issue = await gh(`/repos/${repo()}/issues/${number}`);

    // Only ever act on issues this dashboard created. Without this, a crafted
    // request could merge any open pull request in the repository - including
    // one nobody has reviewed.
    if (!isOurs(issue)) return json({ error: "Unknown request." }, 400);

    const pulls = await gh(`/repos/${repo()}/pulls?state=open&per_page=30`);
    const pr = (pulls || []).find((p) =>
      new RegExp(`#${number}\\b`).test(`${p.body || ""} ${p.title || ""}`),
    );

    if (!pr) return json({ error: "That change isn't ready to publish yet." }, 409);

    // GitHub refuses to merge a PR with conflicts. Surface that in plain
    // English rather than a raw API error - the client can't resolve it, but
    // they can be told to ask for the change again.
    if (pr.mergeable === false) {
      return json(
        {
          error:
            "This change clashes with another one that was published after it. Please discard it and request the change again.",
        },
        409,
      );
    }

    await gh(`/repos/${repo()}/pulls/${pr.number}/merge`, {
      method: "PUT",
      body: JSON.stringify({
        merge_method: "squash",
        commit_title: `${issue.title} (#${pr.number})`,
        commit_message: `Requested from the admin dashboard.\n\nCloses #${number}`,
      }),
    });

    await gh(`/repos/${repo()}/issues/${number}`, {
      method: "PATCH",
      body: JSON.stringify({ state: "closed" }),
    });

    return json({ ok: true });
  } catch (err) {
    console.error("Publish failed:", err);
    return json({ error: `Couldn't publish that change. GitHub said: ${err.message}` }, 502);
  }
}
