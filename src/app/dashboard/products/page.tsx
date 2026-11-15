import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { listOwnerProducts } from "@/server/products";
import { requireOwnerId } from "@/server/session";
import { PanelHead } from "../_components/PanelHead";
import { ProductRow } from "../_components/ProductRow";
import { requireShopPage } from "../_components/require-shop";

export const metadata: Metadata = { title: "Products" };

export default async function ProductsPage() {
  const ownerId = await requireOwnerId();
  await requireShopPage(ownerId);
  const products = await listOwnerProducts(getDb(), ownerId);

  return (
    <section className="panel" aria-labelledby="products-h">
      <PanelHead n="02" label={`Catalogue · ${products.length} products`} title="Your" emphasis="products">
        <div className="page-actions">
          <Link className="btn btn--ghost" href="/dashboard/products/import">Import from a spreadsheet</Link>
          <Link className="btn" href="/dashboard/products/new">Add a product</Link>
        </div>
      </PanelHead>

      {products.length === 0 ? (
        <div className="state ruled-top">
          <h3>Nothing on the <b>shelf</b> yet</h3>
          <p>Add your first product. A name, a price and a clear photo are enough.</p>
          <Link className="btn" href="/dashboard/products/new">Add your first product</Link>
        </div>
      ) : (
        <div style={{ borderTop: "1px solid var(--ink)" }}>
          {products.map((p) => (
            <ProductRow
              key={p.id}
              product={{
                id: p.id, name: p.name, category: p.category?.name ?? null, featured: p.featured, inStock: p.inStock,
                stockMode: p.stockMode, stockQty: p.stockQty, photo: p.photos[0]?.url ?? null,
                prices: p.variants.map((v) => v.pricePaise), sizes: p.variants.filter((v) => v.label).length,
              }}
            />
          ))}
        </div>
      )}

      <details className="plus" style={{ marginTop: "var(--s-5)" }}>
        <summary><span className="plus-icon" aria-hidden="true" />What does &ldquo;out of stock&rdquo; do?<span className="label">Help</span></summary>
        <div className="plus__body">The item stays on your stall, greyed out, with &ldquo;Out of stock&rdquo; instead of the Add button. Customers can&apos;t add it to their slip. Switch it back on when the next batch is ready.</div>
      </details>
      <details className="plus">
        <summary><span className="plus-icon" aria-hidden="true" />Made to order or keep stock?<span className="label">Help</span></summary>
        <div className="plus__body">Made to order never runs out: good for cakes, tailoring and tiffin. If you keep stock, Stall counts it down each time you mark an order Confirmed, and adds it back if you cancel.</div>
      </details>
    </section>
  );
}
