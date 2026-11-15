import { notFound } from "next/navigation";
import { linkPreview } from "@/server/share-images";
import { getStorefront } from "@/server/storefront";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Product photo and price";

export default async function Image({ params }: { params: Promise<{ slug: string; productId: string }> }) {
  const { slug, productId } = await params;
  const shop = await getStorefront(slug);
  const product = shop?.products.find((p) => p.id === productId);
  if (!shop || shop.status !== "OPEN" || !product) notFound();
  return linkPreview(shop, product);
}
