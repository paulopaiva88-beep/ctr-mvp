import { headers } from "next/headers";
import {
  getIdentity,
  requireIdentity,
  requireTeamRole,
  type Identity,
  type PersonIdentity,
} from "../../cursor/identity";
import { dataScopeForIdentityStage, enterDataScope } from "./db";

export type AdminIdentity = PersonIdentity;

export type AccessState =
  | { status: "ok"; identity: AdminIdentity }
  | {
      status: "blocked";
      code:
        | "needs_private_or_team"
        | "not_on_allowlist"
        | "not_signed_in"
        | "api_key"
        | "not_configured";
      message: string;
    };

function adminEmailAllowlist(): string[] {
  return (process.env.CTR_ADMIN_EMAILS ?? "")
    .split(/[,;\n]+/)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function forbidden(message: string): Response {
  return Response.json(
    { error: message },
    { status: 403, headers: { "cache-control": "private, no-store" } },
  );
}

/**
 * Only designated CTR admins may use the panel.
 * Primary gate: CTR_ADMIN_EMAILS (comma-separated). Without it, only a
 * simulated local viewer or a Cursor team admin on a team-published app.
 *
 * Person identity headers exist only for private/team apps — a public app
 * never names the viewer, so /painel cannot authorize anyone.
 */
export function isDesignatedAdmin(identity: PersonIdentity): boolean {
  const allowlist = adminEmailAllowlist();
  if (allowlist.length > 0) {
    const email = identity.email.trim().toLowerCase();
    return identity.emailVerified && email !== "" && allowlist.includes(email);
  }

  if (identity.simulated) return true;

  return identity.appVisibility === "team" && identity.teamRole === "admin";
}

function authorizePerson(identity: PersonIdentity): true | Response {
  const allowlist = adminEmailAllowlist();
  if (allowlist.length > 0) {
    const email = identity.email.trim().toLowerCase();
    if (!identity.emailVerified || email === "" || !allowlist.includes(email)) {
      return forbidden("Seu usuário Cursor não está na lista de admins da CTR.");
    }
    return true;
  }

  if (identity.simulated) return true;

  if (identity.appVisibility === "team") {
    const teamAdmin = requireTeamRole(identity, ["admin"]);
    if (teamAdmin instanceof Response) {
      return forbidden("Apenas admins designados da CTR podem acessar o painel.");
    }
    return true;
  }

  return forbidden(
    "Configure o segredo CTR_ADMIN_EMAILS com os e-mails dos admins autorizados.",
  );
}

function bindDataScope(identity: AdminIdentity): void {
  enterDataScope(dataScopeForIdentityStage(identity.stage));
}

export async function getAccessState(): Promise<AccessState> {
  const identity = await getIdentity(await requestFromHeaders());

  if (!identity.verified) {
    // Public apps never send a person identity header — treat as visibility issue
    // when we are on a hosted app (CURSOR_APP_ID set) rather than local sim.
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

  if (
    identity.appVisibility !== "private" &&
    identity.appVisibility !== "team"
  ) {
    return {
      status: "blocked",
      code: "needs_private_or_team",
      message:
        "Este app precisa ser private ou team para o painel de admins funcionar.",
    };
  }

  const allowlist = adminEmailAllowlist();
  if (allowlist.length > 0) {
    if (!isDesignatedAdmin(identity)) {
      return {
        status: "blocked",
        code: "not_on_allowlist",
        message:
          "Seu e-mail Cursor não está em CTR_ADMIN_EMAILS. Peça para incluir o e-mail da conta Cursor que você usa.",
      };
    }
  } else if (!isDesignatedAdmin(identity)) {
    return {
      status: "blocked",
      code: "not_configured",
      message:
        "Configure o segredo CTR_ADMIN_EMAILS com os e-mails dos admins autorizados.",
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
  if (
    identity.appVisibility !== "private" &&
    identity.appVisibility !== "team"
  ) {
    return forbidden(
      "Este app deve ser publicado como private ou team. Acesso público não é permitido.",
    );
  }
  const allowed = authorizePerson(identity);
  if (allowed instanceof Response) return allowed;
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
