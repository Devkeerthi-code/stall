import type { Metadata } from "next";
import Link from "next/link";
import { CounterSign } from "@/components/CounterSign";
import { getDb } from "@/lib/db";
import { displayUrl, shopUrl } from "@/lib/site";
import { requireOwnerId } from "@/server/session";
import { PanelHead } from "../_components/PanelHead";
import { requireShopPage } from "../_components/require-shop";
import { ShareTools } from "./ShareTools";

export const metadata: Metadata = { title: "Share kit" };

export default async function SharePage() {
  const ownerId = await requireOwnerId();
  const shop = await requireShopPage(ownerId);
  const products = await getDb().product.findMany({
    where: { shopId: shop.id }, orderBy: [{ featured: "desc" }, { createdAt: "desc" }], take: 50, select: { id: true, name: true },
  });
  const url = shopUrl(shop.slug);

  return (
    <section className="panel" aria-labelledby="share-h">
      <PanelHead n="04" label="Share kit" title="Put your stall" emphasis="on the counter" />
      {shop.status !== "OPEN" && (
        <p className="notice" style={{ marginBottom: "var(--s-5)" }}>
          Your stall isn&apos;t open yet, so these links won&apos;t work for customers. <Link className="link" href="/dashboard/setup?step=5">Open the shutter</Link>
        </p>
      )}
      <div className="kit">
        <div className="kit__item">
          <span className="label">A5 counter sign · print and stand</span>
          <div className="counter">
            <CounterSign name={shop.name} emphasis={shop.emphasis} tagline={shop.tagline} accentHex={shop.accentHex} url={url} displayLink={displayUrl(shop.slug)} isDemo={shop.isDemo} />
          </div>
          <Link className="btn" href="/print/poster" target="_blank">Open printable sign ↗</Link>
        </div>
        <ShareTools slug={shop.slug} shopUrl={url} products={products} />
      </div>
      <details className="plus" style={{ marginTop: "var(--s-6)" }}>
        <summary><span className="plus-icon" aria-hidden="true" />Printing tips<span className="label">Help</span></summary>
        <div className="plus__body">Print on A5, or on A4 and cut in half. Thick paper stands on its own; otherwise tape it at eye height next to the billing counter. The QR code works from about an arm&apos;s length away.</div>
      </details>
      <details className="plus">
        <summary><span className="plus-icon" aria-hidden="true" />Where to share the link<span className="label">Help</span></summary>
        <div className="plus__body">Your WhatsApp status and Business profile, Instagram bio, family and society groups. When you share a product link, WhatsApp shows its photo and price as a preview.</div>
      </details>
    </section>
  );
}
