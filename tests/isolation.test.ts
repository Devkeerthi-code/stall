import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn(), revalidatePath: vi.fn(), unstable_cache: (fn: () => unknown) => fn }));

import type { PrismaClient } from "@/generated/prisma/client";
import type { PhotoStorage } from "@/lib/storage";
import { productInputSchema } from "@/lib/validation";
import { NotFoundError } from "@/server/errors";
import { getOrderForCustomer, listOwnerOrders, markOrderSent, placeOrder, setOrderStatus } from "@/server/orders";
import { addProductPhoto, removeProductPhoto } from "@/server/photos";
import { deleteProduct, listOwnerProducts, setProductInStock, updateProduct } from "@/server/products";
import { getOwnerShop, saveShopBasics } from "@/server/shops";
import { makeOwnerWithShop } from "./helpers/fixtures";
import { createTestDb } from "./helpers/test-db";

let db: PrismaClient;
let close: () => Promise<void>;
let a: Awaited<ReturnType<typeof makeOwnerWithShop>>;
let b: Awaited<ReturnType<typeof makeOwnerWithShop>>;

const removed: string[] = [];
const fakeStorage: PhotoStorage = {
  kind: "local",
  put: async (key) => ({ url: `/media/${key}`, key }),
  remove: async (key) => { removed.push(key); },
};
const WEBP = new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0, 0]);

const productInput = productInputSchema.parse({
  name: "Hijacked", description: "", category: "", variants: [{ label: "", price: "1" }],
  stockMode: "MADE_TO_ORDER", stockQty: null, inStock: true, featured: false,
});

beforeAll(async () => {
  ({ db, close } = await createTestDb());
  a = await makeOwnerWithShop(db, "shop-a");
  b = await makeOwnerWithShop(db, "shop-b");
});
afterAll(async () => close());
beforeEach(() => { removed.length = 0; });

async function orderFor(shop: typeof a, key: string, send = true) {
  const placed = await placeOrder(db, {
    slug: shop.shop.slug, clientKey: key, customerName: "Asha", fulfilment: "PICKUP", address: null, note: null,
    lines: [{ variantId: shop.product.variants[0]!.id, qty: 1 }],
  }, "https://stall.test");
  if (send) await markOrderSent(db, shop.shop.slug, key);
  return placed;
}

