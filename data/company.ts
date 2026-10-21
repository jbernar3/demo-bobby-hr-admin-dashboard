export const company = {
  name: "Parallax Labs, Inc.",
  shortName: "Parallax Labs",
  stage: "Series A",
  hq: "New York, NY",
  emailDomain: "parallaxlabs.example",
  planYearStart: "2027-01-01",
  renewalDate: "2027-01-01",
  /** Benefits eligibility: full-time (30+ hrs/week), first of the month after hire (or hire date if the 1st). */
  eligibilityRule: "Full-time employees (30+ hrs/week), effective the 1st of the month after hire",
};

export const user = {
  name: "Dana Okafor",
  firstName: "Dana",
  title: "Head of People",
  initials: "DO",
};

export const advisor = {
  name: "Marco Reyes",
  title: "Licensed Benefits Advisor",
  initials: "MR",
  availability: "Available today",
};

export const openEnrollment = {
  planYear: 2027,
  start: "2026-10-26",
  end: "2026-11-13",
  decisionSupportOpened: "2026-10-13",
  renewalsTotal: 1,
  renewalsFinalized: 0,
};

/** Planning to-dos, dated as days before open enrollment opens (the card reads as ~4-5 months out). */
export const planningTodos = [
  { id: "meet-advisor", daysBefore: 120, label: "Meet with Marco, your licensed advisor, to plan 2027", href: "/plan" },
  { id: "review-renewal", daysBefore: 105, label: "Review Meridian's renewal proposal", href: "/plan" },
  { id: "pick-path", daysBefore: 90, label: "Choose a path: renegotiate, level plan, or switch", href: "/plan" },
  { id: "contributions", daysBefore: 70, label: "Set 2027 employer contribution levels", href: "/plan" },
];
