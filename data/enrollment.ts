import type { ISODate, OEStatus } from "@/lib/types";

// Decision support opens Oct 13 and the official window opens Oct 26, so nobody has started yet.
export const oeStatusById: Record<string, OEStatus> = {};

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
    eventDate: "2026-06-08",
    windowDays: 30,
    status: "Pending",
    description: "Aisha had a baby, Zayn. Keel drafted the change from EE+Spouse to Family on medical, dental, and vision, effective Jun 8.",
    actionId: "add-aisha-newborn",
  },
  {
    id: "le-jordan",
    employeeId: "e04",
    type: "Dependent age-out",
    eventDate: "2026-05-12",
    windowDays: 30,
    status: "Pending",
    description: "Daniel Kim turned 26 and aged off May 31. Tier should drop to EE+Spouse. Keel will send the COBRA notice for Daniel with the change.",
    actionId: "downgrade-jordan",
  },
  {
    id: "le-kenji",
    employeeId: "e32",
    type: "Marriage",
    eventDate: "2026-04-15",
    windowDays: 30,
    status: "Completed",
    completedOn: "2026-04-21",
    description: "Kenji married Hana. Added to medical, dental, and vision effective May 1. Carriers confirmed.",
  },
  {
    id: "le-greg",
    employeeId: "e33",
    type: "Adoption",
    eventDate: "2026-02-24",
    windowDays: 30,
    status: "Completed",
    completedOn: "2026-02-28",
    description: "Greg added Lily effective Mar 1. Payroll updated; Meridian tier still pending (see Savings).",
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
    eligibleOn: "2026-06-01",
    electionDeadline: "2026-06-01",
    election: "Enrolled",
    note: "Enrolled PPO 1500, dental, vision. Missing from the Brightline invoice; Keel is fixing it.",
  },
  {
    employeeId: "e25",
    eligibleOn: "2026-07-01",
    electionDeadline: "2026-06-29",
    election: "Elected",
    note: "Elected HDHP 3000 + HSA, EE only. Keel will send to carriers Jun 29.",
  },
  {
    employeeId: "e28",
    eligibleOn: "2026-07-01",
    electionDeadline: "2026-06-29",
    election: "Not started",
    note: "Keel sent her the decision guide on Jun 15 and will nudge on Jun 25.",
  },
];

export const nudgeMessage = `Hey team: 2027 open enrollment opens Mon, Oct 26 and closes Fri, Nov 13.

You can already compare plans and save your picks in Keel: it takes about 5 minutes. A few things worth knowing:
• Plan details and 2027 rates are in the decision guide
• The HDHP comes with an employer HSA seed ($500 / $1,000)
• If you do nothing, your current elections roll over (except FSA, which you have to re-elect)

Questions? Reply here or DM Keel, and Marco (our licensed advisor) is on call for anything tricky.`;
