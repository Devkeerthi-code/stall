import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

export type Db = PrismaClient;

const globalForDb = globalThis as unknown as { stallDb?: PrismaClient };

/** node-postgres treats sslmode=require as verify-full and warns about it; say so explicitly. */
export function normalizeConnectionString(url: string): string {
  return url.replace(/([?&])sslmode=(require|prefer|verify-ca)(?=&|$)/, "$1sslmode=verify-full");
}

function createClient(): PrismaClient {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: normalizeConnectionString(raw), max: 5 }) });
}

/** Lazily created so `next build` can import modules without a database connection. */
export function getDb(): PrismaClient {
  globalForDb.stallDb ??= createClient();
  return globalForDb.stallDb;
}
