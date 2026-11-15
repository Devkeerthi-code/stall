import { useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import { OpenBoard } from "@/app/s/[slug]/_components/OpenBoard";
import { Shelf } from "@/app/s/[slug]/_components/Shelf";
import { SlipPanel } from "@/app/s/[slug]/_components/SlipPanel";
import { StoreInfo } from "@/app/s/[slug]/_components/StoreInfo";
import { StoreProvider } from "@/app/s/[slug]/_components/StoreProvider";
import { shopPalette } from "@/lib/colour";
import { messages } from "@/lib/i18n";
import type { Storefront } from "@/server/storefront";
import { STOREFRONTS } from "./data";
import { installMockApi } from "./mock-api";

const REPO_URL = "https://github.com/Devkeerthi-code/stall";

function currentSlug(): string {
  const slug = location.hash.slice(1);
  return STOREFRONTS.some((s) => s.slug === slug) ? slug : STOREFRONTS[0]!.slug;
}

function subscribeHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

function DemoBar({ active }: { active: string }) {
  return (
    <nav className="demo-bar" aria-label="Demo">
      <p className="demo-bar__note"><b>Static demo</b> of Stall. Browse, fill the order slip and see the exact WhatsApp message. Nothing is saved or sent.</p>
      <div className="chips">
        {STOREFRONTS.map((s) => (
          <a key={s.slug} className="chip" href={`#${s.slug}`} aria-current={s.slug === active ? "page" : undefined}>{s.name}</a>
        ))}
        <a className="chip" href={REPO_URL}>Code and setup ↗</a>
      </div>
    </nav>
  );
}

/** Same markup as src/app/s/[slug]/page.tsx and layout.tsx, fed from the demo data instead of Postgres. */
function Store({ shop }: { shop: Storefront }) {
  const t = messages(shop.language);
  const palette = shopPalette(shop.accentHex);
  const style = {
    "--shop": palette.sign, "--shop-ink": palette.signInk,
    "--shop-paint-l": palette.paintLight, "--shop-paint-ink-l": palette.paintInkLight,
    "--shop-paint-d": palette.paintDark, "--shop-paint-ink-d": palette.paintInkDark,
  } as React.CSSProperties;
  const entries = shop.products.flatMap((p) => p.variants.map((v) => ({
    variantId: v.id, productId: p.id, name: p.name, label: v.label, pricePaise: v.pricePaise, available: p.available,
  })));
  const words = shop.name.split(" ");
  const heavy = shop.emphasis ?? words[words.length - 1];

  return (
    <div className="storefront" lang={shop.language} style={style}>
      <StoreProvider
        slug={shop.slug} shopName={shop.name} isDemo acceptsOrders pickup={shop.pickup} delivery={shop.delivery}
        lang={shop.language} dict={t} entries={entries}
      >
        <header className="signboard">
          <div className="signboard__in">
            <span className="demo-badge signboard__demo">DEMO shop · sample data</span>
            <h1>{words.map((w, i) => <span key={i}>{i ? " " : ""}{w === heavy ? <b>{w}</b> : w}</span>)}</h1>
            {shop.tagline && <p className="signboard__tag">{shop.tagline}</p>}
            {shop.address && <p className="signboard__meta"><span>{shop.address}</span></p>}
            <OpenBoard hours={shop.hours} paused={false} />
          </div>
        </header>
        <div className="store">
          <main className="shelf" id="main">
            <Shelf products={shop.products} categories={shop.categories} />
            <StoreInfo shop={shop} t={t} />
            <footer className="made"><a className="label" href={REPO_URL}>Made with Stall</a><span className="label">DEMO storefront</span></footer>
          </main>
          <SlipPanel />
        </div>
      </StoreProvider>
    </div>
  );
}

function App() {
  const slug = useSyncExternalStore(subscribeHash, currentSlug);
  const shop = STOREFRONTS.find((s) => s.slug === slug)!;
  return (
    <>
      <DemoBar active={slug} />
      <Store key={slug} shop={shop} />
    </>
  );
}

installMockApi();
createRoot(document.getElementById("root")!).render(<App />);
