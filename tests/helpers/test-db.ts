import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { PrismaPGlite } from "pglite-prisma-adapter";
import { PrismaClient } from "@/generated/prisma/client";

/** A real Postgres (PGlite, in-process) with the app's own migrations applied. No network needed. */
export async function createTestDb(): Promise<{ db: PrismaClient; close: () => Promise<void> }> {
  const pg = new PGlite();
  const dir = path.join(process.cwd(), "prisma", "migrations");
  for (const name of readdirSync(dir).filter((n) => !n.endsWith(".toml")).sort()) {
    await pg.exec(readFileSync(path.join(dir, name, "migration.sql"), "utf8"));
  }
  const db = new PrismaClient({ adapter: new PrismaPGlite(pg) });
  return { db, close: async () => { await db.$disconnect(); await pg.close(); } };
}