describe("shop isolation", () => {
  it("finds an owner's shop only by their own id", async () => {
    expect((await getOwnerShop(db, a.owner.id))?.id).toBe(a.shop.id);
    expect((await getOwnerShop(db, b.owner.id))?.id).toBe(b.shop.id);
  });

  it("never lists another shop's products or orders", async () => {
    await orderFor(b, "b-order-key-0000000001");
    const products = await listOwnerProducts(db, a.owner.id);
    expect(products.map((p) => p.shopId)).toEqual([a.shop.id]);
    const orders = await listOwnerOrders(db, a.owner.id);
    expect(orders.every((o) => o.shopId === a.shop.id)).toBe(true);
  });

  it("can't edit, hide or delete another shop's product", async () => {
    await expect(updateProduct(db, a.owner.id, b.product.id, productInput)).rejects.toBeInstanceOf(NotFoundError);
    await expect(setProductInStock(db, a.owner.id, b.product.id, false)).rejects.toBeInstanceOf(NotFoundError);
    await expect(deleteProduct(db, a.owner.id, b.product.id)).rejects.toBeInstanceOf(NotFoundError);
    const untouched = await db.product.findUniqueOrThrow({ where: { id: b.product.id } });
    expect(untouched).toMatchObject({ name: b.product.name, inStock: true });
  });

  it("can't change the status of another shop's order", async () => {
    const { order } = await orderFor(b, "b-order-key-0000000002");
    await expect(setOrderStatus(db, a.owner.id, order.id, "CANCELLED")).rejects.toBeInstanceOf(NotFoundError);
    expect((await db.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("NEW");
  });

  it("can't add photos to or remove photos from another shop", async () => {
    await expect(addProductPhoto(db, fakeStorage, a.owner.id, b.product.id, { bytes: WEBP, width: 10, height: 10 })).rejects.toBeInstanceOf(NotFoundError);
    await expect(removeProductPhoto(db, fakeStorage, a.owner.id, b.photo.id)).rejects.toBeInstanceOf(NotFoundError);
    expect(removed).toEqual([]);
    expect(await db.productPhoto.findUnique({ where: { id: b.photo.id } })).not.toBeNull();
  });

  it("can't take another shop's link by saving basics", async () => {
    await expect(saveShopBasics(db, a.owner.id, {
      name: "Shop a", slug: "shop-b", emphasis: null, tagline: null, accentHex: "#E07A4F", language: "en",
    })).rejects.toThrow(/already uses this link/);
    expect((await db.shop.findUniqueOrThrow({ where: { id: b.shop.id } })).ownerId).toBe(b.owner.id);
  });

  it("won't price a cart with another shop's variant", async () => {
    await expect(placeOrder(db, {
      slug: a.shop.slug, clientKey: "mixed-cart-key-00000001", customerName: "X", fulfilment: "PICKUP", address: null, note: null,
      lines: [{ variantId: b.product.variants[0]!.id, qty: 1 }],
    }, "https://stall.test")).rejects.toThrow(/no longer sold here/);
  });

  it("looks up an order code only within its own shop", async () => {
    const { order } = await orderFor(b, "b-order-key-0000000003");
    expect(await getOrderForCustomer(db, "shop-a", order.code)).toBeNull();
    const found = await getOrderForCustomer(db, "shop-b", order.code);
    expect(found?.code).toBe(order.code);
    expect(found).not.toHaveProperty("customerName");
  });
});

describe("orders", () => {
  it("keeps unsent previews out of the inbox and counts a send only once", async () => {
    const { order } = await orderFor(a, "a-preview-key-00000001", false);
    expect((await listOwnerOrders(db, a.owner.id)).some((o) => o.id === order.id)).toBe(false);
    expect(await markOrderSent(db, "shop-b", "a-preview-key-00000001")).toBe(false);
    expect(await markOrderSent(db, "shop-a", "a-preview-key-00000001")).toBe(true);
    expect(await markOrderSent(db, "shop-a", "a-preview-key-00000001")).toBe(true);
    expect((await listOwnerOrders(db, a.owner.id)).some((o) => o.id === order.id)).toBe(true);
    const stats = await db.dailyStat.findMany({ where: { shopId: a.shop.id } });
    expect(stats.reduce((n, s) => n + s.waClicks, 0)).toBeGreaterThanOrEqual(1);
  });

  it("prices from the database, ignores duplicate submissions and numbers per shop", async () => {
    const first = await orderFor(a, "a-order-key-0000000001");
    const again = await orderFor(a, "a-order-key-0000000001");
    expect(again.repeated).toBe(true);
    expect(again.order.id).toBe(first.order.id);
    expect(first.order.totalPaise).toBe(65000);
    expect(first.url).toContain("wa.me/919876543210");
    const second = await orderFor(a, "a-order-key-0000000002");
    expect(second.order.seq).toBe(first.order.seq + 1);
  });

  it("takes tracked stock when confirmed and returns it when cancelled", async () => {
    const { order } = await orderFor(a, "a-order-key-0000000003");
    const stock = async () => (await db.product.findUniqueOrThrow({ where: { id: a.product.id } })).stockQty;
    const before = await stock();
    await setOrderStatus(db, a.owner.id, order.id, "CONFIRMED");
    expect(await stock()).toBe(before! - 1);
    await setOrderStatus(db, a.owner.id, order.id, "CANCELLED");
    expect(await stock()).toBe(before);
    await expect(setOrderStatus(db, a.owner.id, order.id, "READY")).rejects.toThrow(/can't be marked/);
  });
});
