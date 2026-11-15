import { unstable_cache } from "next/cache";
import { storefrontTag } from "@/lib/cache";
import type { Db } from "@/lib/db";
import { getDb } from "@/lib/db";
import { parseHours, type WeekHours } from "@/lib/hours";
import type { Language } from "@/lib/validation";

export type StorefrontVariant = { id: string; label: string; pricePaise: number };
export type StorefrontPhoto = { url: string; width: number; height: number };
export type StorefrontProduct = {
  id: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  featured: boolean;
  available: boolean;
  madeToOrder: boolean;
  variants: StorefrontVariant[];
  photos: StorefrontPhoto[];
};
export type Storefront = {
  id: string;
  slug: string;
  name: string;
  emphasis: string | null;
  tagline: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  address: string | null;
  mapUrl: string | null;
  hours: WeekHours | null;
  pickup: boolean;
  delivery: boolean;
  deliveryNote: string | null;
  accentHex: string;
  language: Language;
  status: "OPEN" | "PAUSED" | "TAKEN_DOWN" | "DRAFT";
  isDemo: boolean;
  hasWhatsapp: boolean;
  categories: { id: string; name: string }[];
  products: StorefrontProduct[];
};

/** Public, cache-safe view of a shop. The WhatsApp number is left out on purpose; orders go through the server. */
export async function loadStorefront(db: Db, slug: string): Promise<Storefront | null> {
  const shop = await db.shop.findUnique({
    where: { slug },
    include: {
      categories: { orderBy: { position: "asc" }, select: { id: true, name: true } },
      products: {
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        include: {
          variants: { orderBy: { position: "asc" }, select: { id: true, label: true, pricePaise: true } },
          photos: { orderBy: { position: "asc" }, select: { url: true, width: true, height: true } },
        },
      },
    },
  });
  if (!shop) return null;

  const usedCategories = new Set(shop.products.map((p) => p.categoryId));
  return {
    id: shop.id, slug: shop.slug, name: shop.name, emphasis: shop.emphasis, tagline: shop.tagline,
    logoUrl: shop.logoUrl, bannerUrl: shop.bannerUrl, address: shop.address, mapUrl: shop.mapUrl,
    hours: parseHours(shop.hours), pickup: shop.pickup, delivery: shop.delivery, deliveryNote: shop.deliveryNote,
    accentHex: shop.accentHex, language: shop.language, status: shop.status, isDemo: shop.isDemo,
    hasWhatsapp: !!shop.whatsapp,
    categories: shop.categories.filter((c) => usedCategories.has(c.id)),
    products: shop.products.map((p) => ({
      id: p.id, name: p.name, description: p.description, categoryId: p.categoryId, featured: p.featured,
      madeToOrder: p.stockMode === "MADE_TO_ORDER",
      available: p.inStock && (p.stockMode === "MADE_TO_ORDER" || (p.stockQty ?? 0) > 0),
      variants: p.variants,
      photos: p.photos,
    })),
  };
}

/** Cached per shop until the owner edits something (see revalidateStorefront). */
export function getStorefront(slug: string): Promise<Storefront | null> {
  return unstable_cache(() => loadStorefront(getDb(), slug), ["storefront", slug], { tags: [storefrontTag(slug)] })();
}
