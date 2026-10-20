import type { ISODate } from "./types";

/** The demo is frozen on this day. Never use `new Date()` for "now". */
export const DEMO_TODAY: ISODate = "2026-10-20";

/** When Bobby last reconciled carrier invoices. */
export const LAST_RECONCILIATION = { date: "2026-10-19" as ISODate, time: "4:12 AM" };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_MS = 86_400_000;

/** Parse an ISO date as UTC midnight so arithmetic is timezone-independent. */
export function toUTC(iso: ISODate): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function fromUTC(ms: number): ISODate {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(iso: ISODate, days: number): ISODate {
  return fromUTC(toUTC(iso) + days * DAY_MS);
}

/** Whole days from `a` to `b` (positive if b is later). */
export function daysBetween(a: ISODate, b: ISODate): number {
  return Math.round((toUTC(b) - toUTC(a)) / DAY_MS);
}

/** Days from DEMO_TODAY until `iso` (negative = past). */
export function daysFromToday(iso: ISODate): number {
  return daysBetween(DEMO_TODAY, iso);
}

export function parts(iso: ISODate) {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
}

/** "Oct 20" */
export function fmtShort(iso: ISODate): string {
  const { m, d } = parts(iso);
  return `${MONTHS[m - 1]} ${d}`;
}

/** "Oct 20, 2026" */
export function fmtDate(iso: ISODate): string {
  const { y, m, d } = parts(iso);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/** "Tue, Oct 20, 2026" */
export function fmtLong(iso: ISODate): string {
  const wd = WEEKDAYS[new Date(toUTC(iso)).getUTCDay()];
  return `${wd}, ${fmtDate(iso)}`;
}

/** "Tuesday" style weekday */
export function weekday(iso: ISODate): string {
  return WEEKDAYS[new Date(toUTC(iso)).getUTCDay()];
}

/** "2026-09" -> "Sep" */
export function monthLabel(ym: string): string {
  return MONTHS[Number(ym.slice(5, 7)) - 1];
}

/** "2026-09" -> "September 2026" */
export function monthLabelLong(ym: string): string {
  return `${MONTHS_LONG[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;
}

export function monthName(index: number): string {
  return MONTHS[index];
}

/** "due in 3 days" / "due today" / "overdue by 2 days" */
export function relativeDue(iso: ISODate): string {
  const n = daysFromToday(iso);
  if (n === 0) return "due today";
  if (n === 1) return "due tomorrow";
  if (n > 0) return `due in ${n} days`;
  if (n === -1) return "overdue by 1 day";
  return `overdue by ${-n} days`;
}

/** "in 6 days" / "today" / "2 days ago" */
export function relative(iso: ISODate): string {
  const n = daysFromToday(iso);
  if (n === 0) return "today";
  if (n === 1) return "tomorrow";
  if (n === -1) return "yesterday";
  return n > 0 ? `in ${n} days` : `${-n} days ago`;
}

/** First day of the month, "YYYY-MM-01". */
export function monthStart(ym: string): ISODate {
  return `${ym}-01`;
}

export function monthEnd(ym: string): ISODate {
  const { y, m } = parts(`${ym}-01`);
  return fromUTC(Date.UTC(y, m, 0));
}

/** Year-months from start to end inclusive, e.g. ("2026-01","2026-03") -> [Jan, Feb, Mar]. */
export function monthRange(start: string, end: string): string[] {
  const out: string[] = [];
  let [y, m] = start.split("-").map(Number);
  const [ey, em] = end.split("-").map(Number);
  while (y < ey || (y === ey && m <= em)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

/** Age in whole years on a given date. */
export function ageOn(dob: ISODate, on: ISODate): number {
  const a = parts(dob);
  const b = parts(on);
  let age = b.y - a.y;
  if (b.m < a.m || (b.m === a.m && b.d < a.d)) age -= 1;
  return age;
}

export const CURRENT_MONTH = DEMO_TODAY.slice(0, 7);
