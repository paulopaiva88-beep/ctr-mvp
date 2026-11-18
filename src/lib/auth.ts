import { headers } from "next/headers";
import {
  getIdentity,
  type Identity,
  type PersonIdentity,
} from "../../cursor/identity";
import { dataScopeForIdentityStage, enterDataScope } from "./db";
import {
  isPanelPasswordConfigured,
  readPasswordSessionFromCookies,
  readSessionFromRequest,
} from "./session";

export type AdminSession = {
  sub: string;
  name: string;
  email: string;
  simulated: boolean;
  stage: "production" | "preview";
  via: "cursor" | "password";
};

export type AccessState =
  | { status: "ok"; identity: AdminSession }
  | {
      status: "blocked";
      code: "needs_password" | "not_signed_in" | "api_key" | "password_unset";
      message: string;
    };

function forbidden(message: string): Response {
  return Response.json(
    { error: message },
    { status: 403, headers: { "cache-control": "private, no-store" } },
  );
}

function unauthorized(message: string): Response {
  return Response.json(
    { error: message },
    { status: 401, headers: { "cache-control": "private, no-store" } },
  );
}

function fromCursor(identity: PersonIdentity): AdminSession {
  return {
    sub: identity.sub,
    name: identity.name,
    email: identity.email,
    simulated: identity.simulated,
    stage: identity.stage,
    via: "cursor",
  };
}

function fromPassword(name: string): AdminSession {
  return {
    sub: "password-admin",
    name,
    email: "",
    simulated: false,
    stage: "production",
    via: "password",
  };
}

function bindDataScope(session: AdminSession): void {
  enterDataScope(dataScopeForIdentityStage(session.stage));
}

function isCursorAdmin(identity: PersonIdentity): boolean {
  return (
    identity.appVisibility === "private" || identity.appVisibility === "team"
  );
}

export async function getAccessState(): Promise<AccessState> {
  const identity = await getIdentity(await requestFromHeaders());

  if (identity.verified && identity.kind === "key") {
    return {
      status: "blocked",
      code: "api_key",
      message: "Acesso reservado a administradores.",
    };
  }

  if (identity.verified && identity.kind === "person" && isCursorAdmin(identity)) {
    const session = fromCursor(identity);
    bindDataScope(session);
    return { status: "ok", identity: session };
  }

  const passwordSession = await readPasswordSessionFromCookies();
  if (passwordSession) {
    const session = fromPassword(passwordSession.name);
    bindDataScope(session);
    return { status: "ok", identity: session };
  }

  if (!isPanelPasswordConfigured()) {
    return {
      status: "blocked",
      code: "password_unset",
      message:
        "Configure a senha do painel (CTR_PANEL_PASSWORD) nos Secrets do Cursor para admins sem conta Cursor.",
    };
  }

  return {
    status: "blocked",
    code: "needs_password",
    message: "Entre com a senha do painel para continuar.",
  };
}

export async function requireAdmin(
  request?: Request,
): Promise<AdminSession | Response> {
  const req = request ?? (await requestFromHeaders());

  const identity = await getIdentity(req);
  if (identity.verified && identity.kind === "key") {
    return forbidden("Acesso reservado a administradores.");
  }
  if (identity.verified && identity.kind === "person" && isCursorAdmin(identity)) {
    const session = fromCursor(identity);
    bindDataScope(session);
    return session;
  }

  // Prefer getIdentity over requireIdentity so public apps can use password auth.
  if (!identity.verified) {
    // fall through to password
  } else if (identity.kind === "person" && !isCursorAdmin(identity)) {
    // public person tokens are unexpected; still allow password cookie
  }

  const passwordSession = request
    ? readSessionFromRequest(request)
    : await readPasswordSessionFromCookies();
  if (passwordSession) {
    const session = fromPassword(passwordSession.name);
    bindDataScope(session);
    return session;
  }

  if (!isPanelPasswordConfigured()) {
    return forbidden(
      "Senha do painel não configurada. Defina CTR_PANEL_PASSWORD nos Secrets.",
    );
  }

  return unauthorized("Faça login com a senha do painel.");
}

export async function getAdmin(): Promise<
  | AdminSession
  | { verified: false; reason: string }
> {
  const access = await getAccessState();
  if (access.status === "ok") return access.identity;
  return { verified: false, reason: access.code };
}

async function requestFromHeaders(): Promise<Request> {
  const h = await headers();
  return new Request("http://local", { headers: h });
}

export function jsonPrivate(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("cache-control", "private, no-store");
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json; charset=utf-8");
  }
  return new Response(JSON.stringify(data), { ...init, headers });
}

export type { Identity };
