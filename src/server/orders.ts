import { randomInt } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import type { OrderStatus } from "@/generated/prisma/enums";
import { revalidateStorefront } from "@/lib/cache";
import { priceCart, type CatalogueVariant } from "@/lib/cart";
import type { Db } from "@/lib/db";
import { canTransition, stockEffect } from "@/lib/order-status";
import type { PlaceOrderInput } from "@/lib/validation";
import { buildOrderMessage } from "@/lib/whatsapp";
import { bumpDailyStat } from "@/server/analytics";
import { NotFoundError, UserError } from "@/server/errors";
import { recordUsage } from "@/server/usage";

const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/** "0142-K7QX": the running number the shop recognises plus 4 random characters so codes can't be guessed. */
export function makeOrderCode(seq: number, random: (max: number) => number = randomInt): string {
  const suffix = Array.from({ length: 4 }, () => CODE_ALPHABET[random(CODE_ALPHABET.length)]).join("");
  return `${String(seq).padStart(4, "0")}-${suffix}`;
}

export function orderStatusUrl(siteUrl: string, slug: string, code: string): string {
  return `${siteUrl}/s/${slug}/order?code=${code}`;
}

const CART_PROBLEMS = {
  empty: "Your slip is empty.",
  "too-many-lines": "That's a very long slip. Please split it into two orders.",
  "bad-quantity": "One of the quantities isn't valid.",
  "unknown-item": "Something on your slip is no longer sold here. Please refresh the page.",
  unavailable: "Something on your slip just went out of stock. Please remove it and try again.",
} as const;

async function loadCatalogue(db: Db, shopId: string, variantIds: string[]): Promise<Map<string, CatalogueVariant>> {
  const variants = await db.variant.findMany({
    where: { id: { in: variantIds }, product: { shopId } },
    include: { product: { select: { id: true, name: true, inStock: true, stockMode: true, stockQty: true } } },
  });
  return new Map(variants.map((v) => [v.id, {
    variantId: v.id,
    productId: v.product.id,
    productName: v.product.name,
    label: v.label,
    pricePaise: v.pricePaise,
    available: v.product.inStock && (v.product.stockMode === "MADE_TO_ORDER" || (v.product.stockQty ?? 0) > 0),
  }]));
}

type OrderWithItems = Prisma.OrderGetPayload<{ include: { items: true } }>;

