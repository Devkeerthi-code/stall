import type { Metadata } from "next";
import { DEFAULT_HOURS } from "@/lib/hours";
import { parseHours } from "@/lib/validation";
import { formatIndianMobile } from "@/lib/phone";
import { siteUrl } from "@/lib/site";
import { requireOwnerId } from "@/server/session";
import { BasicsForm } from "../_components/BasicsForm";
import { ContactForm } from "../_components/ContactForm";
import { HoursForm } from "../_components/HoursForm";
import { PanelHead } from "../_components/PanelHead";
import { requireShopPage } from "../_components/require-shop";
import { PauseSwitch, ShopImages } from "./ShopImages";

export const metadata: Metadata = { title: "Shop details" };

export default async function SettingsPage() {
  const ownerId = await requireOwnerId();
  const shop = await requireShopPage(ownerId);

  return (
    <section className="panel" aria-labelledby="settings-h">
      <PanelHead n="05" label="Shop details" title="Your" emphasis="shop" />
      {shop.status === "TAKEN_DOWN" && (
        <p className="notice notice--bad" role="alert" style={{ marginBottom: "var(--s-5)" }}>
          This stall was taken down by Stall{shop.takedownReason ? `: ${shop.takedownReason}` : ""}. Customers can&apos;t see it.
        </p>
      )}
      <PauseSwitch paused={shop.status === "PAUSED"} disabled={shop.status === "DRAFT" || shop.status === "TAKEN_DOWN"} />

      <div style={{ marginTop: "var(--s-5)" }}>
        <details className="plus" open>
          <summary><span className="plus-icon" aria-hidden="true" />Signboard, link and language<span className="label">01</span></summary>
          <div className="plus__body" style={{ maxWidth: "none" }}>
            <BasicsForm mode="settings" siteHost={siteUrl().replace(/^https?:\/\//, "")}
              initial={{ name: shop.name, slug: shop.slug, emphasis: shop.emphasis, tagline: shop.tagline, accentHex: shop.accentHex, language: shop.language }} />
          </div>
        </details>
        <details className="plus">
          <summary><span className="plus-icon" aria-hidden="true" />Logo and banner<span className="label">02</span></summary>
          <div className="plus__body" style={{ maxWidth: 640 }}><ShopImages logoUrl={shop.logoUrl} bannerUrl={shop.bannerUrl} /></div>
        </details>
        <details className="plus">
          <summary><span className="plus-icon" aria-hidden="true" />WhatsApp, address and delivery<span className="label">03</span></summary>
          <div className="plus__body">
            <ContactForm mode="settings" initial={{
              whatsapp: shop.whatsapp ? formatIndianMobile(shop.whatsapp).replace("+91 ", "") : "", address: shop.address ?? "",
              mapUrl: shop.mapUrl ?? "", pickup: shop.pickup, delivery: shop.delivery, deliveryNote: shop.deliveryNote ?? "",
            }} />
          </div>
        </details>
        <details className="plus">
          <summary><span className="plus-icon" aria-hidden="true" />Opening hours<span className="label">04</span></summary>
          <div className="plus__body" style={{ maxWidth: 640 }}><HoursForm mode="settings" initial={parseHours(shop.hours) ?? DEFAULT_HOURS} /></div>
        </details>
      </div>
    </section>
  );
}
