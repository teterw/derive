/**
 * A "day" in Derive is an Asia/Bangkok calendar day (PROMPT.md §8).
 *
 * It is computed when the attempt row is written and stored on the row. Days
 * are never derived from UTC timestamps at read time - that breaks streaks for
 * anyone practising late at night, which is exactly when people practise.
 */

const TIMEZONE = "Asia/Bangkok";

const formatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** `YYYY-MM-DD` in Asia/Bangkok. */
export function bangkokDay(at: Date = new Date()): string {
  return formatter.format(at);
}

const stampFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/**
 * `YYYY-MM-DD HH:mm` in Asia/Bangkok. Anything with a time on it that a
 * learner reads is in their own timezone, not the server's.
 */
export function bangkokStamp(at: Date): string {
  return stampFormatter.format(at).replace(",", "");
}

export function previousDay(day: string): string {
  const [year, month, date] = day.split("-").map(Number);
  const value = new Date(Date.UTC(year!, month! - 1, date!));
  value.setUTCDate(value.getUTCDate() - 1);
  return value.toISOString().slice(0, 10);
}

export function nextDay(day: string): string {
  const [year, month, date] = day.split("-").map(Number);
  const value = new Date(Date.UTC(year!, month! - 1, date!));
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10);
}

/** Whole days between two `YYYY-MM-DD` strings, later minus earlier. */
export function daysBetween(from: string, to: string): number {
  const parse = (day: string) => {
    const [year, month, date] = day.split("-").map(Number);
    return Date.UTC(year!, month! - 1, date!);
  };
  return Math.round((parse(to) - parse(from)) / 86_400_000);
}

/** The last `count` days ending today, oldest first - the heatmap's spine. */
export function recentDays(count: number, today = bangkokDay()): string[] {
  const days: string[] = [];
  let day = today;
  for (let i = 0; i < count; i++) {
    days.push(day);
    day = previousDay(day);
  }
  return days.reverse();
}
