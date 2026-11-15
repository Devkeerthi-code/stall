import { describe, expect, it } from "vitest";
import { priceCart, type CatalogueVariant } from "@/lib/cart";

const catalogue = new Map<string, CatalogueVariant>([
  ["v-half", { variantId: "v-half", productId: "p1", productName: "Truffle cake", label: "1/2 kg", pricePaise: 65000, available: true }],
  ["v-box", { variantId: "v-box", productId: "p2", productName: "Cookies", label: "", pricePaise: 22050, available: true }],
  ["v-out", { variantId: "v-out", productId: "p3", productName: "Bread", label: "", pricePaise: 11000, available: false }],
]);

describe("priceCart", () => {
  it("totals lines in paise from catalogue prices", () => {
    const result = priceCart([{ variantId: "v-half", qty: 2 }, { variantId: "v-box", qty: 3 }], catalogue);
    expect(result.ok && result.totalPaise).toBe(65000 * 2 + 22050 * 3);
    expect(result.ok && result.itemCount).toBe(5);
  });

  it("merges duplicate lines", () => {
    const result = priceCart([{ variantId: "v-box", qty: 1 }, { variantId: "v-box", qty: 2 }], catalogue);
    expect(result.ok && result.lines).toHaveLength(1);
    expect(result.ok && result.lines[0]?.qty).toBe(3);
  });

  it("rejects unknown, unavailable and bad quantities", () => {
    expect(priceCart([], catalogue)).toMatchObject({ ok: false, reason: "empty" });
    expect(priceCart([{ variantId: "nope", qty: 1 }], catalogue)).toMatchObject({ ok: false, reason: "unknown-item" });
    expect(priceCart([{ variantId: "v-out", qty: 1 }], catalogue)).toMatchObject({ ok: false, reason: "unavailable" });
    expect(priceCart([{ variantId: "v-box", qty: 0 }], catalogue)).toMatchObject({ ok: false, reason: "bad-quantity" });
    expect(priceCart([{ variantId: "v-box", qty: 60 }, { variantId: "v-box", qty: 60 }], catalogue)).toMatchObject({ ok: false, reason: "bad-quantity" });
  });
});
