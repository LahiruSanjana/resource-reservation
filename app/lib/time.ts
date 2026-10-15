export const TZ = "Asia/Colombo";
const OFFSET = "+05:30";

// "2026-10-15" (today in Sri Lanka)
export function todayStr() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

// Start/end (as UTC Dates) of a Sri Lanka calendar day
export function dayRange(date: string) {
  const start = new Date(`${date}T00:00:00${OFFSET}`);
  return { start, end: new Date(start.getTime() + 24 * 36e5) };
}

// "2026-10-15" + "10:30" (Sri Lanka local) -> UTC Date
export function toUtc(date: string, hhmm: string) {
  return new Date(`${date}T${hhmm}:00${OFFSET}`);
}

export function fmtTime(d: Date | string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date(d));
}

export function fmtDateTime(d: Date | string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ, day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date(d));
}