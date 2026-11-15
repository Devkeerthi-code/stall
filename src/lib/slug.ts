/** Words that can't be a shop link because they are app routes, look official, or invite abuse. */
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  "admin", "administrator", "api", "app", "auth", "dashboard", "login", "logout", "signin", "signup",
  "register", "account", "settings", "help", "support", "about", "terms", "privacy", "contact",
  "stall", "stalls", "shop", "shops", "store", "s", "p", "www", "mail", "media", "uploads", "static",
  "assets", "public", "order", "orders", "new", "edit", "demo", "test", "official", "whatsapp",
  "meta", "facebook", "instagram", "google", "amazon", "flipkart", "paytm", "phonepe", "gpay",
  "upi", "bank", "rbi", "gov", "government", "police", "null", "undefined", "root", "system",
]);

export const SLUG_MIN = 3;
export const SLUG_MAX = 40;

export type SlugProblem = "too-short" | "too-long" | "bad-characters" | "reserved";

/** "Meera's Oven!" -> "meeras-oven". Non-Latin names fall back to an empty string (owner types one). */
export function slugify(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, "");
}

export function checkSlug(slug: string): SlugProblem | null {
  if (slug.length < SLUG_MIN) return "too-short";
  if (slug.length > SLUG_MAX) return "too-long";
  if (!/^[a-z0-9](?:[a-z0-9]|-(?!-))*[a-z0-9]$/.test(slug)) return "bad-characters";
  if (RESERVED_SLUGS.has(slug)) return "reserved";
  return null;
}

export const SLUG_MESSAGES: Record<SlugProblem | "taken", string> = {
  "too-short": "Use at least 3 letters or numbers.",
  "too-long": "Keep it under 40 characters.",
  "bad-characters": "Use small letters, numbers and single dashes only (like meeras-oven).",
  reserved: "That word is kept for Stall itself. Try adding your area, like meeras-oven-jayanagar.",
  taken: "Another shop already uses this link. Try adding your area or a word.",
};
