/**
 * Shared appointment scheduling helpers, used by both the customer booking page
 * and the admin doctor editor so they always agree on how a doctor's weekly
 * availability (free-form time ranges) maps to bookable slots on a date.
 */

/** A free-form availability window, e.g. { start: "09:45", end: "10:50" }. */
export type TimeRange = { start: string; end: string }; // "HH:MM" 24h

/** Weekly availability: weekday number ("0".."6") → ranges open that day. */
export type Availability = Record<string, TimeRange[]>;

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const DEFAULT_SLOT_MINUTES = 30;
export const SLOT_LENGTH_OPTIONS = [10, 15, 20, 30, 45, 60];

/** Used for doctors that have no schedule configured yet. */
const DEFAULT_RANGES: TimeRange[] = [
  { start: "10:00", end: "13:00" },
  { start: "17:00", end: "19:30" },
];

export function todayISO(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

function toMinutes(hhmm: string): number {
  const [h, m] = (hhmm ?? "").split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
  return h * 60 + m;
}

/** 585 → "9:45 AM". */
export function formatTime(minutes: number): string {
  const h24 = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const ap = h24 >= 12 ? "PM" : "AM";
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h}:${String(m).padStart(2, "0")} ${ap}`;
}

export function formatRange(r: TimeRange): string {
  const s = toMinutes(r.start);
  const e = toMinutes(r.end);
  if (Number.isNaN(s) || Number.isNaN(e)) return "";
  return `${formatTime(s)} – ${formatTime(e)}`;
}

/** Generate the discrete start times offered inside one range. */
function slotsFromRange(r: TimeRange, step: number): string[] {
  const start = toMinutes(r.start);
  const end = toMinutes(r.end);
  if (Number.isNaN(start) || Number.isNaN(end) || step <= 0) return [];
  const out: string[] = [];
  for (let t = start; t < end; t += step) out.push(formatTime(t));
  return out;
}

/**
 * Bookable start times a doctor offers on a given calendar date.
 *  • date in `blocked` (a holiday)     → none
 *  • no availability configured at all → sensible default hours
 *  • availability configured           → that weekday's ranges (may be empty)
 */
export function slotsForDate(
  availability: Availability | null | undefined,
  blocked: string[] | null | undefined,
  dateISO: string,
  slotMinutes: number = DEFAULT_SLOT_MINUTES,
): string[] {
  if (!dateISO) return [];
  if ((blocked ?? []).includes(dateISO)) return [];
  const configured = availability && Object.keys(availability).length > 0;
  const weekday = new Date(dateISO + "T00:00:00").getDay();
  const ranges = configured
    ? availability![String(weekday)] ?? []
    : DEFAULT_RANGES;
  const step = slotMinutes > 0 ? slotMinutes : DEFAULT_SLOT_MINUTES;
  // Dedupe in case ranges overlap, keep chronological order.
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of ranges) {
    for (const s of slotsFromRange(r, step)) {
      if (!seen.has(s)) {
        seen.add(s);
        out.push(s);
      }
    }
  }
  return out;
}
