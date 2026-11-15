import { z } from "zod";

export const TIME_ZONE = "Asia/Kolkata";
export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour time like 09:30");

export const dayHoursSchema = z.object({ closed: z.boolean(), open: time, close: time });
export const weekHoursSchema = z.array(dayHoursSchema).length(7);

export type DayHours = z.infer<typeof dayHoursSchema>;
export type WeekHours = z.infer<typeof weekHoursSchema>;

export const DEFAULT_HOURS: WeekHours = Array.from({ length: 7 }, (_, day) => ({
  closed: day === 0,
  open: "10:00",
  close: "20:00",
}));

export function parseHours(value: unknown): WeekHours | null {
  const parsed = weekHoursSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function toMinutes(hhmm: string): number {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Day of week (0 = Sunday) and minutes since midnight in India, whatever the server's timezone. */
export function indiaClock(now: Date): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const day = DAY_NAMES.indexOf(get("weekday") as (typeof DAY_NAMES)[number]);
  return { day, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

export type OpenState =
  | { isOpen: true; closesAt: string }
  | { isOpen: false; opensAt: string; inDays: number }
  | { isOpen: false; opensAt: null; inDays: null };

/** Supports hours that run past midnight (e.g. 18:00–02:00 for a night tiffin service). */
export function openState(hours: WeekHours, now: Date): OpenState {
  const { day, minutes } = indiaClock(now);
  const today = hours[day];
  const yesterday = hours[(day + 6) % 7];

  if (yesterday && !yesterday.closed && toMinutes(yesterday.close) < toMinutes(yesterday.open) && minutes < toMinutes(yesterday.close)) {
    return { isOpen: true, closesAt: yesterday.close };
  }
  if (today && !today.closed) {
    const open = toMinutes(today.open);
    const close = toMinutes(today.close);
    const overnight = close < open;
    if (minutes >= open && (overnight || minutes < close)) return { isOpen: true, closesAt: today.close };
    if (minutes < open) return { isOpen: false, opensAt: today.open, inDays: 0 };
  }
  for (let offset = 1; offset <= 7; offset++) {
    const next = hours[(day + offset) % 7];
    if (next && !next.closed) return { isOpen: false, opensAt: next.open, inDays: offset };
  }
  return { isOpen: false, opensAt: null, inDays: null };
}

/** "09:30" -> "9:30 am", "20:00" -> "8 pm". */
export function formatTime(hhmm: string): string {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  const suffix = h < 12 ? "am" : "pm";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12} ${suffix}` : `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}
