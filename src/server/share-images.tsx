import { readFile } from "node:fs/promises";
import { ImageResponse } from "next/og";
import { shopPalette } from "@/lib/colour";
import { formatRupees } from "@/lib/money";
import { displayUrl } from "@/lib/site";
import { LOCAL_URL_PREFIX, LocalDiskStorage } from "@/lib/storage/local";
import type { Storefront, StorefrontProduct } from "@/server/storefront";

const PAPER = "#FBF8F2";
const INK = "#1C1A17";

/**
 * Loads a photo as a data URI. Local photos are read from disk (next/og refuses to fetch localhost),
 * Blob photos are fetched with a short timeout. Any failure just means the image renders without it.
 */
async function photoData(url: string | undefined): Promise<string | null> {
  if (!url) return null;
  try {
    if (url.startsWith(`${LOCAL_URL_PREFIX}/`)) {
      const bytes = await readFile(new LocalDiskStorage().resolve(url.slice(LOCAL_URL_PREFIX.length + 1)));
      return `data:image/jpeg;base64,${bytes.toString("base64")}`;
    }
    const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!response.ok) return null;
    const type = response.headers.get("content-type") ?? "image/jpeg";
    return `data:${type};base64,${Buffer.from(await response.arrayBuffer()).toString("base64")}`;
  } catch {
    return null;
  }
}

function minPrice(p: StorefrontProduct): number {
  return Math.min(...p.variants.map((v) => v.pricePaise));
}

/** Wide link preview (1200x630): signboard on the left, product photo on the right. */
export async function linkPreview(shop: Storefront, product: StorefrontProduct | null) {
  const palette = shopPalette(shop.accentHex);
  const photo = await photoData((product?.photos[0] ?? shop.products.find((p) => p.photos[0])?.photos[0])?.url);
  const title = product ? product.name : shop.name;
  const sub = product ? `${product.variants.length > 1 ? "from " : ""}${formatRupees(minPrice(product))} · ${shop.name}` : shop.tagline ?? "Browse and order on WhatsApp";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: PAPER, color: INK }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 56, background: palette.sign, color: palette.signInk }}>
          <div style={{ fontSize: 22, letterSpacing: 2, textTransform: "uppercase", opacity: 0.8 }}>{shop.isDemo ? "Demo stall" : "Order on WhatsApp"}</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: title.length > 28 ? 56 : 76, fontWeight: 800, lineHeight: 1, letterSpacing: -2 }}>{title}</div>
            <div style={{ fontSize: 30, marginTop: 24 }}>{sub}</div>
          </div>
          <div style={{ fontSize: 22, opacity: 0.85 }}>{displayUrl(shop.slug)}</div>
        </div>
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" width={520} height={630} style={{ width: 520, height: 630, objectFit: "cover" }} />
        )}
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=3600" } },
  );
}

/** WhatsApp-status sized image (1080x1920) that looks like a counter sign for one product. */
export async function statusImage(shop: Storefront, product: StorefrontProduct) {
  const palette = shopPalette(shop.accentHex);
  const photo = await photoData(product.photos[0]?.url);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: palette.sign, color: palette.signInk, padding: 72 }}>
        <div style={{ fontSize: 34, letterSpacing: 3, textTransform: "uppercase", opacity: 0.85 }}>{shop.isDemo ? "Demo stall · new" : "New at the stall"}</div>
        <div style={{ fontSize: 104, fontWeight: 800, lineHeight: 1, letterSpacing: -3, marginTop: 24 }}>{shop.name}</div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", marginTop: 64, background: PAPER, color: INK, border: `3px solid ${INK}` }}>
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" width={930} height={930} style={{ width: "100%", height: 930, objectFit: "cover" }} />
          ) : (
            <div style={{ height: 930, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 280, fontWeight: 800, color: "#B9AE98" }}>{product.name.slice(0, 1)}</div>
          )}
          <div style={{ display: "flex", flexDirection: "column", padding: 48 }}>
            <div style={{ fontSize: 60, fontWeight: 800, lineHeight: 1.1 }}>{product.name}</div>
            <div style={{ fontSize: 88, fontWeight: 800, marginTop: 24 }}>{`${product.variants.length > 1 ? "from " : ""}${formatRupees(minPrice(product))}`}</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 48, fontSize: 34 }}>
          <span>Order on WhatsApp</span>
          <span>{displayUrl(shop.slug)}</span>
        </div>
      </div>
    ),
    { width: 1080, height: 1920 },
  );
}
