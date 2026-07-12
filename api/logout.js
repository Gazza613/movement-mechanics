/**
 * Movement Mechanics - development gate: log out.
 * Clears the session cookie by overwriting it with an already-expired one.
 */

import { COOKIE_NAME } from "../lib/gate.js";

function clear() {
  return new Response(null, {
    status: 302,
    headers: {
      Location: "/login.html?out=1",
      "Set-Cookie": `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
    },
  });
}

export async function GET() {
  return clear();
}

export async function POST() {
  return clear();
}
