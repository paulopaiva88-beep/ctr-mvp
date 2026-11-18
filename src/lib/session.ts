import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "ctr_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

function panelPassword(): string {
  const fromEnv = process.env.CTR_PANEL_PASSWORD?.trim() ?? "";
  if (fromEnv !== "") return fromEnv;
  // Local / VM only — never used on the published host (CURSOR_APP_ID is set there).
  if (!process.env.CURSOR_APP_ID?.trim()) return "ctr-local";
  return "";
}

function signingKey(): string {
  return panelPassword();
}

export function isPanelPasswordConfigured(): boolean {
  return panelPassword() !== "";
}

export function verifyPanelPassword(candidate: string): boolean {
  const expected = panelPassword();
  if (expected === "" || candidate === "") return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function sign(payload: string): string {
  const key = signingKey();
  if (key === "") return "";
  const sig = createHmac("sha256", key).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function verifySigned(token: string): string | null {
  const key = signingKey();
  if (key === "" || !token.includes(".")) return null;
  const idx = token.lastIndexOf(".");
  const payload = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = createHmac("sha256", key).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return payload;
}

export type PasswordSession = {
  name: string;
  exp: number;
};

export function createSessionToken(name: string): string | null {
  const exp = Date.now() + SESSION_TTL_MS;
  const payload = Buffer.from(
    JSON.stringify({ name: name.trim() || "Admin", exp }),
    "utf8",
  ).toString("base64url");
  const token = sign(payload);
  return token === "" ? null : token;
}

export function readSessionToken(token: string | undefined): PasswordSession | null {
  if (!token) return null;
  const payload = verifySigned(token);
  if (!payload) return null;
  try {
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as PasswordSession;
    if (!data || typeof data.name !== "string" || typeof data.exp !== "number") {
      return null;
    }
    if (data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export async function readPasswordSessionFromCookies(): Promise<PasswordSession | null> {
  const jar = await cookies();
  return readSessionToken(jar.get(SESSION_COOKIE)?.value);
}

export function sessionCookieOptions(token: string) {
  const secure = Boolean(process.env.CURSOR_APP_ID?.trim());
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  };
}

export function clearSessionCookieOptions() {
  const secure = Boolean(process.env.CURSOR_APP_ID?.trim());
  return {
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}

export function readSessionFromRequest(request: Request): PasswordSession | null {
  const header = request.headers.get("cookie") ?? "";
  const match = header
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  if (!match) return null;
  const value = decodeURIComponent(match.slice(SESSION_COOKIE.length + 1));
  return readSessionToken(value);
}
