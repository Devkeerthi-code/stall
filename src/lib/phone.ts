/**
 * Accepts the ways people write Indian mobile numbers ("98765 43210", "+91-98765-43210",
 * "098765 43210", "919876543210") and returns "91XXXXXXXXXX", or null if it isn't a valid
 * Indian mobile number (10 digits starting 6–9).
 */
export function normalizeIndianMobile(input: string): string | null {
  const digits = input.replace(/[\s\-().]/g, "").replace(/^\+/, "");
  if (!/^\d+$/.test(digits)) return null;

  let national: string;
  if (digits.length === 10) national = digits;
  else if (digits.length === 11 && digits.startsWith("0")) national = digits.slice(1);
  else if (digits.length === 12 && digits.startsWith("91")) national = digits.slice(2);
  else if (digits.length === 13 && digits.startsWith("091")) national = digits.slice(3);
  else return null;

  return /^[6-9]\d{9}$/.test(national) ? `91${national}` : null;
}

/** "919876543210" -> "+91 98765 43210" */
export function formatIndianMobile(e164Digits: string): string {
  const n = e164Digits.slice(2);
  return `+91 ${n.slice(0, 5)} ${n.slice(5)}`;
}
