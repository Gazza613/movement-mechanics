/**
 * POST /api/admin/request
 *
 * Turns a plain-English change request from the dashboard into a GitHub issue
 * tagged @claude, which triggers the Claude Code Action.
 */

import { LABEL, authorised, configured, ensureLabel, gh, json, repo } from "../../lib/github.js";

// Guard rails against a runaway client (or a stuck retry loop) burning API
// tokens: only so many requests may be in flight at once.
const MAX_OPEN_REQUESTS = 3;
const MAX_LENGTH = 2000;

export async function POST(request) {
  if (!(await authorised(request))) return json({ error: "Not signed in." }, 401);
  if (!configured()) return json({ error: "The change service isn't configured yet." }, 503);

  let instruction = "";
  try {
    const form = await request.formData();
    instruction = String(form.get("instruction") || "").trim();
  } catch {
    return json({ error: "Couldn't read that request." }, 400);
  }

  if (instruction.length < 10) {
    return json({ error: "Please describe the change in a bit more detail." }, 400);
  }
  if (instruction.length > MAX_LENGTH) {
    return json({ error: `Please keep the request under ${MAX_LENGTH} characters.` }, 400);
  }

  // Refuse to queue another job while several are already running.
  try {
    const open = await gh(`/repos/${repo()}/issues?state=open&labels=${LABEL}&per_page=20`);
    const count = (open || []).filter((i) => !i.pull_request).length;
    if (count >= MAX_OPEN_REQUESTS) {
      return json(
        {
          error: `You already have ${count} changes in progress. Please wait for those to be reviewed before requesting more.`,
        },
        429,
      );
    }
  } catch {
    // If the check itself fails, fall through rather than blocking the client.
  }

  const title = instruction.split("\n")[0].slice(0, 70);

  // The @claude mention is what actually triggers the GitHub Action.
  const body = [
    "@claude",
    "",
    "A change has been requested from the Movement Mechanics admin dashboard.",
    "",
    "### Requested change",
    "",
    instruction,
    "",
    "---",
    "",
    "**Before you start, read `CLAUDE.md`.** In particular:",
    "",
    "- Make **only** the change described above. Do not improve, refactor or tidy anything else.",
    "- This is a client-approved design. Do not alter fonts, colours, spacing or layout unless that is precisely what was asked for.",
    "- The header and footer are duplicated across all nine pages - if you change one, change all nine.",
    "- Never touch `api/`, `middleware.js`, `lib/`, `.github/` or `package.json`. If the request needs one of those, stop and say so instead.",
    "- Open a pull request and **do not merge it**. A human reviews every change.",
    "- Write the PR description so a non-technical reader can understand what changed.",
  ].join("\n");

  try {
    await ensureLabel();

    const issue = await gh(`/repos/${repo()}/issues`, {
      method: "POST",
      body: JSON.stringify({ title, body, labels: [LABEL] }),
    });

    return json({
      ok: true,
      number: issue.number,
      title: issue.title,
      url: issue.html_url,
    });
  } catch (err) {
    console.error("Failed to create change request:", err);
    return json({ error: "Couldn't submit that request. Please try again." }, 502);
  }
}
