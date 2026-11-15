import { describe, expect, it } from "vitest";
import type { OrderStatus } from "@/generated/prisma/enums";
import { allowedNext, canTransition, isFinal, stockEffect } from "@/lib/order-status";

const ALL: OrderStatus[] = ["NEW", "CONFIRMED", "READY", "DELIVERED", "CANCELLED"];

describe("order status transitions", () => {
  it("moves forward, allows skipping ahead, never backwards", () => {
    expect(canTransition("NEW", "CONFIRMED")).toBe(true);
    expect(canTransition("NEW", "DELIVERED")).toBe(true);
    expect(canTransition("CONFIRMED", "READY")).toBe(true);
    expect(canTransition("READY", "DELIVERED")).toBe(true);
    expect(canTransition("READY", "CONFIRMED")).toBe(false);
    expect(canTransition("CONFIRMED", "NEW")).toBe(false);
  });

  it("can cancel anything unfinished", () => {
    for (const s of ["NEW", "CONFIRMED", "READY"] as const) expect(canTransition(s, "CANCELLED")).toBe(true);
  });

  it("treats delivered and cancelled as final", () => {
    for (const to of ALL) {
      expect(canTransition("DELIVERED", to)).toBe(false);
      expect(canTransition("CANCELLED", to)).toBe(false);
    }
    expect(isFinal("DELIVERED")).toBe(true);
    expect(isFinal("NEW")).toBe(false);
    expect(allowedNext("CANCELLED")).toEqual([]);
  });

  it("takes stock on acceptance and gives it back on cancellation", () => {
    expect(stockEffect("NEW", "CONFIRMED", false)).toBe("take");
    expect(stockEffect("NEW", "DELIVERED", false)).toBe("take");
    expect(stockEffect("NEW", "CANCELLED", false)).toBe("none");
    expect(stockEffect("CONFIRMED", "READY", true)).toBe("none");
    expect(stockEffect("READY", "CANCELLED", true)).toBe("return");
  });
});
