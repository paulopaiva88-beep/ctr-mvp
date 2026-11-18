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
 */
export function isDesignatedAdmin(identity: PersonIdentity): boolean {
  const allowlist = adminEmailAllowlist();
  if (allowlist.length > 0) {
    const email = identity.email.trim().toLowerCase();
    return identity.emailVerified && email !== "" && allowlist.includes(email);
  }

  if (identity.simulated) return true;

  // Bootstrap before CTR_ADMIN_EMAILS is set: Cursor team admins only.
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

export async function requireAdmin(
  request?: Request,
): Promise<AdminIdentity | Response> {
  const identity = await requireIdentity(request ?? (await requestFromHeaders()));
  if (identity instanceof Response) return identity;
  if (identity.kind === "key") {
    return forbidden("Acesso reservado a administradores com login Cursor.");
  }
  // Person tokens are private/team only; refuse anything unexpected.
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
  const identity = await getIdentity(await requestFromHeaders());
  if (!identity.verified) return identity;
  if (identity.kind === "key") {
    return { verified: false, reason: "forbidden" };
  }
  if (
    identity.appVisibility !== "private" &&
    identity.appVisibility !== "team"
  ) {
    return { verified: false, reason: "forbidden" };
  }
  if (!isDesignatedAdmin(identity)) {
    return { verified: false, reason: "forbidden" };
  }
  bindDataScope(identity);
  return identity;
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
