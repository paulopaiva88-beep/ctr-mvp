import { headers } from "next/headers";
import {
  getIdentity,
  requireIdentity,
  type Identity,
} from "../../cursor/identity";

export type AdminIdentity = Extract<
  Awaited<ReturnType<typeof requireIdentity>>,
  { verified: true }
>;

export async function requireAdmin(
  request?: Request,
): Promise<AdminIdentity | Response> {
  const identity = await requireIdentity(request ?? (await requestFromHeaders()));
  if (identity instanceof Response) return identity;
  if (identity.kind === "key") {
    return Response.json(
      { error: "Acesso reservado a administradores com login Cursor." },
      { status: 403, headers: { "cache-control": "private, no-store" } },
    );
  }
  return identity;
}

export async function getAdmin(): Promise<
  | (Identity & { verified: true })
  | { verified: false; reason: string }
> {
  return getIdentity(await requestFromHeaders());
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
