import { revalidateStorefront } from "@/lib/cache";
import type { ImportRow } from "@/lib/csv";
import type { Db } from "@/lib/db";
import type { ProductInput } from "@/lib/validation";
import { NotFoundError, UserError } from "@/server/errors";
import { requireOwnerShop } from "@/server/shops";
import { recordUsage } from "@/server/usage";

export const MAX_PRODUCTS_PER_SHOP = 500;

/** Finds a product only if it belongs to this owner's shop. Another shop's id looks like "not found". */
export async function requireOwnedProduct(db: Db, ownerId: string, productId: string) {
  const product = await db.product.findFirst({ where: { id: productId, shop: { ownerId } }, include: { shop: true } });
  if (!product) throw new NotFoundError("That product isn't in your stall.");
  return product;
}

async function categoryIdFor(db: Db, shopId: string, name: string | null): Promise<string | null> {
  if (!name) return null;
  const category = await db.category.upsert({
    where: { shopId_name: { shopId, name } },
    create: { shopId, name, position: await db.category.count({ where: { shopId } }) },
    update: {},
  });
  return category.id;
}

function stockFields(input: Pick<ProductInput, "stockMode" | "stockQty">) {
  return input.stockMode === "TRACKED"
    ? { stockMode: "TRACKED" as const, stockQty: input.stockQty ?? 0 }
    : { stockMode: "MADE_TO_ORDER" as const, stockQty: null };
}

export async function listOwnerProducts(db: Db, ownerId: string) {
  const shop = await requireOwnerShop(db, ownerId);
  return db.product.findMany({
    where: { shopId: shop.id },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    include: { variants: { orderBy: { position: "asc" } }, photos: { orderBy: { position: "asc" }, take: 1 }, category: true },
  });
}

export async function createProduct(db: Db, ownerId: string, input: ProductInput) {
  const shop = await requireOwnerShop(db, ownerId);
  const count = await db.product.count({ where: { shopId: shop.id } });
  if (count >= MAX_PRODUCTS_PER_SHOP) throw new UserError(`A stall can hold up to ${MAX_PRODUCTS_PER_SHOP} products.`);

  const product = await db.product.create({
    data: {
      shopId: shop.id,
      name: input.name,
      description: input.description,
      categoryId: await categoryIdFor(db, shop.id, input.category),
      ...stockFields(input),
      inStock: input.inStock,
      featured: input.featured,
      position: count,
      variants: { create: input.variants.map((v, i) => ({ label: v.label, pricePaise: v.price, position: i })) },
    },
  });
  await recordUsage(db, "product_added");
  revalidateStorefront(shop.slug);
  return product;
}

/**
 * Variants are matched by label so existing ids (and past order links to them) survive an edit.
 * Sizes that were removed are deleted; order history keeps its own copy of name and price.
 */
export async function updateProduct(db: Db, ownerId: string, productId: string, input: ProductInput) {
  const existing = await requireOwnedProduct(db, ownerId, productId);
  const categoryId = await categoryIdFor(db, existing.shopId, input.category);
  const labels = input.variants.map((v) => v.label);

  await db.$transaction([
    db.variant.deleteMany({ where: { productId, label: { notIn: labels } } }),
    ...input.variants.map((v, i) =>
      db.variant.upsert({
        where: { productId_label: { productId, label: v.label } },
        create: { productId, label: v.label, pricePaise: v.price, position: i },
        update: { pricePaise: v.price, position: i },
      }),
    ),
    db.product.update({
      where: { id: productId },
      data: { name: input.name, description: input.description, categoryId, ...stockFields(input), inStock: input.inStock, featured: input.featured },
    }),
  ]);
  revalidateStorefront(existing.shop.slug);
}

export async function setProductInStock(db: Db, ownerId: string, productId: string, inStock: boolean) {
  const product = await requireOwnedProduct(db, ownerId, productId);
  await db.product.update({ where: { id: product.id }, data: { inStock } });
  revalidateStorefront(product.shop.slug);
}

/** Returns photo storage keys so the caller can delete the files after the rows are gone. */
export async function deleteProduct(db: Db, ownerId: string, productId: string): Promise<string[]> {
  const product = await requireOwnedProduct(db, ownerId, productId);
  const photos = await db.productPhoto.findMany({ where: { productId }, select: { storageKey: true } });
  await db.product.delete({ where: { id: product.id } });
  revalidateStorefront(product.shop.slug);
  return photos.map((p) => p.storageKey);
}

/** Adds every valid row in one transaction. Names already in the stall are skipped, not duplicated. */
export async function importProducts(db: Db, ownerId: string, rows: readonly ImportRow[]) {
  const shop = await requireOwnerShop(db, ownerId);
  const existing = await db.product.findMany({ where: { shopId: shop.id }, select: { name: true } });
  const taken = new Set(existing.map((p) => p.name.toLowerCase()));
  const fresh = rows.filter((r) => !taken.has(r.name.toLowerCase()));
  if (existing.length + fresh.length > MAX_PRODUCTS_PER_SHOP) {
    throw new UserError(`A stall can hold up to ${MAX_PRODUCTS_PER_SHOP} products.`);
  }

  const categoryIds = new Map<string, string | null>();
  for (const name of new Set(fresh.map((r) => r.category))) {
    categoryIds.set(name ?? "", await categoryIdFor(db, shop.id, name));
  }

  await db.$transaction(
    fresh.map((row, i) =>
      db.product.create({
        data: {
          shopId: shop.id,
          name: row.name,
          description: row.description,
          categoryId: categoryIds.get(row.category ?? "") ?? null,
          stockMode: row.stockQty === null ? "MADE_TO_ORDER" : "TRACKED",
          stockQty: row.stockQty,
          featured: row.featured,
          position: existing.length + i,
          variants: { create: row.variants.map((v, j) => ({ label: v.label, pricePaise: v.pricePaise, position: j })) },
        },
      }),
    ),
  );
  if (fresh.length) await recordUsage(db, "csv_imported");
  revalidateStorefront(shop.slug);
  return { added: fresh.length, skipped: rows.length - fresh.length };
}
