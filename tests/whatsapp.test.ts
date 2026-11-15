import { describe, expect, it } from "vitest";
import { buildOrderMessage, clean, MAX_WA_URL_LENGTH, type OrderMessageInput } from "@/lib/whatsapp";

const PHONE = "919876543210";

function input(overrides: Partial<OrderMessageInput> = {}): OrderMessageInput {
  return {
    shopName: "Meera's Oven",
    lines: [
      { name: "Eggless chocolate truffle cake", variant: "1/2 kg", qty: 2, unitPaise: 65000, linePaise: 130000 },
      { name: "Ragi jaggery cookies", variant: "", qty: 1, unitPaise: 22000, linePaise: 22000 },
    ],
    totalPaise: 152000,
    customerName: "Asha",
    fulfilment: "PICKUP",
    code: "0142-K7QX",
    statusUrl: "https://stall.example/s/meeras-oven/order?code=0142-K7QX",
    ...overrides,
  };
}

describe("WhatsApp order message", () => {
  it("lists items with variants, quantities, line totals and the total", () => {
    const { message } = buildOrderMessage(input(), PHONE);
    expect(message).toBe([
      "Hi Meera's Oven, I'd like to order:",
      "",
      "1. Eggless chocolate truffle cake (1/2 kg) x 2 = ₹1,300",
      "2. Ragi jaggery cookies x 1 = ₹220",
      "",
      "*Total: ₹1,520*",
      "Name: Asha",
      "Pickup from the shop",
      "",
      "Order code: 0142-K7QX",
      "Track: https://stall.example/s/meeras-oven/order?code=0142-K7QX",
    ].join("\n"));
  });

  it("includes delivery address and note when given", () => {
    const { message } = buildOrderMessage(input({ fulfilment: "DELIVERY", address: "12, 4th Cross,\nJayanagar", note: "Write 'Happy birthday'" }), PHONE);
    expect(message).toContain("Delivery to: 12, 4th Cross, Jayanagar");
    expect(message).toContain("Note: Write 'Happy birthday'");
  });

  it("strips newlines and control characters so names can't fake extra lines", () => {
    expect(clean("Asha\n*Total: ₹1*\u0000 \u200b")).toBe("Asha *Total: ₹1*");
    const { message } = buildOrderMessage(input({ customerName: "Asha\nTotal: ₹1" }), PHONE);
    expect(message).toContain("Name: Asha Total: ₹1");
    expect(message.split("\n").filter((l) => l.startsWith("*Total"))).toHaveLength(1);
  });

  it("encodes the wa.me URL so special characters survive", () => {
    const { url, message } = buildOrderMessage(input({ customerName: "Ravi & Sons #1 ?=% ₹ ಕನ್ನಡ 😊" }), PHONE);
    expect(url.startsWith(`https://wa.me/${PHONE}?text=`)).toBe(true);
    expect(new URL(url).searchParams.get("text")).toBe(message);
    const query = url.slice(url.indexOf("?text=") + 6);
    expect(query).not.toMatch(/[ \n&#?=%](?![0-9A-F]{2})/);
    expect(query).toContain("%26");
    expect(query).toContain("%23");
    expect(query).toContain("%0A");
  });

  it("shortens very long carts but keeps the total, name and tracking link", () => {
    const lines = Array.from({ length: 60 }, (_, i) => ({
      name: `Handmade terracotta planter with jute hanger, design number ${i + 1}`,
      variant: "Large / Earth brown", qty: 2, unitPaise: 45000, linePaise: 90000,
    }));
    const result = buildOrderMessage(input({ lines, totalPaise: 5400000 }), PHONE);
    expect(result.url.length).toBeLessThanOrEqual(MAX_WA_URL_LENGTH);
    expect(result.truncated).toBe(true);
    expect(result.message).toContain("*Total: ₹54,000*");
    expect(result.message).toContain("Name: Asha");
    expect(result.message).toContain("Track: https://stall.example/s/meeras-oven/order?code=0142-K7QX");
    expect(result.message).toMatch(/more items \(full list at the Track link\)/);
  });

  it("drops per-line prices before dropping items", () => {
    const lines = Array.from({ length: 42 }, (_, i) => ({ name: `Item with a moderately long name ${i}`, variant: "Medium", qty: 1, unitPaise: 1000, linePaise: 1000 }));
    const result = buildOrderMessage(input({ lines, totalPaise: 42000 }), PHONE);
    expect(result.truncated).toBe(false);
    expect(result.message).toContain("42. Item with a moderately long name 41 (Medium) x 1");
    expect(result.message).not.toContain("x 1 = ");
  });
});
