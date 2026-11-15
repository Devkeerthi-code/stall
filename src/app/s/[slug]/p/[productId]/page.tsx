import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { messages } from "@/lib/i18n";
import { formatRupees } from "@/lib/money";
import { getStorefront } from "@/server/storefront";
import { SlipPanel } from "../../_components/SlipPanel";
import { TrackView } from "../../_components/TrackView";
import { AddToSlip } from "./AddToSlip";

type Props = { params: Promise<{ slug: string; productId: string }> };

// Rendered on first visit, then served from cache until the owner edits the shop.
export const revalidate = 86400;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

async function load(params: Props["params"]) {
  const { slug, productId } = await params;
  const shop = await getStorefront(slug);
  if (!shop || shop.status === "DRAFT" || shop.status === "TAKEN_DOWN") return null;
  const product = shop.products.find((p) => p.id === productId);
  return product ? { shop, product } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await load(params);
  if (!found) return {};
  const { shop, product } = found;
  const price = formatRupees(Math.min(...product.variants.map((v) => v.pricePaise)));
  const description = `${price}${product.variants.length > 1 ? " onwards" : ""} at ${shop.name}. ${product.description ?? "Order on WhatsApp."}`.slice(0, 200);
  return {
    title: `${product.name} · ${shop.name}`,
    description,
    openGraph: { title: `${product.name} · ${price}`, description, type: "website" },
    robots: shop.isDemo ? { index: false } : undefined,
  };
}

export default async function ProductPage({ params }: Props) {
  const found = await load(params);
  if (!found) notFound();
  const { shop, product } = found;
  const t = messages(shop.language);
  const min = Math.min(...product.variants.map((v) => v.pricePaise));

  return (
    <>
      <header className="minihead">
        <div className="minihead__in">
          <Link className="back" href={`/s/${shop.slug}`}>← {t.back}</Link>
          <Link href={`/s/${shop.slug}`} style={{ marginLeft: "auto" }}>{shop.name}</Link>
        </div>
      </header>
      <div className="store">
        <main className="pdp" id="main">
          <div>
            <div className="gallery" aria-label={t.photos}>
              {product.photos.length ? product.photos.map((photo, i) => (
                <div className="gallery__item" key={photo.url}>
                  <Image src={photo.url} alt={`${product.name} ${i + 1}`} fill preload={i === 0} sizes="(min-width: 900px) 50vw, 100vw" />
                </div>
              )) : <div className="gallery__item"><span className="ph-blank" aria-hidden="true">{product.name.slice(0, 1)}</span></div>}
            </div>
            {product.photos.length > 1 && <div className="gallery-dots" aria-hidden="true">{product.photos.map((p) => <span key={p.url} />)}</div>}
          </div>
          <div className="pdp__info">
            {shop.isDemo && <span className="demo-badge">DEMO product</span>}
            <h1>{product.name}</h1>
            <p className="pdp__price">{product.variants.length > 1 && <small className="label">{t.from} </small>}{formatRupees(min)}</p>
            {product.madeToOrder && <span className="card__mto">{t.madeToOrder}</span>}
            <AddToSlip product={product} />
            <div>
              {product.description && (
                <details className="plus" open>
                  <summary><span className="plus-icon" aria-hidden="true" />{t.ingredients}</summary>
                  <div className="plus__body" style={{ whiteSpace: "pre-line" }}>{product.description}</div>
                </details>
              )}
              <details className="plus">
                <summary><span className="plus-icon" aria-hidden="true" />{t.deliveryInfo}</summary>
                <div className="plus__body">{shop.deliveryNote ?? [shop.pickup ? t.pickup : null, shop.delivery ? t.delivery : null].filter(Boolean).join(" · ")}</div>
              </details>
            </div>
          </div>
        </main>
        <SlipPanel />
      </div>
      <TrackView slug={shop.slug} productId={product.id} />
    </>
  );
}
