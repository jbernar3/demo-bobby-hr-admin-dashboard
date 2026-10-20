import { employees } from "@/data/employees";
import { findings } from "@/data/findings";
import {
  dentalPlan,
  LIFE_RATE_PER_EMPLOYEE,
  medicalContribution,
  medicalPlans,
  visionPlan,
} from "@/data/plans";
import { CURRENT_MONTH, monthEnd, monthRange, monthStart, parts } from "./dates";
import type { CarrierId, Employee, Finding, ISODate, Line, Tier, TieredLine } from "./types";

// Billing engine: what each employee *should* cost (HRIS), what payroll deducts for,
// and what each carrier actually invoiced. Every dollar figure on screen comes from here.

export const LINE_CARRIER: Record<Line, CarrierId> = {
  medical: "meridian",
  dental: "brightline",
  vision: "clearview",
  life: "anchor",
};

export const BILLING_MONTHS = monthRange("2026-01", CURRENT_MONTH);

/** Coverage starts on the hire date if it's the 1st, otherwise the 1st of the following month. */
export function coverageEffective(emp: Employee): ISODate {
  const { y, m, d } = parts(emp.hireDate);
  if (d === 1) return emp.hireDate;
  return m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
}

/** Coverage runs through the end of the month of termination. */
export function coveredInMonth(emp: Employee, ym: string): boolean {
  const start = monthStart(ym);
  if (coverageEffective(emp) > start) return false;
  if (emp.terminationDate && emp.terminationDate < start) return false;
  return true;
}

/** The tier the employee elected for a month (what payroll deducts for). */
export function enrolledTier(emp: Employee, line: TieredLine, ym: string): Tier | null {
  if (!coveredInMonth(emp, ym)) return null;
  const start = monthStart(ym);
  const prior = emp.priorCoverage?.find((p) => p.until >= start && p[line]);
  if (prior) return prior[line] ?? null;
  return line === "medical" ? (emp.coverage.medical?.tier ?? null) : emp.coverage[line];
}

/**
 * The tier HRIS eligibility data supports. Children age off at the end of the month they turn 26;
 * if every covered child has aged off, the tier drops (FAM → ES, EC → EE).
 */
export function hrisTier(emp: Employee, line: TieredLine, ym: string): Tier | null {
  const tier = enrolledTier(emp, line, ym);
  if (!tier || (tier !== "FAM" && tier !== "EC")) return tier;
  const children = emp.dependents.filter((d) => d.relationship === "Child");
  if (children.length === 0) return tier;
  const start = monthStart(ym);
  const eligible = children.filter((c) => !agedOffBy(c.dob, start));
  if (eligible.length > 0) return tier;
  return tier === "FAM" ? "ES" : "EE";
}

/** True if a child who turned 26 had aged off coverage by `date` (end of birthday month). */
export function agedOffBy(dob: ISODate, date: ISODate): boolean {
  const { y, m } = parts(dob);
  return date > monthEnd(`${y + 26}-${String(m).padStart(2, "0")}`);
}

export function findingFor(emp: Employee, line: TieredLine, ym: string): Finding | undefined {
  return findings.find((f) => f.employeeId === emp.id && f.line === line && f.months.includes(ym));
}

/** What the carrier billed for this employee/month. */
export function invoiceTier(emp: Employee, line: TieredLine, ym: string): Tier | null {
  const f = findingFor(emp, line, ym);
  if (f) return f.billedTier;
  return enrolledTier(emp, line, ym);
}

export function rateFor(emp: Employee, line: TieredLine, tier: Tier | null): number {
  if (!tier) return 0;
  if (line === "medical") {
    const planId = emp.coverage.medical?.plan;
    const plan = medicalPlans.find((p) => p.id === planId);
    return plan ? plan.rates[tier] : 0;
  }
  if (line === "dental") return dentalPlan.rates[tier];
  return visionPlan.rates[tier];
}

export function lifeCovered(emp: Employee, ym: string): boolean {
  return emp.type === "Full-time" && coveredInMonth(emp, ym);
}

export interface SourceTotal {
  lives: number;
  amount: number;
}

export interface CarrierMonth {
  carrierId: CarrierId;
  line: Line;
  month: string;
  hris: SourceTotal;
  payroll: SourceTotal;
  invoice: SourceTotal;
  findings: Finding[];
}

function sumTiered(line: TieredLine, ym: string, pick: (e: Employee) => Tier | null): SourceTotal {
  let lives = 0;
  let amount = 0;
  for (const emp of employees) {
    const tier = pick(emp);
    if (!tier) continue;
    lives += 1;
    amount += rateFor(emp, line, tier);
  }
  return { lives, amount: round2(amount) };
}

export function carrierMonth(line: Line, ym: string): CarrierMonth {
  const carrierId = LINE_CARRIER[line];
  if (line === "life") {
    const lives = employees.filter((e) => lifeCovered(e, ym)).length;
    const total = { lives, amount: round2(lives * LIFE_RATE_PER_EMPLOYEE) };
    return { carrierId, line, month: ym, hris: total, payroll: total, invoice: total, findings: [] };
  }
  return {
    carrierId,
    line,
    month: ym,
    hris: sumTiered(line, ym, (e) => hrisTier(e, line, ym)),
    payroll: sumTiered(line, ym, (e) => enrolledTier(e, line, ym)),
    invoice: sumTiered(line, ym, (e) => invoiceTier(e, line, ym)),
    findings: findings.filter((f) => f.line === line && f.months.includes(ym)),
  };
}

export const LINES: Line[] = ["medical", "dental", "vision", "life"];

/** Total invoiced premium across all lines for a month. */
export function monthlyPremium(ym: string): number {
  return round2(LINES.reduce((s, l) => s + carrierMonth(l, ym).invoice.amount, 0));
}

/** Expected (correct) premium for a month, by line. */
export function expectedByLine(ym: string): Record<Line, number> {
  return {
    medical: carrierMonth("medical", ym).hris.amount,
    dental: carrierMonth("dental", ym).hris.amount,
    vision: carrierMonth("vision", ym).hris.amount,
    life: carrierMonth("life", ym).hris.amount,
  };
}

/** Dollar impact of a finding: positive = we were overbilled, negative = underbilled. */
export function findingImpact(f: Finding): number {
  const emp = employees.find((e) => e.id === f.employeeId);
  if (!emp) return 0;
  let total = 0;
  for (const ym of f.months) {
    total += rateFor(emp, f.line, f.billedTier) - rateFor(emp, f.line, hrisTier(emp, f.line, ym));
  }
  return round2(total);
}

/** Employer/employee split of a medical premium for a tier. */
export function medicalSplit(planRates: Record<Tier, number>, tier: Tier) {
  const ee = planRates.EE;
  const total = planRates[tier];
  const employer = ee * medicalContribution.employeeOnlyPct + (total - ee) * medicalContribution.dependentPct;
  return { total, employer: round2(employer), employee: round2(total - employer) };
}

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}
