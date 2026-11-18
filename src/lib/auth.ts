import { headers } from "next/headers";
import {
  getIdentity,
  requireIdentity,
  type Identity,
  type PersonIdentity,
} from "../../cursor/identity";
import { dataScopeForIdentityStage, enterDataScope } from "./db";

export type AdminIdentity = PersonIdentity;

export type AccessState =
  | { status: "ok"; identity: AdminIdentity }
  | {
      status: "blocked";
      code: "needs_private_or_team" | "not_signed_in" | "api_key";
      message: string;
    };

function forbidden(message: string): Response {
  return Response.json(
    { error: message },
    { status: 403, headers: { "cache-control": "private, no-store" } },
  );
}

/**
 * Any signed-in Cursor person on a private or team app may use the panel.
 * Who can open the app is decided by Cursor visibility (invite/team), not by
 * an email allowlist. Public apps never receive person identity headers.
 */
export function isDesignatedAdmin(identity: PersonIdentity): boolean {
  return (
    identity.appVisibility === "private" || identity.appVisibility === "team"
  );
}

function bindDataScope(identity: AdminIdentity): void {
  enterDataScope(dataScopeForIdentityStage(identity.stage));
}

export async function getAccessState(): Promise<AccessState> {
  const identity = await getIdentity(await requestFromHeaders());

  if (!identity.verified) {
    const hosted = Boolean(process.env.CURSOR_APP_ID?.trim());
    if (hosted && identity.reason === "missing_header") {
      return {
        status: "blocked",
        code: "needs_private_or_team",
        message:
          "O app está público: o Cursor não envia login de pessoa. Mude a visibilidade para private ou team nas Publish Settings.",
      };
    }
    return {
      status: "blocked",
      code: "not_signed_in",
      message: "Faça login com sua conta Cursor para abrir o painel.",
    };
  }

  if (identity.kind === "key") {
    return {
      status: "blocked",
      code: "api_key",
      message: "Acesso reservado a administradores com login Cursor.",
    };
  }

  if (!isDesignatedAdmin(identity)) {
    return {
      status: "blocked",
      code: "needs_private_or_team",
      message:
        "Este app precisa ser private ou team para o painel de admins funcionar.",
    };
  }

  bindDataScope(identity);
  return { status: "ok", identity };
}

export async function requireAdmin(
  request?: Request,
): Promise<AdminIdentity | Response> {
  const identity = await requireIdentity(request ?? (await requestFromHeaders()));
  if (identity instanceof Response) {
    const hosted = Boolean(process.env.CURSOR_APP_ID?.trim());
    if (hosted) {
      return forbidden(
        "O app precisa ser private ou team (com login Cursor) para autorizar admins. Apps públicos não recebem identidade de pessoa.",
      );
    }
    return identity;
  }
  if (identity.kind === "key") {
    return forbidden("Acesso reservado a administradores com login Cursor.");
  }
  if (!isDesignatedAdmin(identity)) {
    return forbidden(
      "Este app deve ser publicado como private ou team. Acesso público não é permitido.",
    );
  }
  bindDataScope(identity);
  return identity;
}

export async function getAdmin(): Promise<
  | AdminIdentity
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
