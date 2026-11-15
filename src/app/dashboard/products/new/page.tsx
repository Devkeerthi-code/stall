import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { requireOwnerId } from "@/server/session";
import { PanelHead } from "../../_components/PanelHead";
import { EMPTY_PRODUCT, ProductForm } from "../../_components/ProductForm";
import { requireShopPage } from "../../_components/require-shop";

export const metadata: Metadata = { title: "Add a product" };

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const ownerId = await requireOwnerId();
  const shop = await requireShopPage(ownerId);
  const { from } = await searchParams;
  const categories = await getDb().category.findMany({ where: { shopId: shop.id }, orderBy: { position: "asc" }, select: { name: true } });
  const back = from === "setup" ? "/dashboard/setup?step=3" : "/dashboard/products";

  return (
    <section className="panel">
      <PanelHead n="02" label="Catalogue · new" title="Add a" emphasis="product">
        <Link className="btn btn--ghost" href={back}>Back</Link>
      </PanelHead>
      <div className="editor">
        <ProductForm productId={null} initial={EMPTY_PRODUCT} categories={categories.map((c) => c.name)} returnTo={from === "setup" ? "setup" : undefined} />
        <aside className="notice" style={{ display: "block" }}>
          <p className="small"><b>Photos come next.</b> Save the product first, then add up to 5 photos. They&apos;re shrunk on your phone so they load fast for customers.</p>
        </aside>
      </div>
    </section>
  );
}
