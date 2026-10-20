import { actions } from "@/data/actions";
import { cases } from "@/data/cases";
import { complianceItems } from "@/data/compliance";
import { employees, employeeById, fullName } from "@/data/employees";
import { lifeEvents, newHires } from "@/data/enrollment";
import { findings } from "@/data/findings";
import { openEnrollment } from "@/data/company";
import { findingImpact } from "./billing";
import { addDays, DEMO_TODAY } from "./dates";
import type { DemoState } from "./store";
import type { ComplianceItem, ComplianceStatus, Finding, FindingStatus, ISODate } from "./types";

// Derived views that combine static data with the client approval state.

type Done = DemoState["done"];

export function findingStatus(f: Finding, done: Done): FindingStatus {
  return f.actionId && done[f.actionId] && f.statusAfterApproval ? f.statusAfterApproval : f.status;
}

export interface ComplianceView extends ComplianceItem {
  effectiveStatus: ComplianceStatus;
  effectiveNote?: string;
  effectiveWeight: number;
  approvedAt?: string;
}

export function complianceView(item: ComplianceItem, done: Done): ComplianceView {
  const approved = item.actionId ? done[item.actionId] : undefined;
  if (approved) {
    return {
      ...item,
      effectiveStatus: item.statusAfterApproval ?? item.status,
      effectiveNote: item.noteAfterApproval ?? item.note,
      effectiveWeight: item.weightAfterApproval ?? item.scoreWeight,
      approvedAt: approved.at,
    };
  }
  return { ...item, effectiveStatus: item.status, effectiveNote: item.note, effectiveWeight: item.scoreWeight };
}

export function complianceViews(done: Done) {
  return complianceItems.map((c) => complianceView(c, done));
}

/** Eligible employees who would each need an SBC (active full-time). */
export const sbcRecipients = employees.filter((e) => e.status === "Active" && e.type === "Full-time").length;

export function penaltyExposure(item: ComplianceView): number {
  if (!item.penalty || item.effectiveStatus === "Done" || item.effectiveStatus === "Not required") return 0;
  if (item.penalty.unit === "failure") return item.penalty.perUnit * (item.penalty.units ?? sbcRecipients);
  return 0;
}

export function complianceScore(done: Done) {
  const views = complianceViews(done);
  const drags = views.filter((v) => v.effectiveWeight > 0).sort((a, b) => b.effectiveWeight - a.effectiveWeight);
  return { score: 100 - drags.reduce((s, v) => s + v.effectiveWeight, 0), drags };
}

export interface Metrics {
  recoveredYtd: number;
  pendingCredit: number;
  openOverbilled: number;
  openOwed: number;
  openGap: number;
  billingAtRisk: number;
  penaltyAtRisk: number;
  atRisk: number;
  deadlines: Deadline[];
  complianceScore: number;
  openFindings: number;
  todayCount: number;
  pendingApprovals: number;
  openCases: number;
}

export interface Deadline {
  id: string;
  label: string;
  date: ISODate;
  href: string;
}

export function upcomingDeadlines(done: Done, windowDays = 30): Deadline[] {
  const horizon = addDays(DEMO_TODAY, windowDays);
  const list: Deadline[] = [];
  const seenActions = new Set<string>();
  for (const v of complianceViews(done)) {
    if (!v.dueDate || v.effectiveStatus === "Done" || v.effectiveStatus === "Not required") continue;
    if (v.dueDate > horizon) continue;
    // Items filed together count once (e.g. the three Oregon registrations).
    if (v.actionId) {
      if (seenActions.has(v.actionId)) continue;
      seenActions.add(v.actionId);
    }
    const label =
      v.actionId === "oregon-registrations" ? "Oregon registrations" : v.actionId === "oe-packet" ? "SBCs out with OE packet" : v.title;
    list.push({ id: v.id, label, date: v.dueDate, href: "/compliance" });
  }
  for (const le of lifeEvents) {
    if (le.status !== "Pending" || le.type === "Dependent age-out") continue;
    if (le.actionId && done[le.actionId]) continue;
    const date = addDays(le.eventDate, le.windowDays);
    if (date > horizon) continue;
    const emp = employeeById[le.employeeId];
    list.push({ id: le.id, label: `${le.type} enrollment window: ${fullName(emp)}`, date, href: "/enrollment" });
  }
  for (const nh of newHires) {
    if (nh.election !== "Not started" || nh.electionDeadline < DEMO_TODAY || nh.electionDeadline > horizon) continue;
    list.push({
      id: `nh-${nh.employeeId}`,
      label: `New-hire election: ${fullName(employeeById[nh.employeeId])}`,
      date: nh.electionDeadline,
      href: "/enrollment",
    });
  }
  if (openEnrollment.end <= horizon) {
    list.push({ id: "oe-close", label: "Open enrollment closes", date: openEnrollment.end, href: "/enrollment" });
  }
  return list.sort((a, b) => a.date.localeCompare(b.date));
}

export function metrics(done: Done): Metrics {
  let recoveredYtd = 0;
  let pendingCredit = 0;
  let openOverbilled = 0;
  let openOwed = 0;
  let openGap = 0;
  let openFindings = 0;
  for (const f of findings) {
    const status = findingStatus(f, done);
    const amt = findingImpact(f);
    if (status === "Recovered") recoveredYtd += amt;
    else if (status === "Credit requested" || status === "Correction requested") {
      if (amt > 0) pendingCredit += amt;
    } else {
      openFindings += 1;
      if (f.type === "Missing from invoice") openGap += Math.abs(amt);
      else if (amt < 0) openOwed += Math.abs(amt);
      else openOverbilled += amt;
    }
  }
  const views = complianceViews(done);
  const penaltyAtRisk = views.reduce((s, v) => s + penaltyExposure(v), 0);
  const billingAtRisk = openOverbilled + openOwed + openGap;
  const pending = actions.filter((a) => a.urgency !== "later" && !done[a.id]);
  return {
    recoveredYtd,
    pendingCredit,
    openOverbilled,
    openOwed,
    openGap,
    billingAtRisk,
    penaltyAtRisk,
    atRisk: billingAtRisk + penaltyAtRisk,
    deadlines: upcomingDeadlines(done),
    complianceScore: complianceScore(done).score,
    openFindings,
    todayCount: pending.filter((a) => a.urgency === "today").length,
    pendingApprovals: pending.length,
    openCases: cases.filter((c) => c.status !== "Resolved").length,
  };
}

export function statusKind(s: FindingStatus) {
  return s === "Recovered" ? "done" : s === "Open" ? "urgent" : "pending";
}
