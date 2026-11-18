import { readdir, readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";

type DbGlobal = typeof globalThis & {
  __ctrPgPool?: pg.Pool;
  __ctrPglite?: Promise<PGlite>;
};

const g = globalThis as DbGlobal;

export async function sql<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  if (databaseUrl !== "") {
    g.__ctrPgPool ??= new pg.Pool({ connectionString: databaseUrl, max: 5 });
    return (await g.__ctrPgPool.query(text, params)).rows as T[];
  }
  g.__ctrPglite ??= startLocal().catch((error: unknown) => {
    g.__ctrPglite = undefined;
    throw error;
  });
  return (await (await g.__ctrPglite).query<T>(text, params)).rows;
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

export function isUsingSampleDatabase(): boolean {
  return databaseUrl === "";
}
