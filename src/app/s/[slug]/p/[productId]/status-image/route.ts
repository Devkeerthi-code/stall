import { statusImage } from "@/server/share-images";
import { getStorefront } from "@/server/storefront";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string; productId: string }> }) {
  const { slug, productId } = await params;
  const shop = await getStorefront(slug);
  const product = shop?.products.find((p) => p.id === productId);
  if (!shop || shop.status === "TAKEN_DOWN" || !product) return new Response("Not found", { status: 404 });
  return statusImage(shop, product);
}
