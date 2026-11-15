import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const cache = vi.hoisted(() => ({ revalidateTag: vi.fn(), revalidatePath: vi.fn(), unstable_cache: (fn: () => unknown) => fn }));
vi.mock("next/cache", () => cache);

import type { PrismaClient } from "@/generated/prisma/client";
import { storefrontTag } from "@/lib/cache";
import { productInputSchema } from "@/lib/validation";
import { placeOrder, setOrderStatus } from "@/server/orders";
import { createProduct, setProductInStock, updateProduct } from "@/server/products";
import { saveShopBasics } from "@/server/shops";
import { makeOwnerWithShop } from "./helpers/fixtures";
import { createTestDb } from "./helpers/test-db";

let db: PrismaClient;
let close: () => Promise<void>;
let fx: Awaited<ReturnType<typeof makeOwnerWithShop>>;

const input = productInputSchema.parse({
  name: "Plum cake", description: "", category: "Cakes", variants: [{ label: "500 g", price: "520" }],
  stockMode: "MADE_TO_ORDER", stockQty: null, inStock: true, featured: true,
});

beforeAll(async () => {
  ({ db, close } = await createTestDb());
  fx = await makeOwnerWithShop(db, "cache-shop");
});
afterAll(async () => close());
beforeEach(() => { cache.revalidateTag.mockClear(); cache.revalidatePath.mockClear(); });

function expectRevalidated(slug: string) {
  expect(cache.revalidateTag).toHaveBeenCalledWith(storefrontTag(slug), { expire: 0 });
  expect(cache.revalidatePath).toHaveBeenCalledWith(`/s/${slug}`, "layout");
}

describe("storefront cache revalidation", () => {
  it("refreshes the storefront when a product is added, edited or hidden", async () => {
    const product = await createProduct(db, fx.owner.id, input);
    expectRevalidated("cache-shop");
    cache.revalidateTag.mockClear();
    await updateProduct(db, fx.owner.id, product.id, { ...input, name: "Plum cake (new recipe)" });
    expectRevalidated("cache-shop");
    cache.revalidateTag.mockClear();
    await setProductInStock(db, fx.owner.id, product.id, false);
    expectRevalidated("cache-shop");
  });

  it("refreshes both the old and new link when the slug changes", async () => {
    await saveShopBasics(db, fx.owner.id, { name: "Cache shop", slug: "cache-shop-2", emphasis: null, tagline: null, accentHex: "#2440A8", language: "ta" });
    expectRevalidated("cache-shop");
    expectRevalidated("cache-shop-2");
  });

  it("refreshes when an accepted order changes tracked stock, but not for plain status changes", async () => {
    const { order } = await placeOrder(db, {
      slug: "cache-shop-2", clientKey: "cache-order-key-000001", customerName: "R", fulfilment: "PICKUP", address: null, note: null,
      lines: [{ variantId: fx.product.variants[0]!.id, qty: 1 }],
    }, "https://stall.test");
    expect(cache.revalidateTag).not.toHaveBeenCalled();
    await setOrderStatus(db, fx.owner.id, order.id, "CONFIRMED");
    expectRevalidated("cache-shop-2");
    cache.revalidateTag.mockClear();
    await setOrderStatus(db, fx.owner.id, order.id, "READY");
    expect(cache.revalidateTag).not.toHaveBeenCalled();
  });
});
