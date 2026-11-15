import { randomBytes } from "node:crypto";
import { revalidateStorefront } from "@/lib/cache";
import type { Db } from "@/lib/db";
import { checkUpload, MAX_PHOTOS_PER_PRODUCT } from "@/lib/images";
import type { PhotoStorage } from "@/lib/storage";
import { NotFoundError, UserError } from "@/server/errors";
import { requireOwnedProduct } from "@/server/products";
import { requireOwnerShop, setShopImage } from "@/server/shops";

export type UploadInput = { bytes: Uint8Array; width: number; height: number };

function newKey(shopId: string, ext: string): string {
  return `${shopId}/${randomBytes(12).toString("hex")}.${ext}`;
}

function clampDimension(n: number): number {
  return Number.isFinite(n) ? Math.min(4000, Math.max(1, Math.round(n))) : 1200;
}

async function store(storage: PhotoStorage, shopId: string, bytes: Uint8Array) {
  const check = checkUpload(bytes);
  if (!check.ok) throw new UserError(check.message, "photo");
  return storage.put(newKey(shopId, check.kind.ext), bytes, check.kind.mime);
}

export async function addProductPhoto(db: Db, storage: PhotoStorage, ownerId: string, productId: string, upload: UploadInput) {
  const product = await requireOwnedProduct(db, ownerId, productId);
  const count = await db.productPhoto.count({ where: { productId } });
  if (count >= MAX_PHOTOS_PER_PRODUCT) throw new UserError(`Up to ${MAX_PHOTOS_PER_PRODUCT} photos per product.`, "photo");

  const file = await store(storage, product.shopId, upload.bytes);
  const photo = await db.productPhoto.create({
    data: {
      productId, shopId: product.shopId, url: file.url, storageKey: file.key,
      width: clampDimension(upload.width), height: clampDimension(upload.height), position: count,
    },
  });
  revalidateStorefront(product.shop.slug);
  return photo;
}

/** Only deletes a photo whose shop belongs to this owner. */
export async function removeProductPhoto(db: Db, storage: PhotoStorage, ownerId: string, photoId: string) {
  const photo = await db.productPhoto.findFirst({ where: { id: photoId, shop: { ownerId } }, include: { shop: { select: { slug: true } } } });
  if (!photo) throw new NotFoundError("That photo isn't in your stall.");
  await db.productPhoto.delete({ where: { id: photo.id } });
  await storage.remove(photo.storageKey);
  revalidateStorefront(photo.shop.slug);
}

/** Moves a photo to the front; the first photo is the one customers see on the shelf. */
export async function makeCoverPhoto(db: Db, ownerId: string, photoId: string) {
  const photo = await db.productPhoto.findFirst({ where: { id: photoId, shop: { ownerId } }, include: { shop: { select: { slug: true } } } });
  if (!photo) throw new NotFoundError("That photo isn't in your stall.");
  const all = await db.productPhoto.findMany({ where: { productId: photo.productId }, orderBy: { position: "asc" } });
  const ordered = [photo, ...all.filter((p) => p.id !== photo.id)];
  await db.$transaction(ordered.map((p, i) => db.productPhoto.update({ where: { id: p.id }, data: { position: i } })));
  revalidateStorefront(photo.shop.slug);
}

export async function replaceShopImage(db: Db, storage: PhotoStorage, ownerId: string, kind: "logo" | "banner", upload: UploadInput | null) {
  const shop = await requireOwnerShop(db, ownerId);
  const file = upload ? await store(storage, shop.id, upload.bytes) : null;
  const { previousKey } = await setShopImage(db, ownerId, kind, file);
  if (previousKey) await storage.remove(previousKey).catch((e: unknown) => console.error("old image cleanup failed", e));
  return file;
}