function whatsappFor(order: OrderWithItems, shop: { name: string; slug: string; whatsapp: string }, siteUrl: string) {
  return buildOrderMessage({
    shopName: shop.name,
    lines: order.items.map((i) => ({ name: i.name, variant: i.variantLabel, qty: i.qty, unitPaise: i.unitPaise, linePaise: i.linePaise })),
    totalPaise: order.totalPaise,
    customerName: order.customerName,
    fulfilment: order.fulfilment,
    address: order.address,
    note: order.note,
    code: order.code,
    statusUrl: orderStatusUrl(siteUrl, shop.slug, order.code),
  }, shop.whatsapp);
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

async function findOrderingShop(db: Db, slug: string) {
  const shop = await db.shop.findUnique({ where: { slug } });
  if (!shop || shop.status !== "OPEN") throw new NotFoundError("This shop isn't taking orders right now.");
  return shop;
}

async function priceFor(db: Db, shopId: string, input: PlaceOrderInput) {
  const catalogue = await loadCatalogue(db, shopId, input.lines.map((l) => l.variantId));
  const priced = priceCart(input.lines, catalogue);
  if (!priced.ok) throw new UserError(CART_PROBLEMS[priced.reason], "cart");
  return priced;
}

/**
 * Saves the customer's order as a preview and returns the exact WhatsApp message and link.
 * Prices come from the database. The same clientKey (double tap, retry) returns the first order.
 * The order reaches the owner's inbox only after markOrderSent.
 */
export async function placeOrder(db: Db, input: PlaceOrderInput, siteUrl: string) {
  const shop = await findOrderingShop(db, input.slug);
  if (shop.isDemo || !shop.whatsapp) throw new NotFoundError("This shop isn't taking orders right now.");
  const target = { name: shop.name, slug: shop.slug, whatsapp: shop.whatsapp };

  const existing = await db.order.findUnique({ where: { shopId_clientKey: { shopId: shop.id, clientKey: input.clientKey } }, include: { items: true } });
  if (existing) return { order: existing, ...whatsappFor(existing, target, siteUrl), repeated: true };

  const priced = await priceFor(db, shop.id, input);
  try {
    const order = await db.$transaction(async (tx) => {
      const { orderSeq } = await tx.shop.update({ where: { id: shop.id }, data: { orderSeq: { increment: 1 } }, select: { orderSeq: true } });
      return tx.order.create({
        data: {
          shopId: shop.id,
          seq: orderSeq,
          code: makeOrderCode(orderSeq),
          clientKey: input.clientKey,
          customerName: input.customerName,
          fulfilment: input.fulfilment,
          address: input.fulfilment === "DELIVERY" ? input.address : null,
          note: input.note,
          totalPaise: priced.totalPaise,
          itemCount: priced.itemCount,
          items: {
            create: priced.lines.map((l) => ({
              productId: l.productId, variantId: l.variantId, name: l.name, variantLabel: l.variant,
              unitPaise: l.unitPaise, qty: l.qty, linePaise: l.linePaise,
            })),
          },
        },
        include: { items: true },
      });
    });
    return { order, ...whatsappFor(order, target, siteUrl), repeated: false };
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    const raced = await db.order.findUnique({ where: { shopId_clientKey: { shopId: shop.id, clientKey: input.clientKey } }, include: { items: true } });
    if (!raced) throw error;
    return { order: raced, ...whatsappFor(raced, target, siteUrl), repeated: true };
  }
}

/** Demo stalls show the real message layout but never save anything or open WhatsApp. */
export async function previewDemoOrder(db: Db, input: PlaceOrderInput, siteUrl: string) {
  const shop = await findOrderingShop(db, input.slug);
  if (!shop.isDemo) throw new NotFoundError("Not a demo shop.");
  const priced = await priceFor(db, shop.id, input);
  return buildOrderMessage({
    shopName: shop.name,
    lines: priced.lines,
    totalPaise: priced.totalPaise,
    customerName: input.customerName,
    fulfilment: input.fulfilment,
    address: input.address,
    note: input.note,
    code: "DEMO-0000",
    statusUrl: `${siteUrl}/s/${shop.slug}`,
  }, "910000000000").message;
}

/** Called when the customer taps Send. Counts the WhatsApp order once, however many times it's called. */
export async function markOrderSent(db: Db, slug: string, clientKey: string): Promise<boolean> {
  const order = await db.order.findFirst({ where: { clientKey, shop: { slug } }, select: { id: true, shopId: true } });
  if (!order) return false;
  const updated = await db.order.updateMany({ where: { id: order.id, sentAt: null }, data: { sentAt: new Date() } });
  if (updated.count === 1) {
    await bumpDailyStat(db, order.shopId, "waClicks");
    await recordUsage(db, "order_placed");
  }
  return true;
}

export type OrderFilter = "all" | "new" | "open" | "done";
const FILTER_STATUSES: Record<OrderFilter, OrderStatus[] | null> = {
  all: null,
  new: ["NEW"],
  open: ["CONFIRMED", "READY"],
  done: ["DELIVERED", "CANCELLED"],
};

export async function listOwnerOrders(db: Db, ownerId: string, filter: OrderFilter = "all", take = 50) {
  const statuses = FILTER_STATUSES[filter];
  return db.order.findMany({
    where: { shop: { ownerId }, sentAt: { not: null }, ...(statuses ? { status: { in: statuses } } : {}) },
    orderBy: { sentAt: "desc" },
    take,
    include: { items: true },
  });
}

export async function countNewOrders(db: Db, ownerId: string) {
  return db.order.count({ where: { shop: { ownerId }, status: "NEW", sentAt: { not: null } } });
}

/** Moves an order along. Guards against double taps by only updating if the status hasn't changed meanwhile. */
export async function setOrderStatus(db: Db, ownerId: string, orderId: string, to: OrderStatus) {
  const order = await db.order.findFirst({ where: { id: orderId, shop: { ownerId } }, include: { items: true, shop: { select: { slug: true } } } });
  if (!order) throw new NotFoundError("That order isn't in your stall.");
  if (order.status === to) return order;
  if (!canTransition(order.status, to)) throw new UserError(`A ${order.status.toLowerCase()} order can't be marked ${to.toLowerCase()}.`);

  const effect = stockEffect(order.status, to, order.stockApplied);
  const now = new Date();
  await db.$transaction(async (tx) => {
    const moved = await tx.order.updateMany({
      where: { id: order.id, status: order.status },
      data: { status: to, statusChangedAt: now, stockApplied: effect === "take" ? true : effect === "return" ? false : order.stockApplied },
    });
    if (moved.count === 0) throw new UserError("This order was just updated. Refresh to see the latest.");
    if (effect === "none") return;
    for (const item of order.items) {
      if (!item.productId) continue;
      const delta = effect === "take" ? -item.qty : item.qty;
      await tx.$executeRaw`UPDATE "Product" SET "stockQty" = GREATEST("stockQty" + ${delta}, 0)
        WHERE "id" = ${item.productId} AND "shopId" = ${order.shopId} AND "stockMode" = 'TRACKED'`;
    }
  });
  if (effect !== "none") revalidateStorefront(order.shop.slug);
  return { ...order, status: to, statusChangedAt: now };
}

/** What a customer sees when checking a code: no name, address or phone, just the order itself. */
export async function getOrderForCustomer(db: Db, slug: string, code: string) {
  const order = await db.order.findFirst({
    where: { code, sentAt: { not: null }, shop: { slug, status: { not: "TAKEN_DOWN" } } },
    select: {
      code: true, status: true, fulfilment: true, totalPaise: true, itemCount: true, createdAt: true, statusChangedAt: true,
      items: { select: { name: true, variantLabel: true, qty: true, linePaise: true } },
    },
  });
  return order;
}
