import { describe, expect, it } from "vitest";
import { formatRupees, lineTotal, paiseToInput, parseRupeesToPaise, sumPaise } from "@/lib/money";

describe("money in integer paise", () => {
  it("formats with Indian grouping and only shows paise when needed", () => {
    expect(formatRupees(0)).toBe("₹0");
    expect(formatRupees(65000)).toBe("₹650");
    expect(formatRupees(65050)).toBe("₹650.50");
    expect(formatRupees(65005)).toBe("₹650.05");
    expect(formatRupees(12000000)).toBe("₹1,20,000");
    expect(formatRupees(123456789)).toBe("₹12,34,567.89");
  });

  it("parses what owners type", () => {
    expect(parseRupeesToPaise("650")).toBe(65000);
    expect(parseRupeesToPaise("650.5")).toBe(65050);
    expect(parseRupeesToPaise("₹1,200")).toBe(120000);
    expect(parseRupeesToPaise("Rs. 99.99")).toBe(9999);
    expect(parseRupeesToPaise(" 0 ")).toBe(0);
  });

  it("rejects anything that isn't a clean amount", () => {
    for (const bad of ["", "abc", "-5", "1.234", "1e3", "12,34.5.6", "999999999"]) {
      expect(parseRupeesToPaise(bad)).toBeNull();
    }
  });

  it("avoids floating point drift", () => {
    expect(sumPaise([10, 20])).toBe(30);
    expect(lineTotal(33333, 3)).toBe(99999);
    expect(sumPaise([lineTotal(19999, 7), lineTotal(1, 1)])).toBe(139994);
  });

  it("refuses non-integer or negative amounts and quantities", () => {
    expect(() => sumPaise([1.5])).toThrow();
    expect(() => lineTotal(100, 0)).toThrow();
    expect(() => lineTotal(-1, 1)).toThrow();
    expect(() => lineTotal(100, 1.5)).toThrow();
  });

  it("round-trips to an input value", () => {
    expect(paiseToInput(65000)).toBe("650");
    expect(paiseToInput(65050)).toBe("650.50");
    expect(parseRupeesToPaise(paiseToInput(12345))).toBe(12345);
  });
});
