import { priceCart, type CartRequestLine } from "@/lib/cart";
import { buildOrderMessage } from "@/lib/whatsapp";
import { catalogueOf, findStorefront } from "./data";

/**
 * GitHub Pages has no server, so the storefront's API calls are answered in the browser.
 * Orders are priced by the same priceCart and written by the same buildOrderMessage that
 * /api/orders uses for demo shops. Nothing is saved or sent anywhere.
 */
type OrderBody = {
  slug?: string; customerName?: string; fulfilment?: "PICKUP" | "DELIVERY";
  address?: string; note?: string; lines?: CartRequestLine[];
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function previewOrder(init?: RequestInit): Response {
  const body = JSON.parse(String(init?.body ?? "{}")) as OrderBody;
  const shop = findStorefront(body.slug ?? "");
  if (!shop) return json({ error: "Shop not found." }, 404);
  const customerName = (body.customerName ?? "").trim().slice(0, 60);
  if (!customerName) return json({ error: "Add your name so the shop knows who's ordering." }, 400);
  const fulfilment = body.fulfilment === "DELIVERY" ? "DELIVERY" : "PICKUP";
  const address = (body.address ?? "").trim().slice(0, 240);
  if (fulfilment === "DELIVERY" && !address) return json({ error: "Add a delivery address." }, 400);

  const priced = priceCart(Array.isArray(body.lines) ? body.lines : [], catalogueOf(shop));
  if (!priced.ok) return json({ error: "Something in your slip changed. Please check it again." }, 400);
  const { message } = buildOrderMessage({
    shopName: shop.name, lines: priced.lines, totalPaise: priced.totalPaise, customerName, fulfilment,
    address, note: (body.note ?? "").trim().slice(0, 240),
    code: "DEMO-0000", statusUrl: `${location.origin}${location.pathname}#${shop.slug}`,
  }, "910000000000");
  return json({ demo: true, message, url: null, code: null });
}

export function installMockApi() {
  const realFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.pathname : input.url;
    if (url === "/api/orders") return previewOrder(init);
    if (url.startsWith("/api/")) return json({ ok: true });
    return realFetch(input, init);
  };
  const realBeacon = navigator.sendBeacon?.bind(navigator);
  navigator.sendBeacon = (url, data) => (String(url).startsWith("/api/") ? true : (realBeacon?.(url, data) ?? false));
}
