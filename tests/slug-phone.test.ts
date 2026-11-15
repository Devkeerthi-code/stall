import { describe, expect, it } from "vitest";
import { formatIndianMobile, normalizeIndianMobile } from "@/lib/phone";
import { checkSlug, slugify } from "@/lib/slug";
import { slugSchema, whatsappSchema } from "@/lib/validation";

describe("slug validation", () => {
  it("makes a link from a shop name", () => {
    expect(slugify("Meera's Oven")).toBe("meeras-oven");
    expect(slugify("  Café   Lakshmi!! ")).toBe("cafe-lakshmi");
    expect(slugify("मीरा")).toBe("");
  });

  it("accepts clean slugs and explains bad ones", () => {
    expect(checkSlug("meeras-oven")).toBeNull();
    expect(checkSlug("ab")).toBe("too-short");
    expect(checkSlug("a".repeat(41))).toBe("too-long");
    expect(checkSlug("Meeras")).toBe("bad-characters");
    expect(checkSlug("-meera")).toBe("bad-characters");
    expect(checkSlug("meera-")).toBe("bad-characters");
    expect(checkSlug("meera--oven")).toBe("bad-characters");
    expect(checkSlug("meera_oven")).toBe("bad-characters");
    expect(checkSlug("admin")).toBe("reserved");
    expect(checkSlug("dashboard")).toBe("reserved");
    expect(checkSlug("whatsapp")).toBe("reserved");
  });

  it("lower-cases in the schema before checking", () => {
    expect(slugSchema.parse("Meeras-Oven")).toBe("meeras-oven");
    expect(slugSchema.safeParse("api").success).toBe(false);
  });
});

describe("Indian WhatsApp numbers", () => {
  it.each([
    ["9876543210", "919876543210"],
    ["98765 43210", "919876543210"],
    ["+91 98765-43210", "919876543210"],
    ["09876543210", "919876543210"],
    ["919876543210", "919876543210"],
    ["(+91) 6123 456 789", "916123456789"],
  ])("accepts %s", (raw, expected) => {
    expect(normalizeIndianMobile(raw)).toBe(expected);
  });

  it.each(["5876543210", "987654321", "98765432100", "+1 415 555 0100", "98765abcde", "", "040 1234 5678"])("rejects %s", (raw) => {
    expect(normalizeIndianMobile(raw)).toBeNull();
    expect(whatsappSchema.safeParse(raw).success).toBe(false);
  });

  it("formats for display", () => {
    expect(formatIndianMobile("919876543210")).toBe("+91 98765 43210");
  });
});
