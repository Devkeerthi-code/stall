/** All money is stored and calculated as integer paise. Rupees only exist at the edges (input and display). */

export const MAX_PRICE_PAISE = 10_00_000_00; // ₹10,00,000 per unit is far above any small-shop item

export function assertPaise(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`Invalid paise amount: ${value}`);
  }
  return value;
}

export function lineTotal(unitPaise: number, qty: number): number {
  assertPaise(unitPaise);
  if (!Number.isSafeInteger(qty) || qty <= 0) throw new RangeError(`Invalid quantity: ${qty}`);
  return assertPaise(unitPaise * qty);
}

export function sumPaise(values: readonly number[]): number {
  return assertPaise(values.reduce((total, v) => total + assertPaise(v), 0));
}

/** Indian digit grouping: 1234567 -> "12,34,567". */
function groupIndian(digits: string): string {
  if (digits.length <= 3) return digits;
  const last3 = digits.slice(-3);
  const rest = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${rest},${last3}`;
}

/** 65000 -> "₹650", 65050 -> "₹650.50", 12000000 -> "₹1,20,000". */
export function formatRupees(paise: number): string {
  assertPaise(paise);
  const rupees = Math.floor(paise / 100);
  const rest = paise % 100;
  const whole = groupIndian(String(rupees));
  return rest === 0 ? `₹${whole}` : `₹${whole}.${String(rest).padStart(2, "0")}`;
}

/**
 * Parses what an owner types or pastes: "650", "650.5", "₹1,200", "1200.00", "Rs 99".
 * Returns null for anything that is not a clean non-negative amount with at most 2 decimals.
 */
export function parseRupeesToPaise(input: string): number | null {
  const cleaned = input.trim().replace(/^(₹|rs\.?|inr)\s*/i, "").replace(/,/g, "");
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole = "0", fraction = ""] = cleaned.split(".");
  const paise = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return paise <= MAX_PRICE_PAISE ? paise : null;
}

/** Value for a price <input>: 65050 -> "650.50", 65000 -> "650". */
export function paiseToInput(paise: number): string {
  const rest = paise % 100;
  const rupees = Math.floor(paise / 100);
  return rest === 0 ? String(rupees) : `${rupees}.${String(rest).padStart(2, "0")}`;
}
