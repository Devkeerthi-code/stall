/**
 * Seeds two DEMO shops so visitors can see how a storefront works. They are marked isDemo:
 * labelled "DEMO" everywhere, never indexed, and never open WhatsApp (no real number is stored).
 * The demo owner accounts get random passwords nobody knows, so they can't be signed into.
 */
import "dotenv/config";
import { randomBytes } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { normalizeConnectionString } from "../src/lib/db";
import { DEFAULT_HOURS } from "../src/lib/hours";
import { DEMO_SHOPS, type DemoShop } from "./demo-shops";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: normalizeConnectionString(process.env.DATABASE_URL ?? "") }) });

async function seedShop(shop: DemoShop) {
  await db.shop.deleteMany({ where: { slug: shop.slug } });
  const passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 10);
  const owner = await db.user.upsert({ where: { email: shop.owner }, create: { email: shop.owner, passwordHash }, update: { passwordHash } });

  const created = await db.shop.create({
    data: {
      ownerId: owner.id, slug: shop.slug, name: shop.name, emphasis: shop.emphasis, tagline: shop.tagline,
      accentHex: shop.accentHex, address: shop.address, deliveryNote: shop.deliveryNote, pickup: true, delivery: shop.delivery,
      hours: DEFAULT_HOURS, status: "OPEN", setupStep: 6, isDemo: true, openedAt: new Date(),
    },
  });

  const categories = [...new Set(shop.products.map((p) => p.category))];
  const ids = new Map<string, string>();
  for (const [position, name] of categories.entries()) {
    const c = await db.category.create({ data: { shopId: created.id, name, position } });
    ids.set(name, c.id);
  }

  for (const [position, p] of shop.products.entries()) {
    await db.product.create({
      data: {
        shopId: created.id, name: p.name, description: p.description, categoryId: ids.get(p.category) ?? null,
        stockMode: p.stock === undefined ? "MADE_TO_ORDER" : "TRACKED", stockQty: p.stock ?? null,
        inStock: !p.out, featured: !!p.featured, position,
        variants: { create: p.variants.map(([label, rupees], i) => ({ label, pricePaise: rupees * 100, position: i })) },
      },
    });
  }
  console.log(`Seeded DEMO shop /s/${shop.slug} (${shop.products.length} products)`);
}

async function main() {
  for (const shop of DEMO_SHOPS) await seedShop(shop);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
