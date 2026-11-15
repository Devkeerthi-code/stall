import type { Db } from "@/lib/db";
import { requireOwnerShop } from "@/server/shops";

/** Today's date in India as a UTC-midnight Date, which is what a Postgres DATE column stores. */
export function indiaDay(now = new Date()): Date {
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(now);
  return new Date(`${ymd}T00:00:00.000Z`);
}

type Counter = "storeViews" | "productViews" | "waClicks";

/** Counts only. No cookies, no IP addresses, no per-visitor rows. */
export async function bumpDailyStat(db: Db, shopId: string, field: Counter, day = indiaDay()) {
  await db.dailyStat.upsert({
    where: { shopId_day: { shopId, day } },
    create: { shopId, day, [field]: 1 },
    update: { [field]: { increment: 1 } },
  });
}

export async function trackView(db: Db, slug: string, event: "store_view" | "product_view", productId?: string) {
  const shop = await db.shop.findUnique({ where: { slug }, select: { id: true, status: true } });
  if (!shop || shop.status !== "OPEN") return;
  if (event === "store_view") return bumpDailyStat(db, shop.id, "storeViews");

  if (!productId) return;
  const product = await db.product.findFirst({ where: { id: productId, shopId: shop.id }, select: { id: true } });
  if (!product) return;
  const day = indiaDay();
  await bumpDailyStat(db, shop.id, "productViews", day);
  await db.productDailyStat.upsert({
    where: { productId_day: { productId, day } },
    create: { productId, shopId: shop.id, day, views: 1 },
    update: { views: { increment: 1 } },
  });
}

export function conversionRate(orders: number, views: number): number | null {
  return views > 0 ? Math.round((orders / views) * 1000) / 10 : null;
}

export async function getInsights(db: Db, ownerId: string, days = 7) {
  const shop = await requireOwnerShop(db, ownerId);
  const today = indiaDay();
  const since = new Date(today.getTime() - (days - 1) * 86_400_000);
  const previousSince = new Date(since.getTime() - days * 86_400_000);

  const [stats, previous, top] = await Promise.all([
    db.dailyStat.findMany({ where: { shopId: shop.id, day: { gte: since } }, orderBy: { day: "asc" } }),
    db.dailyStat.aggregate({ where: { shopId: shop.id, day: { gte: previousSince, lt: since } }, _sum: { storeViews: true } }),
    db.productDailyStat.groupBy({
      by: ["productId"], where: { shopId: shop.id, day: { gte: since } },
      _sum: { views: true }, orderBy: { _sum: { views: "desc" } }, take: 5,
    }),
  ]);

  const byDay = new Map(stats.map((s) => [s.day.toISOString(), s]));
  const series = Array.from({ length: days }, (_, i) => {
    const day = new Date(since.getTime() + i * 86_400_000);
    const s = byDay.get(day.toISOString());
    return { day, storeViews: s?.storeViews ?? 0, waClicks: s?.waClicks ?? 0 };
  });
  const views = series.reduce((n, d) => n + d.storeViews, 0);
  const waClicks = series.reduce((n, d) => n + d.waClicks, 0);
  const names = await db.product.findMany({ where: { id: { in: top.map((t) => t.productId) } }, select: { id: true, name: true } });
  const nameOf = new Map(names.map((p) => [p.id, p.name]));

  return {
    series,
    views,
    previousViews: previous._sum.storeViews ?? 0,
    waClicks,
    conversion: conversionRate(waClicks, views),
    topProducts: top.map((t) => ({ id: t.productId, name: nameOf.get(t.productId) ?? "Removed product", views: t._sum.views ?? 0 })),
  };
}
