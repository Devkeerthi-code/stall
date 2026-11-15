/** WCAG contrast helpers used to keep each shop's chosen colour readable. */

export const PAPER_LIGHT = "#F6F1E7";
export const PAPER_DARK = "#15130F";
export const INK = "#1C1A17";
export const AA = 4.5;

export const SHOP_COLOUR_PRESETS = [
  "#E07A4F", "#C2410C", "#B91C1C", "#BE185D", "#7C3AED", "#2440A8",
  "#0E7490", "#2F855A", "#A16207", "#57534E",
] as const;

type Rgb = [number, number, number];

export function isHex(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

function hexToRgb(hex: string): Rgb {
  const h = hex.slice(1);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb;
}

function rgbToHex(rgb: Rgb): string {
  return `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as Rgb;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function rgbToHsl([r0, g0, b0]: Rgb): Rgb {
  const r = r0 / 255, g = g0 / 255, b = b0 / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h /= 6;
  return [h, s, l];
}

function hueToChannel(p: number, q: number, t0: number): number {
  let t = t0;
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

function hslToRgb([h, s, l]: Rgb): Rgb {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [hueToChannel(p, q, h + 1 / 3) * 255, hueToChannel(p, q, h) * 255, hueToChannel(p, q, h - 1 / 3) * 255];
}

/** Moves lightness (keeping hue) just far enough for `hex` to reach `target` contrast on `bg`. */
export function fitContrast(hex: string, bg: string, target = AA): string {
  const start = hex.toUpperCase();
  if (contrast(start, bg) >= target) return start;
  const hsl = rgbToHsl(hexToRgb(start));
  const dir = luminance(bg) > 0.4 ? -1 : 1;
  for (let i = 1; i <= 100; i++) {
    const l = Math.min(1, Math.max(0, hsl[2] + dir * i * 0.01));
    const out = rgbToHex(hslToRgb([hsl[0], hsl[1], l]));
    if (contrast(out, bg) >= target) return out;
  }
  return dir < 0 ? "#000000" : "#FFFFFF";
}

export type ShopPalette = {
  /** Signboard background: the owner's colour as chosen. */
  sign: string;
  /** Text on the signboard: ink or paper, whichever reads better; the board is nudged if neither reaches AA. */
  signInk: string;
  /** Buttons/chips on light paper. */
  paintLight: string;
  /** Buttons/chips on dark paper. */
  paintDark: string;
  /** Text on paint buttons. */
  paintInkLight: string;
  paintInkDark: string;
};

export function shopPalette(accentHex: string): ShopPalette {
  const base = isHex(accentHex) ? accentHex.toUpperCase() : "#E07A4F";
  const signInk = contrast(base, INK) >= contrast(base, "#FFFFFF") ? INK : "#FFFFFF";
  const sign = fitContrast(base, signInk, AA);
  const paintLight = fitContrast(base, PAPER_LIGHT, AA);
  const paintDark = fitContrast(base, PAPER_DARK, AA);
  const inkOn = (bg: string) => (contrast(bg, "#FFFFFF") >= contrast(bg, INK) ? "#FFFFFF" : INK);
  return { sign, signInk, paintLight, paintDark, paintInkLight: inkOn(paintLight), paintInkDark: inkOn(paintDark) };
}
