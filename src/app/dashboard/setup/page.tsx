import Link from "next/link";
import { getDb } from "@/lib/db";
import { DEFAULT_HOURS, parseHours } from "@/lib/hours";
import { formatRupees } from "@/lib/money";
import { formatIndianMobile } from "@/lib/phone";
import { displayUrl, shopUrl, siteUrl } from "@/lib/site";
import { requireOwnerId } from "@/server/session";
import { getOwnerShop } from "@/server/shops";
import { finishProductsStepAction } from "../actions";
import { BasicsForm } from "../_components/BasicsForm";
import { ContactForm } from "../_components/ContactForm";
import { HoursForm } from "../_components/HoursForm";
import { OpenShutter } from "../_components/OpenShutter";
import { PanelHead } from "../_components/PanelHead";

const STEPS = ["Name your stall", "Your WhatsApp", "Add products", "Opening hours", "Open the shutter"] as const;
const HELP = [
  "This goes on your signboard and in your link. Pick the word customers use for you; it is set heavier.",
  "Orders come to this number as a WhatsApp message. Customers see it only when they tap Send.",
  "One product is enough to open. A clear photo sells more than a long description.",
  "Customers see an Open now / Closed board. They can still send orders when you're closed.",
  "Opening makes your link live. You can close for the day any time from Shop details.",
];

export default async function SetupPage({ searchParams }: { searchParams: Promise<{ step?: string }> }) {
  const ownerId = await requireOwnerId();
  const db = getDb();
  const shop = await getOwnerShop(db, ownerId);
  const reached = shop?.setupStep ?? 1;
  const step = Math.min(Math.max(Number((await searchParams).step) || reached, 1), Math.min(reached, 5));
  const products = shop
    ? await db.product.findMany({
        where: { shopId: shop.id }, orderBy: { position: "asc" },
        include: { variants: { orderBy: { position: "asc" }, take: 1 } },
      })
    : [];

  return (
    <section className="panel" aria-labelledby="setup-h">
      <PanelHead n="00" label="Setup · about 5 minutes" title="Set up your" emphasis="stall">
        <span className="label" aria-live="polite">{String(step).padStart(2, "0")} / 05</span>
      </PanelHead>
      <ol className="steps">
        {STEPS.map((label, i) => {
          const n = i + 1;
          return (
            <li key={label}>
              <Link href={`/dashboard/setup?step=${n}`} aria-current={n === step ? "step" : undefined} data-done={n < reached} aria-disabled={n > reached || undefined}>
                <span className="steps__n">{String(n).padStart(2, "0")}</span>
                <span className="steps__t">{label}</span>
              </Link>
            </li>
          );
        })}
      </ol>

      <div style={{ paddingTop: "var(--s-6)" }}>
        <h2 className="step-title" id="setup-h"><span className="mono">{String(step).padStart(2, "0")} / 05</span>{STEPS[step - 1]}</h2>
        <p className="help">{HELP[step - 1]}</p>

        {step === 1 && (
          <BasicsForm
            mode="setup"
            siteHost={siteUrl().replace(/^https?:\/\//, "")}
            initial={shop ? { name: shop.name, slug: shop.slug, emphasis: shop.emphasis, tagline: shop.tagline, accentHex: shop.accentHex, language: shop.language } : null}
          />
        )}
        {step === 2 && shop && (
          <ContactForm
            mode="setup"
            initial={{
              whatsapp: shop.whatsapp ? formatIndianMobile(shop.whatsapp).replace("+91 ", "") : "",
              address: shop.address ?? "", mapUrl: shop.mapUrl ?? "", pickup: shop.pickup,
              delivery: shop.delivery, deliveryNote: shop.deliveryNote ?? "",
            }}
          />
        )}
        {step === 3 && (
          <div className="stack-lg" style={{ marginTop: "var(--s-5)" }}>
            {products.length === 0 ? (
              <div className="state">
                <h3>Your shelf is <b>empty</b></h3>
                <p>Add the one thing people ask you for most. You can add the rest later, or all at once from a spreadsheet.</p>
              </div>
            ) : (
              <ul className="checklist">
                {products.map((p) => (
                  <li key={p.id}>
                    <Link className="link" href={`/dashboard/products/${p.id}?from=setup`}>{p.name}</Link>
                    <span className="mono">{p.variants[0] ? formatRupees(p.variants[0].pricePaise) : ""}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="step-actions">
              <Link className="btn btn--ghost" href="/dashboard/products/new?from=setup">{products.length ? "Add another product" : "Add your first product"}</Link>
              <Link className="btn btn--ghost" href="/dashboard/products/import?from=setup">Add many from a spreadsheet</Link>
              <form action={finishProductsStepAction}>
                <button className="btn" type="submit" disabled={!products.length}>Next step <span aria-hidden="true">↗</span></button>
              </form>
            </div>
          </div>
        )}
        {step === 4 && (
          <div style={{ marginTop: "var(--s-5)" }}>
            <HoursForm mode="setup" initial={parseHours(shop?.hours) ?? DEFAULT_HOURS} />
          </div>
        )}
        {step === 5 && shop && (
          <div className="step-body">
            <ul className="checklist">
              <li><span>Signboard</span><span className="mono">Done</span></li>
              <li><span>WhatsApp number</span><span className="mono" style={{ color: shop.whatsapp ? undefined : "var(--bad)" }}>{shop.whatsapp ? "Done" : "Missing"}</span></li>
              <li><span>Products</span><span className="mono" style={{ color: products.length ? undefined : "var(--bad)" }}>{products.length ? `${products.length} on the shelf` : "None yet"}</span></li>
              <li><span>Opening hours</span><span className="mono">{shop.hours ? "Done" : "Default"}</span></li>
            </ul>
            <OpenShutter
              shopName={shop.name}
              shopUrl={shopUrl(shop.slug)}
              displayLink={displayUrl(shop.slug)}
              ready={!!shop.whatsapp && products.length > 0}
              alreadyOpen={shop.status === "OPEN"}
            />
          </div>
        )}
      </div>
    </section>
  );
}
