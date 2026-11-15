import type { OrderStatus } from "@/generated/prisma/enums";

/**
 * Orders move forward only; a shop may skip ahead (a walk-in pickup can go straight to Delivered)
 * and can cancel anything that isn't finished. Delivered and Cancelled are final.
 */
const NEXT: Record<OrderStatus, readonly OrderStatus[]> = {
  NEW: ["CONFIRMED", "READY", "DELIVERED", "CANCELLED"],
  CONFIRMED: ["READY", "DELIVERED", "CANCELLED"],
  READY: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

export const STATUS_LABEL: Record<OrderStatus, string> = {
  NEW: "New",
  CONFIRMED: "Confirmed",
  READY: "Ready",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export function allowedNext(from: OrderStatus): readonly OrderStatus[] {
  return NEXT[from];
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return NEXT[from].includes(to);
}

export function isFinal(status: OrderStatus): boolean {
  return NEXT[status].length === 0;
}

/**
 * Tracked stock is taken when the shop accepts the order (leaves NEW for anything but Cancelled)
 * and given back if an accepted order is cancelled.
 */
export function stockEffect(from: OrderStatus, to: OrderStatus, stockApplied: boolean): "take" | "return" | "none" {
  if (!stockApplied && from === "NEW" && to !== "CANCELLED") return "take";
  if (stockApplied && to === "CANCELLED") return "return";
  return "none";
}
