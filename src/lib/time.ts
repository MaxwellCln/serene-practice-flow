export const PRACTICE_TZ = "Europe/Dublin";

/** Convert a local wall-clock date+time in the practice timezone into a UTC Date. */
export function practiceTimeToUtc(dateStr: string, timeStr: string): Date {
  const naive = new Date(`${dateStr}T${timeStr}:00Z`);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: PRACTICE_TZ,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(naive)
      .map((p) => [p.type, p.value]),
  ) as Record<string, string>;
  const asUtc = Date.UTC(
    Number(parts["year"]),
    Number(parts["month"]) - 1,
    Number(parts["day"]),
    Number(parts["hour"]) % 24,
    Number(parts["minute"]),
    Number(parts["second"]),
  );
  return new Date(naive.getTime() - (asUtc - naive.getTime()));
}

/** YYYY-MM-DD for a Date, in the practice timezone. */
export function practiceDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PRACTICE_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return parts;
}

export function formatPracticeDate(iso: string | Date): string {
  return new Intl.DateTimeFormat("en-IE", {
    timeZone: PRACTICE_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(iso));
}

export function formatPracticeTime(iso: string | Date): string {
  return new Intl.DateTimeFormat("en-IE", {
    timeZone: PRACTICE_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function formatMoney(cents: number, currency = "EUR"): string {
  if (cents === 0) return "Free";
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}
