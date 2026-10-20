import type { ISODate, OEStatus } from "@/lib/types";

// Decision support opened Oct 13: employees can compare 2027 plans and save elections early.
// Saved elections lock in when the official window opens Oct 26.
// Employees not listed here have not started.
export const oeStatusById: Record<string, OEStatus> = {
  e01: "Complete",
  e02: "Complete",
  e06: "Complete",
  e08: "Complete",
  e10: "Complete",
  e13: "Complete",
  e17: "Complete",
  e22: "Complete",
  e29: "Complete",
  e35: "Complete",
  e42: "Complete",
  e46: "Complete",
  e47: "Complete",
  e03: "In progress",
  e05: "In progress",
  e09: "In progress",
  e12: "In progress",
  e19: "In progress",
  e30: "In progress",
  e37: "In progress",
  e44: "In progress",
  e50: "In progress",
  e21: "Waived",
  e39: "Waived",
};

export interface LifeEvent {
  id: string;
  employeeId: string;
  type: "Birth" | "Marriage" | "Dependent age-out" | "Adoption" | "Divorce";
  eventDate: ISODate;
  windowDays: number;
  status: "Pending" | "Completed";
  completedOn?: ISODate;
  description: string;
  actionId?: string;
}

export const lifeEvents: LifeEvent[] = [
  {
    id: "le-aisha",
    employeeId: "e05",
    type: "Birth",
    eventDate: "2026-10-08",
    windowDays: 30,
    status: "Pending",
    description: "Aisha had a baby, Zayn. Bobby drafted the change from EE+Spouse to Family on medical, dental, and vision, effective Oct 8.",
    actionId: "add-aisha-newborn",
  },
  {
    id: "le-jordan",
    employeeId: "e04",
    type: "Dependent age-out",
    eventDate: "2026-09-12",
    windowDays: 30,
    status: "Pending",
    description: "Daniel Kim turned 26 and aged off Sept 30. Tier should drop to EE+Spouse. Bobby will send the COBRA notice for Daniel with the change.",
    actionId: "downgrade-jordan",
  },
  {
    id: "le-kenji",
    employeeId: "e32",
    type: "Marriage",
    eventDate: "2026-08-15",
    windowDays: 30,
    status: "Completed",
    completedOn: "2026-08-21",
    description: "Kenji married Hana. Added to medical, dental, and vision effective Sept 1. Carriers confirmed.",
  },
  {
    id: "le-greg",
    employeeId: "e33",
    type: "Adoption",
    eventDate: "2026-06-24",
    windowDays: 30,
    status: "Completed",
    completedOn: "2026-06-29",
    description: "Greg added Lily effective July 1. Payroll updated; Meridian tier still pending (see Savings).",
  },
];

export interface NewHire {
  employeeId: string;
  eligibleOn: ISODate;
  electionDeadline: ISODate;
  election: "Enrolled" | "Elected" | "Not started";
  note: string;
}

export const newHires: NewHire[] = [
  {
    employeeId: "e26",
    eligibleOn: "2026-10-01",
    electionDeadline: "2026-10-01",
    election: "Enrolled",
    note: "Enrolled PPO 1500, dental, vision. Missing from the Brightline invoice; Bobby is fixing it.",
  },
  {
    employeeId: "e25",
    eligibleOn: "2026-11-01",
    electionDeadline: "2026-10-30",
    election: "Elected",
    note: "Elected HDHP 3000 + HSA, EE only. Bobby will send to carriers Oct 26.",
  },
  {
    employeeId: "e28",
    eligibleOn: "2026-11-01",
    electionDeadline: "2026-10-30",
    election: "Not started",
    note: "Bobby sent her the decision guide on Oct 14 and will nudge on Oct 22.",
  },
];

export const nudgeMessage = `Hey team: 2027 open enrollment opens Mon, Oct 26 and closes Fri, Nov 13.

You can already compare plans and save your picks in Bobby: it takes about 5 minutes. A few things worth knowing:
• Meridian rates are flat for 2027, and all three medical plans stay the same
• The HDHP comes with an employer HSA seed ($500 / $1,000)
• If you do nothing, your current elections roll over (except FSA, which you have to re-elect)

Questions? Reply here or DM Bobby, and Marco (our licensed advisor) is on call for anything tricky.`;
