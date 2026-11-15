import { notFound } from "next/navigation";
import { linkPreview } from "@/server/share-images";
import { getStorefront } from "@/server/storefront";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Shop signboard";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const shop = await getStorefront((await params).slug);
  if (!shop || shop.status !== "OPEN") notFound();
  return linkPreview(shop, null);
}
