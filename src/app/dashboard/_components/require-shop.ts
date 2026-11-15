import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { getOwnerShop } from "@/server/shops";

/** Pages past setup need a shop; send owners without one to step 01. */
export async function requireShopPage(ownerId: string) {
  const shop = await getOwnerShop(getDb(), ownerId);
  if (!shop) redirect("/dashboard/setup");
  return shop;
}
