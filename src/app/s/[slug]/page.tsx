import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { messages } from "@/lib/i18n";
import { getStorefront } from "@/server/storefront";
import { OpenBoard } from "./_components/OpenBoard";
import { Shelf } from "./_components/Shelf";
import { SlipPanel } from "./_components/SlipPanel";
import { StoreInfo } from "./_components/StoreInfo";
import { TrackView } from "./_components/TrackView";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const shop = await getStorefront((await params).slug);
  if (!shop || shop.status === "DRAFT") return {};
  const description = shop.tagline ?? `See everything ${shop.name} sells and order on WhatsApp.`;
  return {
    title: shop.isDemo ? `${shop.name} (demo)` : shop.name,
    description,
    openGraph: { title: shop.name, description, type: "website" },
    robots: shop.status === "TAKEN_DOWN" || shop.isDemo ? { index: false } : undefined,
  };
}

function TakenDown() {
  return (
    <main className="store-error" id="main">
      <span className="label">Stall</span>
      <h1>This stall is <b>not available</b></h1>
      <p className="muted">It was removed after a report. If you ordered from it, contact the seller directly.</p>
    </main>
  );
}

export default async function StorePage({ params }: Props) {
  const shop = await getStorefront((await params).slug);
  if (!shop || shop.status === "DRAFT") notFound();
  if (shop.status === "TAKEN_DOWN") return <TakenDown />;
  const t = messages(shop.language);
  const words = shop.name.split(" ");
  const heavy = shop.emphasis ?? words[words.length - 1];
  const paused = shop.status === "PAUSED";

  return (
    <>
      <header className="signboard">
        <div className="signboard__in">
          {shop.isDemo && <span className="demo-badge signboard__demo">DEMO shop · sample data</span>}
          {shop.logoUrl && <div className="signboard__logo"><Image src={shop.logoUrl} alt="" width={56} height={56} /></div>}
          <h1>{words.map((w, i) => <span key={i}>{i ? " " : ""}{w === heavy ? <b>{w}</b> : w}</span>)}</h1>
          {shop.tagline && <p className="signboard__tag">{shop.tagline}</p>}
          {shop.address && <p className="signboard__meta"><span>{shop.address}</span></p>}
          <OpenBoard hours={shop.hours} paused={paused} />
        </div>
      </header>
      {shop.bannerUrl && <div className="banner"><Image src={shop.bannerUrl} alt="" fill preload sizes="100vw" /></div>}
      <div className="store">
        <main className="shelf" id="main">
          {paused && <p className="closed-note">{t.paused}</p>}
          {shop.products.length === 0 ? <p className="empty-results">{t.empty}</p> : <Shelf products={shop.products} categories={shop.categories} />}
          <StoreInfo shop={shop} t={t} />
          <footer className="made"><Link className="label" href="/">Made with Stall</Link>{shop.isDemo && <span className="label">DEMO storefront</span>}</footer>
        </main>
        <SlipPanel />
      </div>
      <TrackView slug={shop.slug} />
    </>
  );
}
