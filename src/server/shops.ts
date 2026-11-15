import type { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { revalidateStorefront } from "@/lib/cache";
import type { Db } from "@/lib/db";
import type { WeekHours } from "@/lib/hours";
import type { shopBasicsSchema, shopContactSchema } from "@/lib/validation";
import { NotFoundError, UserError } from "@/server/errors";
import { recordUsage } from "@/server/usage";

type Basics = z.infer<typeof shopBasicsSchema>;
type Contact = z.infer<typeof shopContactSchema>;

/** The only way to find "my shop": by the signed-in owner's id. A shop id from the browser is never used. */
export async function getOwnerShop(db: Db, ownerId: string) {
  return db.shop.findUnique({ where: { ownerId } });
}

export async function requireOwnerShop(db: Db, ownerId: string) {
  const shop = await getOwnerShop(db, ownerId);
  if (!shop) throw new NotFoundError("You haven't set up a stall yet.");
  return shop;
}

function isUniqueViolation(error: unknown, field: string): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002" &&
    JSON.stringify(error.meta ?? {}).includes(field);
}

export async function isSlugFree(db: Db, slug: string, ownerId: string): Promise<boolean> {
  const existing = await db.shop.findUnique({ where: { slug }, select: { ownerId: true } });
  return !existing || existing.ownerId === ownerId;
}

/** Step 1. Creates the shop on first save, updates it after that. */
export async function saveShopBasics(db: Db, ownerId: string, input: Basics) {
  const before = await getOwnerShop(db, ownerId);
  try {
    const shop = before
      ? await db.shop.update({ where: { ownerId }, data: input })
      : await db.shop.create({ data: { ...input, ownerId, setupStep: 2 } });
    if (before) revalidateStorefront(before.slug, shop.slug);
    return shop;
  } catch (error) {
    if (isUniqueViolation(error, "slug")) throw new UserError("Another shop already uses this link. Try adding your area or a word.", "slug");
    throw error;
  }
}

async function advance(db: Db, ownerId: string, step: number) {
  await db.shop.updateMany({ where: { ownerId, setupStep: { lt: step } }, data: { setupStep: step } });
}

export async function saveShopContact(db: Db, ownerId: string, input: Contact) {
  const shop = await db.shop.update({ where: { ownerId }, data: input }).catch(() => {
    throw new NotFoundError("You haven't set up a stall yet.");
  });
  await advance(db, ownerId, 3);
  revalidateStorefront(shop.slug);
  return shop;
}

export async function saveShopHours(db: Db, ownerId: string, hours: WeekHours) {
  const shop = await requireOwnerShop(db, ownerId);
  await db.shop.update({ where: { id: shop.id }, data: { hours } });
  await advance(db, ownerId, 5);
  revalidateStorefront(shop.slug);
}

export async function markProductsStepDone(db: Db, ownerId: string) {
  await advance(db, ownerId, 4);
}

export type OpenProblem = "no-whatsapp" | "no-products" | "taken-down";

export async function openShop(db: Db, ownerId: string): Promise<{ ok: true; slug: string } | { ok: false; problem: OpenProblem }> {
  const shop = await requireOwnerShop(db, ownerId);
  if (shop.status === "TAKEN_DOWN") return { ok: false, problem: "taken-down" };
  if (!shop.whatsapp) return { ok: false, problem: "no-whatsapp" };
  const products = await db.product.count({ where: { shopId: shop.id } });
  if (products === 0) return { ok: false, problem: "no-products" };

  const firstOpen = !shop.openedAt;
  await db.shop.update({
    where: { id: shop.id },
    data: { status: "OPEN", setupStep: 6, openedAt: shop.openedAt ?? new Date() },
  });
  if (firstOpen) await recordUsage(db, "shop_opened");
  revalidateStorefront(shop.slug);
  return { ok: true, slug: shop.slug };
}

/** Pause hides the storefront behind a "closed for now" notice; it never deletes anything. */
export async function setShopPaused(db: Db, ownerId: string, paused: boolean) {
  const shop = await requireOwnerShop(db, ownerId);
  if (shop.status === "TAKEN_DOWN" || shop.status === "DRAFT") return shop;
  const updated = await db.shop.update({ where: { id: shop.id }, data: { status: paused ? "PAUSED" : "OPEN" } });
  revalidateStorefront(shop.slug);
  return updated;
}

export async function setShopImage(db: Db, ownerId: string, kind: "logo" | "banner", file: { url: string; key: string } | null) {
  const shop = await requireOwnerShop(db, ownerId);
  const data = kind === "logo"
    ? { logoUrl: file?.url ?? null, logoKey: file?.key ?? null }
    : { bannerUrl: file?.url ?? null, bannerKey: file?.key ?? null };
  await db.shop.update({ where: { id: shop.id }, data });
  revalidateStorefront(shop.slug);
  return { previousKey: kind === "logo" ? shop.logoKey : shop.bannerKey };
}
