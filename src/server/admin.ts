import type { z } from "zod";
import { revalidateStorefront } from "@/lib/cache";
import type { Db } from "@/lib/db";
import type { reportSchema } from "@/lib/validation";
import { NotFoundError } from "@/server/errors";

export function adminEmails(raw = process.env.ADMIN_EMAILS ?? ""): Set<string> {
  return new Set(raw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean));
}

export function isAdmin(email: string | null | undefined, raw?: string): boolean {
  return !!email && adminEmails(raw).has(email.toLowerCase());
}

export async function createReport(db: Db, input: z.infer<typeof reportSchema>) {
  const shop = await db.shop.findUnique({ where: { slug: input.slug }, select: { id: true } });
  if (!shop) throw new NotFoundError("Shop not found.");
  await db.report.create({ data: { shopId: shop.id, reason: input.reason, details: input.details } });
}

export async function adminOverview(db: Db) {
  const [openReports, shops, usage] = await Promise.all([
    db.report.findMany({
      where: { resolvedAt: null }, orderBy: { createdAt: "desc" }, take: 100,
      include: { shop: { select: { id: true, name: true, slug: true, status: true } } },
    }),
    db.shop.findMany({
      orderBy: { createdAt: "desc" }, take: 200,
      select: { id: true, name: true, slug: true, status: true, isDemo: true, createdAt: true, takedownReason: true, _count: { select: { products: true, orders: true, reports: true } } },
    }),
    db.platformEvent.groupBy({ by: ["type"], _count: { _all: true } }),
  ]);
  return { openReports, shops, usage: Object.fromEntries(usage.map((u) => [u.type, u._count._all])) };
}

export async function takeDownShop(db: Db, shopId: string, reason: string) {
  const shop = await db.shop.update({ where: { id: shopId }, data: { status: "TAKEN_DOWN", takedownReason: reason.slice(0, 240) } });
  await db.report.updateMany({ where: { shopId, resolvedAt: null }, data: { resolvedAt: new Date() } });
  revalidateStorefront(shop.slug);
}

/** Restores to Open only if the shop had been opened before; otherwise back to Draft. */
export async function restoreShop(db: Db, shopId: string) {
  const current = await db.shop.findUnique({ where: { id: shopId } });
  if (!current) throw new NotFoundError("Shop not found.");
  await db.shop.update({ where: { id: shopId }, data: { status: current.openedAt ? "OPEN" : "DRAFT", takedownReason: null } });
  revalidateStorefront(current.slug);
}

export async function dismissReport(db: Db, reportId: string) {
  await db.report.update({ where: { id: reportId }, data: { resolvedAt: new Date() } });
}
