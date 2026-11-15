import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { requireOwnerId } from "@/server/session";
import { getOwnerShop } from "@/server/shops";

export default async function DashboardHome() {
  const shop = await getOwnerShop(getDb(), await requireOwnerId());
  redirect(!shop || shop.setupStep < 6 ? "/dashboard/setup" : "/dashboard/orders");
}
