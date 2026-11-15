import { DEMO_SHOPS, type DemoShop } from "../prisma/demo-shops";
import type { CatalogueVariant } from "@/lib/cart";
import { DEFAULT_HOURS } from "@/lib/hours";
import type { Storefront } from "@/server/storefront";

/** Turns the seed data into the same Storefront shape the real app reads from Postgres. */
function toStorefront(shop: DemoShop): Storefront {
  const categoryNames = [...new Set(shop.products.map((p) => p.category))];
  const categoryId = (name: string) => `${shop.slug}-c${categoryNames.indexOf(name)}`;
  return {
    id: shop.slug, slug: shop.slug, name: shop.name, emphasis: shop.emphasis, tagline: shop.tagline,
    logoUrl: null, bannerUrl: null, address: shop.address, mapUrl: null, hours: DEFAULT_HOURS,
    pickup: true, delivery: shop.delivery, deliveryNote: shop.deliveryNote, accentHex: shop.accentHex,
    language: "en", status: "OPEN", isDemo: true, hasWhatsapp: false,
    categories: categoryNames.map((name) => ({ id: categoryId(name), name })),
    products: shop.products.map((p, i) => ({
      id: `${shop.slug}-p${i}`, name: p.name, description: p.description, categoryId: categoryId(p.category),
      featured: !!p.featured, available: !p.out, madeToOrder: p.stock === undefined, photos: [],
      variants: p.variants.map(([label, rupees], j) => ({ id: `${shop.slug}-p${i}-v${j}`, label, pricePaise: rupees * 100 })),
    })),
  };
}

export const STOREFRONTS: Storefront[] = DEMO_SHOPS.map(toStorefront);

export function findStorefront(slug: string): Storefront | undefined {
  return STOREFRONTS.find((s) => s.slug === slug);
}

/** The price list the order "server" uses, built from the shop's data rather than from what the browser sends. */
export function catalogueOf(shop: Storefront): Map<string, CatalogueVariant> {
  return new Map(shop.products.flatMap((p) => p.variants.map((v) => [v.id, {
    variantId: v.id, productId: p.id, productName: p.name, label: v.label, pricePaise: v.pricePaise, available: p.available,
  }] as const)));
}
