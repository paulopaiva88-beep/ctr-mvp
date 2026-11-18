import { jsonPrivate } from "../../../lib/auth";
import {
  createSessionToken,
  isPanelPasswordConfigured,
  sessionCookieOptions,
  verifyPanelPassword,
} from "../../../lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isPanelPasswordConfigured()) {
    return jsonPrivate(
      { error: "Senha do painel não configurada no servidor." },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonPrivate({ error: "JSON inválido." }, { status: 400 });
  }

  const password = String(body.password ?? "");
  const name = String(body.name ?? "Admin").trim() || "Admin";
  if (!verifyPanelPassword(password)) {
    return jsonPrivate({ error: "Senha incorreta." }, { status: 401 });
  }

  const token = createSessionToken(name);
  if (!token) {
    return jsonPrivate({ error: "Não foi possível criar a sessão." }, { status: 500 });
  }

  const response = jsonPrivate({ ok: true, name });
  response.headers.append(
    "set-cookie",
    serializeCookie(sessionCookieOptions(token)),
  );
  return response;
}

function serializeCookie(opts: {
  name: string;
  value: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
}): string {
  const parts = [
    `${opts.name}=${encodeURIComponent(opts.value)}`,
    `Path=${opts.path}`,
    `Max-Age=${opts.maxAge}`,
    `SameSite=${opts.sameSite}`,
  ];
  if (opts.httpOnly) parts.push("HttpOnly");
  if (opts.secure) parts.push("Secure");
  return parts.join("; ");
}
