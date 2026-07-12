/**
 * POST /api/admin/discard
 *
 * Lets the client throw a change away. Closes the pull request (without
 * merging) and the originating issue.
 *
 * Note there is deliberately no /api/admin/publish. Merging to main - the act
 * that puts a change on the live site - is the agency's call, not the client's.
 * That is the whole safety model: the client can ask for anything and preview
 * anything, but cannot ship it.
 */

import { authorised, configured, gh, json, repo } from "../../lib/github.js";

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

    // Only ever touch issues this dashboard created. Without this check, a
    // crafted request could close any issue or PR in the repository.
    const isOurs = (issue.labels || []).some(
      (l) => (typeof l === "string" ? l : l.name) === "website-change-request",
    );
    if (!isOurs) return json({ error: "Unknown request." }, 400);

    // Close the PR Claude opened for it, if there is one.
    const pulls = await gh(`/repos/${repo()}/pulls?state=open&per_page=30`);
    const pr = (pulls || []).find((p) =>
      new RegExp(`#${number}\\b`).test(`${p.body || ""} ${p.title || ""}`),
    );

    if (pr) {
      await gh(`/repos/${repo()}/pulls/${pr.number}`, {
        method: "PATCH",
        body: JSON.stringify({ state: "closed" }),
      });
    }

    await gh(`/repos/${repo()}/issues/${number}`, {
      method: "PATCH",
      body: JSON.stringify({ state: "closed" }),
    });

    return json({ ok: true });
  } catch (err) {
    console.error("Discard failed:", err);
    return json({ error: "Couldn't discard that request." }, 502);
  }
}
