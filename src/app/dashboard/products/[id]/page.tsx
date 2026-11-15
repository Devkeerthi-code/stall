import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { paiseToInput } from "@/lib/money";
import { shopUrl } from "@/lib/site";
import { NotFoundError } from "@/server/errors";
import { requireOwnedProduct } from "@/server/products";
import { requireOwnerId } from "@/server/session";
import { PanelHead } from "../../_components/PanelHead";
import { PhotoManager } from "../../_components/PhotoManager";
import { ProductForm } from "../../_components/ProductForm";

export const metadata: Metadata = { title: "Edit product" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ from?: string; added?: string }> };

export default async function EditProductPage({ params, searchParams }: Props) {
  const ownerId = await requireOwnerId();
  const { id } = await params;
  const { from, added } = await searchParams;
  const db = getDb();
  const product = await requireOwnedProduct(db, ownerId, id).catch((error: unknown) => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });
  const [variants, photos, categories, category] = await Promise.all([
    db.variant.findMany({ where: { productId: id }, orderBy: { position: "asc" } }),
    db.productPhoto.findMany({ where: { productId: id }, orderBy: { position: "asc" }, select: { id: true, url: true } }),
    db.category.findMany({ where: { shopId: product.shopId }, orderBy: { position: "asc" }, select: { name: true } }),
    product.categoryId ? db.category.findUnique({ where: { id: product.categoryId } }) : null,
  ]);
  const back = from === "setup" ? "/dashboard/setup?step=3" : "/dashboard/products";

  return (
    <section className="panel">
      <PanelHead n="02" label="Catalogue · edit" title="Edit" emphasis={product.name}>
        <div className="page-actions">
          {product.shop.status === "OPEN" && <a className="btn btn--ghost" href={`${shopUrl(product.shop.slug)}/p/${product.id}`} target="_blank" rel="noreferrer">View ↗</a>}
          <Link className="btn" href={back}>{from === "setup" ? "Back to setup" : "Done"}</Link>
        </div>
      </PanelHead>
      {added && <p className="notice notice--ok" role="status" style={{ marginBottom: "var(--s-5)" }}>Added to your stall. Now add a photo or two.</p>}
      <div className="editor">
        <ProductForm
          productId={product.id}
          categories={categories.map((c) => c.name)}
          initial={{
            name: product.name, description: product.description ?? "", category: category?.name ?? "",
            variants: variants.map((v) => ({ label: v.label, price: paiseToInput(v.pricePaise) })),
            stockMode: product.stockMode, stockQty: product.stockQty, inStock: product.inStock, featured: product.featured,
          }}
        />
        <PhotoManager productId={product.id} photos={photos} />
      </div>
    </section>
  );
}
