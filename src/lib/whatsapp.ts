import { formatRupees } from "@/lib/money";

export type MessageLine = { name: string; variant: string; qty: number; unitPaise: number; linePaise: number };

export type OrderMessageInput = {
  shopName: string;
  lines: readonly MessageLine[];
  totalPaise: number;
  customerName: string;
  fulfilment: "PICKUP" | "DELIVERY";
  address?: string | null;
  note?: string | null;
  code: string;
  statusUrl: string;
};

/** Long links get cut off by some Android browsers and WhatsApp itself; stay well under. */
export const MAX_WA_URL_LENGTH = 3800;

/** One line, no control characters, no runs of spaces. Keeps text from breaking the message layout. */
export function clean(text: string): string {
  return text.replace(/[\u0000-\u001f\u007f\u200b-\u200f\u2028\u2029]/g, " ").replace(/\s+/g, " ").trim();
}

function itemLine(line: MessageLine, index: number, compact: boolean): string {
  const variant = clean(line.variant);
  const name = clean(line.name) + (variant ? ` (${variant})` : "");
  return compact
    ? `${index + 1}. ${name} x ${line.qty}`
    : `${index + 1}. ${name} x ${line.qty} = ${formatRupees(line.linePaise)}`;
}

function compose(input: OrderMessageInput, itemLines: string[]): string {
  const parts = [
    `Hi ${clean(input.shopName)}, I'd like to order:`,
    "",
    ...itemLines,
    "",
    `*Total: ${formatRupees(input.totalPaise)}*`,
    `Name: ${clean(input.customerName)}`,
    input.fulfilment === "DELIVERY" ? `Delivery to: ${clean(input.address ?? "") || "-"}` : "Pickup from the shop",
  ];
  const note = clean(input.note ?? "");
  if (note) parts.push(`Note: ${note}`);
  parts.push("", `Order code: ${input.code}`, `Track: ${input.statusUrl}`);
  return parts.join("\n");
}

export function waUrl(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Builds the message the customer sends. If the cart is too long for a wa.me link it first drops
 * per-line prices, then lists only the first items and points to the tracking page for the rest
 * (the full order is saved on our side either way).
 */
export function buildOrderMessage(input: OrderMessageInput, phone: string): { message: string; url: string; truncated: boolean } {
  const full = compose(input, input.lines.map((l, i) => itemLine(l, i, false)));
  if (waUrl(phone, full).length <= MAX_WA_URL_LENGTH) return { message: full, url: waUrl(phone, full), truncated: false };

  const compact = compose(input, input.lines.map((l, i) => itemLine(l, i, true)));
  if (waUrl(phone, compact).length <= MAX_WA_URL_LENGTH) return { message: compact, url: waUrl(phone, compact), truncated: false };

  for (let keep = input.lines.length - 1; keep >= 1; keep--) {
    const shown = input.lines.slice(0, keep).map((l, i) => itemLine(l, i, true));
    shown.push(`...and ${input.lines.length - keep} more items (full list at the Track link)`);
    const message = compose(input, shown);
    if (waUrl(phone, message).length <= MAX_WA_URL_LENGTH) return { message, url: waUrl(phone, message), truncated: true };
  }
  const minimal = compose({ ...input, note: null }, [`${input.lines.length} items (full list at the Track link)`]);
  return { message: minimal, url: waUrl(phone, minimal), truncated: true };
}
