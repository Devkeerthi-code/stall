import { describe, expect, it } from "vitest";
import { AA, contrast, PAPER_DARK, PAPER_LIGHT, shopPalette } from "@/lib/colour";
import { DEFAULT_HOURS, formatTime, openState, type WeekHours } from "@/lib/hours";

// 2026-11-16 is a Monday. 04:30 UTC = 10:00 IST.
const at = (iso: string) => new Date(iso);

describe("opening hours (India time)", () => {
  it("is open inside hours and says when it closes", () => {
    expect(openState(DEFAULT_HOURS, at("2026-11-16T05:00:00Z"))).toEqual({ isOpen: true, closesAt: "20:00" });
  });

  it("says when it opens later today, or on the next open day", () => {
    expect(openState(DEFAULT_HOURS, at("2026-11-16T02:00:00Z"))).toEqual({ isOpen: false, opensAt: "10:00", inDays: 0 });
    // Saturday 21:00 IST, Sunday is closed, so Monday.
    expect(openState(DEFAULT_HOURS, at("2026-11-21T15:30:00Z"))).toEqual({ isOpen: false, opensAt: "10:00", inDays: 2 });
  });

  it("handles hours past midnight", () => {
    const night: WeekHours = Array.from({ length: 7 }, () => ({ closed: false, open: "18:00", close: "02:00" }));
    expect(openState(night, at("2026-11-16T19:30:00Z")).isOpen).toBe(true); // 01:00 IST
    expect(openState(night, at("2026-11-16T21:30:00Z")).isOpen).toBe(false); // 03:00 IST
  });

  it("formats times plainly", () => {
    expect(formatTime("09:30")).toBe("9:30 am");
    expect(formatTime("20:00")).toBe("8 pm");
    expect(formatTime("00:00")).toBe("12 am");
  });
});

describe("shop colour stays readable", () => {
  it.each(["#E07A4F", "#FFE600", "#00FF66", "#2440A8", "#000000", "#FFFFFF", "#9CA3AF"])("%s meets AA everywhere", (hex) => {
    const p = shopPalette(hex);
    expect(contrast(p.sign, p.signInk)).toBeGreaterThanOrEqual(AA);
    expect(contrast(p.paintLight, PAPER_LIGHT)).toBeGreaterThanOrEqual(AA);
    expect(contrast(p.paintDark, PAPER_DARK)).toBeGreaterThanOrEqual(AA);
    expect(contrast(p.paintLight, p.paintInkLight)).toBeGreaterThanOrEqual(AA);
  });
});
