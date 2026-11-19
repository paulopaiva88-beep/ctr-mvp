import { jsonPrivate } from "../../../lib/auth";
import { clearSessionCookieOptions } from "../../../lib/session";

export const dynamic = "force-dynamic";

export async function POST() {
  const opts = clearSessionCookieOptions();
  const response = jsonPrivate({ ok: true });
  response.headers.append(
    "set-cookie",
    [
      `${opts.name}=`,
      `Path=${opts.path}`,
      `Max-Age=0`,
      `SameSite=${opts.sameSite}`,
      opts.httpOnly ? "HttpOnly" : "",
      opts.secure ? "Secure" : "",
    ]
      .filter(Boolean)
      .join("; "),
  );
  return response;
}
