import { employees } from "@/data/employees";
import { CURRENT_MONTH, monthRange } from "./dates";
import type { Employee } from "./types";

// ACA applicable large employer (ALE) math for the 2026 lookback year.
// Full-time = 130+ hours in a month (~30 hrs/week). Part-time hours convert to
// full-time equivalents at total monthly hours ÷ 120 (each person capped at 120).

export const WEEKS_PER_MONTH = 52 / 12;
export const FT_MONTHLY_HOURS = 130;
export const FTE_DIVISOR = 120;
export const ALE_THRESHOLD = 50;
/** Planned hires are assumed to start Nov 2 as full-time, so they count in Nov and Dec. */
export const PLANNED_HIRE_START = "2026-11";
export const PLANNED_HIRE_MONTHS = 2;

export const ACA_YEAR_MONTHS = monthRange("2026-01", "2026-12");
const ACTUAL_MONTHS = monthRange("2026-01", CURRENT_MONTH);

/** Counted for a month if on payroll on the 15th (a simple mid-month convention). */
export function onPayrollMidMonth(emp: Employee, ym: string): boolean {
  const mid = `${ym}-15`;
  if (emp.hireDate > mid) return false;
  if (emp.terminationDate && emp.terminationDate < mid) return false;
  return true;
}

/** Average weekly hours for a part-timer in a month; future months use the trailing 3-month average. */
export function weeklyHours(emp: Employee, monthIndex: number): number {
  const hours = emp.weeklyHoursByMonth ?? [];
  if (monthIndex < hours.length) return hours[monthIndex];
  const recent = hours.slice(-3);
  return recent.reduce((s, h) => s + h, 0) / Math.max(recent.length, 1);
}

export function monthlyHours(emp: Employee, monthIndex: number): number {
  return weeklyHours(emp, monthIndex) * WEEKS_PER_MONTH;
}

export interface AcaMonth {
  month: string;
  projected: boolean;
  fullTime: number;
  /** Part-timers whose hours crossed 130 that month (counted as full-time). */
  partTimeAsFullTime: number;
  partTimeHours: number;
  fte: number;
  plannedHires: number;
  total: number;
}

export function acaMonths(plannedHires = 0): AcaMonth[] {
  // Future months use today's active roster.
  return ACA_YEAR_MONTHS.map((ym, i) => {
    const projected = !ACTUAL_MONTHS.includes(ym);
    const roster = employees.filter((e) =>
      projected ? e.status === "Active" : onPayrollMidMonth(e, ym),
    );
    let fullTime = 0;
    let partTimeAsFullTime = 0;
    let partTimeHours = 0;
    for (const emp of roster) {
      if (emp.type === "Full-time") {
        fullTime += 1;
        continue;
      }
      const hrs = monthlyHours(emp, i);
      if (hrs >= FT_MONTHLY_HOURS) partTimeAsFullTime += 1;
      else partTimeHours += Math.min(hrs, FTE_DIVISOR);
    }
    const hires = ym >= PLANNED_HIRE_START ? plannedHires : 0;
    const fte = partTimeHours / FTE_DIVISOR;
    return {
      month: ym,
      projected,
      fullTime,
      partTimeAsFullTime,
      partTimeHours,
      fte,
      plannedHires: hires,
      total: fullTime + partTimeAsFullTime + fte + hires,
    };
  });
}

export function acaProjection(plannedHires = 0) {
  const months = acaMonths(plannedHires);
  const average = months.reduce((s, m) => s + m.total, 0) / months.length;
  // The IRS rounds the annual average down to the next whole number.
  const counted = Math.floor(average);
  const isAle = counted >= ALE_THRESHOLD;
  const perHire = PLANNED_HIRE_MONTHS / months.length;
  const hiresToCross = Math.max(0, Math.ceil((ALE_THRESHOLD - average + 1e-9) / perHire));
  return { months, average, counted, isAle, perHire, hiresToCross };
}

/** Part-timer recent average weekly hours over the last three complete months. */
export function recentAverage(emp: Employee, months = 3): number {
  const hrs = emp.weeklyHoursByMonth ?? [];
  // Exclude the current (partial) month.
  const complete = hrs.slice(0, ACTUAL_MONTHS.length - 1).slice(-months);
  return complete.reduce((s, h) => s + h, 0) / Math.max(complete.length, 1);
}
