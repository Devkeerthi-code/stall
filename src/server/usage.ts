import type { Db } from "@/lib/db";

export type UsageEvent = "owner_signed_up" | "shop_opened" | "product_added" | "csv_imported" | "order_placed" | "poster_printed";

/** Anonymous counters for "used by N shops" style numbers. Never fails the user's action. */
export async function recordUsage(db: Db, type: UsageEvent): Promise<void> {
  try {
    await db.platformEvent.create({ data: { type } });
  } catch (error) {
    console.error("usage event failed", type, error);
  }
}
