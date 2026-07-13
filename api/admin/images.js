/**
 * GET /api/admin/images
 *
 * Lists the images available to reference in a change request, so the client
 * can see the exact filename to quote ("put team-2026.jpg on the about page").
 */

import { authorised, configured, gh, json, repo } from "../../lib/github.js";

const DIR = "assets/img";
const IMAGE_EXT = /\.(jpe?g|png|webp|svg)$/i;

export async function GET(request) {
  if (!(await authorised(request))) return json({ error: "Not signed in." }, 401);
  if (!configured()) return json({ images: [], configured: false });

  try {
    const contents = await gh(`/repos/${repo()}/contents/${DIR}`);

    const images = (contents || [])
      .filter((f) => f.type === "file" && IMAGE_EXT.test(f.name))
      .map((f) => ({
        name: f.name,
        // Served from the live site rather than GitHub: raw URLs for a private
        // repo are short-lived and awkward to render. The client is signed in,
        // so the session cookie fetches these fine even while the site is gated.
        url: `/${DIR}/${f.name}`,
        size: f.size,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return json({ configured: true, images });
  } catch (err) {
    console.error("Image list failed:", err);
    return json({ error: `Couldn't load your images. GitHub said: ${err.message}` }, 502);
  }
}
