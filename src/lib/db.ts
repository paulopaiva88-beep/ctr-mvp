import { AsyncLocalStorage } from "node:async_hooks";
import { readdir, readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";

export type DataScope = "production" | "preview" | "local";

const scopeStore = new AsyncLocalStorage<DataScope>();

type DbGlobal = typeof globalThis & {
  __ctrPgPool?: pg.Pool;
  __ctrPgliteLocal?: Promise<PGlite>;
  __ctrPglitePreview?: Promise<PGlite>;
};

const g = globalThis as DbGlobal;

/** Bind the rest of this request to a data scope (preview never touches production Postgres). */
export function enterDataScope(scope: DataScope): void {
  scopeStore.enterWith(scope);
}

export function currentDataScope(): DataScope {
  const stored = scopeStore.getStore();
  if (stored) return stored;
  return databaseUrl !== "" ? "production" : "local";
}

export function dataScopeForIdentityStage(
  stage: "production" | "preview",
): DataScope {
  if (stage === "preview") return "preview";
  return databaseUrl !== "" ? "production" : "local";
}

export async function sql<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const scope = currentDataScope();
  if (scope === "production" && databaseUrl !== "") {
    g.__ctrPgPool ??= new pg.Pool({ connectionString: databaseUrl, max: 5 });
    return (await g.__ctrPgPool.query(text, params)).rows as T[];
  }

  const key = scope === "preview" ? "__ctrPglitePreview" : "__ctrPgliteLocal";
  g[key] ??= startLocal().catch((error: unknown) => {
    g[key] = undefined;
    throw error;
  });
  return (await (await g[key]).query<T>(text, params)).rows;
}

async function startLocal(): Promise<PGlite> {
  const db = new PGlite();
  const files = (await readdir("migrations").catch(() => []))
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of files) {
    await db.exec(await readFile(`migrations/${file}`, "utf8"));
  }
  return db;
}

export function newId(): string {
  return crypto.randomUUID();
}

/** True when this request is not writing to the published production Postgres. */
export function isUsingSampleDatabase(): boolean {
  return currentDataScope() !== "production" || databaseUrl === "";
}
