import { lineTotal, sumPaise } from "@/lib/money";

export const MAX_QTY_PER_LINE = 99;
export const MAX_LINES = 60;

export type CartRequestLine = { variantId: string; qty: number };

export type CatalogueVariant = {
  variantId: string;
  productId: string;
  productName: string;
  label: string;
  pricePaise: number;
  available: boolean;
};

export type PricedLine = {
  productId: string;
  variantId: string;
  name: string;
  variant: string;
  qty: number;
  unitPaise: number;
  linePaise: number;
};

export type PricedCart =
  | { ok: true; lines: PricedLine[]; totalPaise: number; itemCount: number }
  | { ok: false; reason: "empty" | "too-many-lines" | "bad-quantity" | "unknown-item" | "unavailable"; variantId?: string };

/**
 * Prices a cart using only the shop's own catalogue. The browser sends variant ids and quantities;
 * prices, names and availability always come from the database, so a tampered cart can't change totals.
 * Duplicate variant ids are merged.
 */
export function priceCart(request: readonly CartRequestLine[], catalogue: ReadonlyMap<string, CatalogueVariant>): PricedCart {
  if (request.length === 0) return { ok: false, reason: "empty" };

  const merged = new Map<string, number>();
  for (const line of request) {
    if (!Number.isSafeInteger(line.qty) || line.qty < 1) return { ok: false, reason: "bad-quantity", variantId: line.variantId };
    merged.set(line.variantId, (merged.get(line.variantId) ?? 0) + line.qty);
  }
  if (merged.size > MAX_LINES) return { ok: false, reason: "too-many-lines" };

  const lines: PricedLine[] = [];
  for (const [variantId, qty] of merged) {
    if (qty > MAX_QTY_PER_LINE) return { ok: false, reason: "bad-quantity", variantId };
    const item = catalogue.get(variantId);
    if (!item) return { ok: false, reason: "unknown-item", variantId };
    if (!item.available) return { ok: false, reason: "unavailable", variantId };
    lines.push({
      productId: item.productId,
      variantId,
      name: item.productName,
      variant: item.label,
      qty,
      unitPaise: item.pricePaise,
      linePaise: lineTotal(item.pricePaise, qty),
    });
  }
  return {
    ok: true,
    lines,
    totalPaise: sumPaise(lines.map((l) => l.linePaise)),
    itemCount: lines.reduce((n, l) => n + l.qty, 0),
  };
}
