import { z } from "zod";
import { isHex } from "@/lib/colour";
import { weekHoursSchema } from "@/lib/hours";
import { parseRupeesToPaise } from "@/lib/money";
import { normalizeIndianMobile } from "@/lib/phone";
import { checkSlug, SLUG_MESSAGES } from "@/lib/slug";

export const LANGUAGES = ["en", "hi", "ta", "kn", "te", "ml"] as const;
export type Language = (typeof LANGUAGES)[number];

const text = (max: number) => z.string().trim().max(max, `Keep it under ${max} characters.`);
const optionalText = (max: number) => text(max).transform((v) => (v === "" ? null : v));
const checkbox = z.union([z.boolean(), z.literal("on"), z.literal("true"), z.literal("false"), z.literal("")])
  .transform((v) => v === true || v === "on" || v === "true");

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address.").max(120);

export const signupSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, "Use at least 8 characters.").max(72, "Keep it under 72 characters."),
});

export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1).max(72) });

export const slugSchema = z.string().trim().toLowerCase().superRefine((slug, ctx) => {
  const problem = checkSlug(slug);
  if (problem) ctx.addIssue({ code: "custom", message: SLUG_MESSAGES[problem] });
});

export const shopBasicsSchema = z.object({
  name: text(60).min(2, "Give your stall a name."),
  slug: slugSchema,
  emphasis: optionalText(60),
  tagline: optionalText(120),
  accentHex: z.string().refine(isHex, "Pick a colour.").transform((v) => v.toUpperCase()),
  language: z.enum(LANGUAGES),
}).refine((v) => !v.emphasis || v.name.split(/\s+/).includes(v.emphasis), {
  message: "Pick a word from your shop name.", path: ["emphasis"],
});

const mapHosts = /^(maps\.app\.goo\.gl|goo\.gl|maps\.google\.[a-z.]+|www\.google\.[a-z.]+|google\.[a-z.]+)$/;
export const mapUrlSchema = optionalText(500).refine((v) => {
  if (!v) return true;
  try {
    const url = new URL(v);
    return url.protocol === "https:" && mapHosts.test(url.hostname);
  } catch {
    return false;
  }
}, "Paste a Google Maps share link (it starts with https://maps.app.goo.gl/).");

export const whatsappSchema = z.string().transform((v, ctx) => {
  const normal = normalizeIndianMobile(v);
  if (!normal) {
    ctx.addIssue({ code: "custom", message: "Enter a 10-digit Indian mobile number, like 98765 43210." });
    return z.NEVER;
  }
  return normal;
});

export const shopContactSchema = z.object({
  whatsapp: whatsappSchema,
  address: optionalText(240),
  mapUrl: mapUrlSchema,
  pickup: checkbox,
  delivery: checkbox,
  deliveryNote: optionalText(240),
}).refine((v) => v.pickup || v.delivery, { message: "Choose pickup, delivery or both.", path: ["pickup"] });

export const shopHoursSchema = weekHoursSchema;

export const priceSchema = z.string().transform((v, ctx) => {
  const paise = parseRupeesToPaise(v);
  if (paise === null) {
    ctx.addIssue({ code: "custom", message: "Enter a price like 650 or 650.50." });
    return z.NEVER;
  }
  return paise;
});

export const variantInputSchema = z.object({ label: text(40), price: priceSchema });

export const productInputSchema = z.object({
  name: text(80).min(2, "Give the product a name."),
  description: optionalText(600),
  category: optionalText(40),
  variants: z.array(variantInputSchema).min(1, "Add a price.").max(10, "Up to 10 sizes."),
  stockMode: z.enum(["TRACKED", "MADE_TO_ORDER"]),
  stockQty: z.coerce.number().int().min(0).max(99999).nullable(),
  inStock: checkbox,
  featured: checkbox,
}).superRefine((v, ctx) => {
  if (v.variants.length > 1 && v.variants.some((x) => !x.label)) {
    ctx.addIssue({ code: "custom", message: "Name every size, like 1/2 kg or Large.", path: ["variants"] });
  }
  const labels = v.variants.map((x) => x.label.toLowerCase());
  if (new Set(labels).size !== labels.length) ctx.addIssue({ code: "custom", message: "Two sizes have the same name.", path: ["variants"] });
  if (v.stockMode === "TRACKED" && v.stockQty === null) ctx.addIssue({ code: "custom", message: "How many do you have?", path: ["stockQty"] });
});

export type ProductInput = z.infer<typeof productInputSchema>;

export const placeOrderSchema = z.object({
  slug: z.string().trim().toLowerCase().max(40),
  clientKey: z.string().regex(/^[A-Za-z0-9-]{16,64}$/),
  customerName: text(60).min(1, "Add your name so the shop knows who's ordering."),
  fulfilment: z.enum(["PICKUP", "DELIVERY"]),
  address: optionalText(240),
  note: optionalText(240),
  lines: z.array(z.object({ variantId: z.string().min(1).max(40), qty: z.number().int().min(1).max(99) })).min(1).max(60),
}).refine((v) => v.fulfilment === "PICKUP" || !!v.address, { message: "Add a delivery address.", path: ["address"] });

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;

export const orderCodeSchema = z.string().trim().toUpperCase().regex(/^\d{4,6}-[2-9A-HJ-NP-Z]{4}$/, "Order codes look like 0142-K7QX.");

export const trackSchema = z.object({
  slug: z.string().max(40),
  event: z.enum(["store_view", "product_view"]),
  productId: z.string().max(40).optional(),
});

export const reportSchema = z.object({
  slug: z.string().max(40),
  reason: z.enum(["SCAM", "PROHIBITED", "OFFENSIVE", "IMPERSONATION", "OTHER"]),
  details: optionalText(600),
});

/** First message per field, for showing next to inputs. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    out[key] ??= issue.message;
  }
  return out;
}
