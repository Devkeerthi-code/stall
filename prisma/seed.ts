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

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: normalizeConnectionString(process.env.DATABASE_URL ?? "") }) });

type DemoProduct = {
  name: string; category: string; description: string; variants: [string, number][];
  stock?: number; featured?: boolean; out?: boolean;
};

type DemoShop = {
  slug: string; owner: string; name: string; emphasis: string; tagline: string; accentHex: string;
  address: string; deliveryNote: string; delivery: boolean; products: DemoProduct[];
};

const SHOPS: DemoShop[] = [
  {
    slug: "demo-meeras-oven", owner: "demo-bakery@stall.invalid", name: "Meera's Oven", emphasis: "Oven",
    tagline: "Eggless cakes and cookies, baked to order at home. (DEMO shop)", accentHex: "#E07A4F",
    address: "Jayanagar, Bengaluru (demo address)", delivery: true,
    deliveryNote: "Pickup from home, or delivery within 5 km. Order cakes a day ahead. (Demo details)",
    products: [
      { name: "Eggless chocolate truffle cake", category: "Cakes", description: "Dark chocolate ganache on a soft sponge. Order a day ahead.", variants: [["1/2 kg", 650], ["1 kg", 1200]] },
      { name: "Dry fruit plum cake", category: "Cakes", description: "Soaked raisins, dates and cashews, baked slow.", variants: [["500 g", 520]], featured: true },
      { name: "Ragi jaggery cookies", category: "Cookies", description: "Crisp finger-millet cookies sweetened with jaggery. Box of 12.", variants: [["", 220]], stock: 18 },
      { name: "Badam milk cookies", category: "Cookies", description: "Almond and cardamom, like a glass of badam milk. Box of 12.", variants: [["", 260]], stock: 10 },
      { name: "Brownie box", category: "Gift boxes", description: "Fudgy brownies in a kraft box with a ribbon.", variants: [["6 pieces", 450], ["12 pieces", 850]], featured: true },
      { name: "Banana walnut loaf", category: "Breads", description: "Ripe bananas, toasted walnuts, a little cinnamon. 400 g.", variants: [["", 380]] },
      { name: "Coconut milk bread", category: "Breads", description: "Soft sandwich bread made with coconut milk. 400 g, sliced.", variants: [["", 110]], out: true },
    ],
  },
  {
    slug: "demo-kaveri-threads", owner: "demo-boutique@stall.invalid", name: "Kaveri Threads", emphasis: "Threads",
    tagline: "Hand-block cotton kurtis and blouses, stitched in Mysuru. (DEMO shop)", accentHex: "#2F855A",
    address: "Mysuru (demo address)", delivery: true,
    deliveryNote: "Courier anywhere in Karnataka, charge shared on WhatsApp. Pickup on Saturdays. (Demo details)",
    products: [
      { name: "Indigo block-print kurti", category: "Kurtis", description: "Soft mul cotton, three-quarter sleeves, side pockets.", variants: [["S", 890], ["M", 890], ["L", 940], ["XL", 990]], stock: 12, featured: true },
      { name: "Mustard straight kurti", category: "Kurtis", description: "Hand-block print with a mandarin collar.", variants: [["M", 790], ["L", 790]], stock: 6 },
      { name: "Kalamkari blouse, made to measure", category: "Blouses", description: "Send your measurements on WhatsApp after ordering. Ready in 5 days.", variants: [["Cotton", 1150], ["Silk-cotton", 1650]] },
      { name: "Cotton dupatta", category: "Dupattas", description: "2.25 m, tassels on both ends.", variants: [["Rust", 450], ["Teal", 450], ["Ivory", 450]], stock: 20 },
      { name: "Kids' frock, block print", category: "Kids", description: "Ages 2 to 6. Breathable cotton.", variants: [["2-3 y", 520], ["4-6 y", 580]], out: true },
    ],
  },
];

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
  for (const shop of SHOPS) await seedShop(shop);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
