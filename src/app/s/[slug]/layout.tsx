import { Noto_Sans_Devanagari, Noto_Sans_Kannada, Noto_Sans_Malayalam, Noto_Sans_Tamil, Noto_Sans_Telugu } from "next/font/google";
import { notFound } from "next/navigation";
import { shopPalette } from "@/lib/colour";
import { messages } from "@/lib/i18n";
import type { Language } from "@/lib/validation";
import { getStorefront } from "@/server/storefront";
import { StoreProvider } from "./_components/StoreProvider";

// Only the font for the shop's language is applied, so the others are never downloaded.
const devanagari = Noto_Sans_Devanagari({ subsets: ["devanagari"], weight: ["400", "600", "800"], variable: "--font-script", preload: false, display: "swap" });
const tamil = Noto_Sans_Tamil({ subsets: ["tamil"], weight: ["400", "600", "800"], variable: "--font-script", preload: false, display: "swap" });
const kannada = Noto_Sans_Kannada({ subsets: ["kannada"], weight: ["400", "600", "800"], variable: "--font-script", preload: false, display: "swap" });
const telugu = Noto_Sans_Telugu({ subsets: ["telugu"], weight: ["400", "600", "800"], variable: "--font-script", preload: false, display: "swap" });
const malayalam = Noto_Sans_Malayalam({ subsets: ["malayalam"], weight: ["400", "600", "800"], variable: "--font-script", preload: false, display: "swap" });
const SCRIPT_FONT: Record<Language, string> = {
  en: "", hi: devanagari.variable, ta: tamil.variable, kn: kannada.variable, te: telugu.variable, ml: malayalam.variable,
};

export const revalidate = 86400;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

export default async function StorefrontLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shop = await getStorefront(slug);
  if (!shop || shop.status === "DRAFT") notFound();

  const palette = shopPalette(shop.accentHex);
  const style = {
    "--shop": palette.sign, "--shop-ink": palette.signInk,
    "--shop-paint-l": palette.paintLight, "--shop-paint-ink-l": palette.paintInkLight,
    "--shop-paint-d": palette.paintDark, "--shop-paint-ink-d": palette.paintInkDark,
  } as React.CSSProperties;

  const entries = shop.products.flatMap((p) => p.variants.map((v) => ({
    variantId: v.id, productId: p.id, name: p.name, label: v.label, pricePaise: v.pricePaise, available: p.available,
  })));

  return (
    <div className={`storefront ${SCRIPT_FONT[shop.language]}`} lang={shop.language} style={style}>
      <StoreProvider
        slug={shop.slug} shopName={shop.name} isDemo={shop.isDemo} acceptsOrders={shop.status === "OPEN" && (shop.hasWhatsapp || shop.isDemo)}
        pickup={shop.pickup} delivery={shop.delivery} lang={shop.language} dict={messages(shop.language)} entries={entries}
      >
        {children}
      </StoreProvider>
    </div>
  );
}
