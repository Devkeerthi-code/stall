import type { PrismaClient } from "@/generated/prisma/client";

let n = 0;

export async function makeOwnerWithShop(db: PrismaClient, slug: string) {
  n += 1;
  const owner = await db.user.create({ data: { email: `owner${n}-${slug}@test.local`, passwordHash: "x" } });
  const shop = await db.shop.create({
    data: { ownerId: owner.id, slug, name: `Shop ${slug}`, whatsapp: "919876543210", status: "OPEN", openedAt: new Date() },
  });
  const product = await db.product.create({
    data: {
      shopId: shop.id, name: `Cake ${slug}`, stockMode: "TRACKED", stockQty: 5,
      variants: { create: [{ label: "1/2 kg", pricePaise: 65000, position: 0 }, { label: "1 kg", pricePaise: 120000, position: 1 }] },
    },
    include: { variants: true },
  });
  const photo = await db.productPhoto.create({
    data: { productId: product.id, shopId: shop.id, url: "/media/x", storageKey: `${shop.id}/aaaaaaaaaaaa.webp`, width: 10, height: 10 },
  });
  return { owner, shop, product, photo };
}
