import type { Metadata } from "next";
import Link from "next/link";
import { CounterSign } from "@/components/CounterSign";
import { displayUrl, shopUrl } from "@/lib/site";
import { requireOwnerId } from "@/server/session";
import { requireShopPage } from "../../dashboard/_components/require-shop";
import { PrintButton } from "./PrintButton";

export const metadata: Metadata = { title: "Counter sign", robots: { index: false } };

export default async function PosterPage() {
  const ownerId = await requireOwnerId();
  const shop = await requireShopPage(ownerId);
  return (
    <main className="print-page" id="main">
      <CounterSign name={shop.name} emphasis={shop.emphasis} tagline={shop.tagline} accentHex={shop.accentHex} url={shopUrl(shop.slug)} displayLink={displayUrl(shop.slug)} isDemo={shop.isDemo} />
      <div className="print-actions">
        <PrintButton />
        <Link className="btn btn--ghost" href="/dashboard/share">Back to share kit</Link>
      </div>
    </main>
  );
}
