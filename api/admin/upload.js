/**
 * POST /api/admin/upload
 *
 * Commits an image the client dropped into the dashboard straight into
 * assets/img/ on main.
 *
 * Committing to main without a preview looks reckless until you notice that an
 * image file nothing references changes nothing on the site. It is inert until
 * Claude wires it into a page - and THAT step still goes through the normal
 * PR + preview + publish flow. So there is no path here to breaking the live
 * site, and it saves the client a pointless "approve this file upload" step.
 *
 * The browser resizes and compresses before sending (see admin.html). This
 * endpoint still re-checks size and type, because a client-side check is a
 * convenience, not a control.
 */

import { authorised, configured, gh, json, repo } from "../../lib/github.js";

const DIR = "assets/img";
const MAX_BYTES = 4 * 1024 * 1024; // Vercel caps the request body at ~4.5MB
const ALLOWED = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Strip anything that isn't a safe filename. Without this, a name like
 * "../../../middleware.js" would write outside assets/img - the GitHub API
 * would happily commit it.
 */
function safeName(raw, ext) {
  const base = String(raw || "image")
    .replace(/\.[^.]+$/, "")      // drop the original extension
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")  // everything else becomes a hyphen
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base || "image"}.${ext}`;
}

/** Does this path already exist in the repo? */
async function exists(path) {
  try {
    await gh(`/repos/${repo()}/contents/${path}`);
    return true;
  } catch (err) {
    if (err.status === 404) return false;
    throw err;
  }
}

export async function POST(request) {
  if (!(await authorised(request))) return json({ error: "Not signed in." }, 401);
  if (!configured()) return json({ error: "The change service isn't configured yet." }, 503);

  let file;
  try {
    const form = await request.formData();
    file = form.get("image");
  } catch {
    return json({ error: "Couldn't read that upload." }, 400);
  }

  if (!file || typeof file !== "object" || !file.size) {
    return json({ error: "No image was attached." }, 400);
  }

  const ext = ALLOWED[file.type];
  if (!ext) {
    return json({ error: "Please upload a JPG, PNG or WebP image." }, 400);
  }
  if (file.size > MAX_BYTES) {
    return json({ error: "That image is too large. Please use one under 4MB." }, 400);
  }

  try {
    // Never overwrite an existing image - the site might be using it. Add a
    // numeric suffix instead.
    let name = safeName(file.name, ext);
    let path = `${DIR}/${name}`;
    for (let n = 2; (await exists(path)) && n < 50; n++) {
      name = safeName(`${file.name}-${n}`, ext);
      path = `${DIR}/${name}`;
    }

    const bytes = Buffer.from(await file.arrayBuffer());

    await gh(`/repos/${repo()}/contents/${path}`, {
      method: "PUT",
      body: JSON.stringify({
        message: `Add image ${name} (uploaded from the editor panel)`,
        content: bytes.toString("base64"),
      }),
    });

    return json({ ok: true, name, path });
  } catch (err) {
    console.error("Image upload failed:", err);
    return json({ error: `Couldn't upload that image. GitHub said: ${err.message}` }, 502);
  }
}
