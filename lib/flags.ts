import { STORY } from "@/data/employees";
import { lifeEvents, newHires } from "@/data/enrollment";
import { findings } from "@/data/findings";
import { carriers } from "@/data/plans";
import { recentAverage } from "./aca";
import { agedOffBy, coverageEffective, findingImpact } from "./billing";
import { addDays, DEMO_TODAY, fmtShort } from "./dates";
import { money } from "./format";
import { findingStatus } from "./selectors";
import type { DemoState } from "./store";
import type { Employee } from "./types";

export interface Flag {
  id: string;
  text: string;
  detail?: string;
  href?: string;
  urgent?: boolean;
  resolved?: boolean;
}

/** Everything Bobby has noticed about one person, computed from the data. */
export function employeeFlags(emp: Employee, done: DemoState["done"]): Flag[] {
  const flags: Flag[] = [];

  for (const d of emp.dependents) {
    if (d.relationship === "Child" && agedOffBy(d.dob, DEMO_TODAY)) {
      flags.push({
        id: `ageout-${d.name}`,
        text: `Dependent aged out ${fmtShort(`${Number(d.dob.slice(0, 4)) + 26}-${d.dob.slice(5)}`)}`,
        detail: `${d.name} turned 26 and lost eligibility at month end. Tier should drop.`,
        href: "/enrollment",
        urgent: !done["downgrade-jordan"],
        resolved: !!done["downgrade-jordan"],
      });
    }
  }

  for (const f of findings.filter((x) => x.employeeId === emp.id)) {
    const status = findingStatus(f, done);
    if (status === "Recovered") continue;
    const amt = findingImpact(f);
    flags.push({
      id: f.id,
      text: `${f.type} at ${carriers[f.carrierId].shortName}`,
      detail: `${f.type === "Missing from invoice" ? "Coverage gap" : amt < 0 ? `We owe ${money(Math.abs(amt), { cents: true })}` : `${money(amt, { cents: true })} overbilled`} · ${status}`,
      href: `/savings?finding=${f.id}`,
      urgent: status === "Open" && amt > 1000,
      resolved: status !== "Open",
    });
  }

  for (const le of lifeEvents.filter((l) => l.employeeId === emp.id && l.status === "Pending" && l.type !== "Dependent age-out")) {
    flags.push({
      id: le.id,
      text: `${le.type} on ${fmtShort(le.eventDate)}: window closes ${fmtShort(addDays(le.eventDate, le.windowDays))}`,
      detail: le.description,
      href: "/enrollment",
      urgent: addDays(le.eventDate, le.windowDays) <= addDays(DEMO_TODAY, 30),
      resolved: !!(le.actionId && done[le.actionId]),
    });
  }

  if (emp.id === STORY.priya) {
    flags.push({
      id: "cobra",
      text: "COBRA election notice not sent: due Nov 13",
      detail: "Bobby has a pre-filled notice ready for Keystone Admin.",
      href: "/compliance",
      urgent: !done["cobra-priya"],
      resolved: !!done["cobra-priya"],
    });
  }

  if (emp.state === "OR") {
    flags.push({
      id: "oregon",
      text: "First employee in Oregon",
      detail: "Triggers Paid Leave Oregon, withholding, and UI registrations.",
      href: "/growth",
      resolved: !!done["oregon-registrations"],
    });
  }

  if (emp.type === "Part-time" && recentAverage(emp) >= 30) {
    flags.push({
      id: "aca-hours",
      text: `Averaging ${recentAverage(emp).toFixed(1)} hrs/week`,
      detail: "May count as full-time for ACA purposes if the trend holds.",
      href: "/growth",
    });
  }

  const nh = newHires.find((n) => n.employeeId === emp.id);
  if (nh && coverageEffective(emp) > DEMO_TODAY) {
    flags.push({ id: "newhire", text: `Eligible ${fmtShort(nh.eligibleOn)}: ${nh.election.toLowerCase()}`, detail: nh.note, href: "/enrollment" });
  }

  return flags;
}

export function hasOpenFlags(emp: Employee, done: DemoState["done"]) {
  return employeeFlags(emp, done).some((f) => !f.resolved);
}
