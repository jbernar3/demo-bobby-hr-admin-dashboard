import { acaProjection, ALE_THRESHOLD } from "@/lib/aca";
import { findingImpact, rateFor } from "@/lib/billing";
import { daysFromToday, fmtShort, monthLabel } from "@/lib/dates";
import { money, num, plural } from "@/lib/format";
import { levelFundedSummary } from "@/lib/levelFunded";
import { complianceViews, metrics } from "@/lib/selectors";
import type { DemoState } from "@/lib/store";
import type { AnswerBlock } from "@/lib/types";
import { actions } from "./actions";
import { advisor, openEnrollment } from "./company";
import { employeeById, employees, fullName, STORY } from "./employees";
import { findings } from "./findings";
import { carriers, levelFunded, medicalContribution, TIER_LABEL } from "./plans";

// Scripted Ask Bobby answers. Every number is computed from the data modules.

export interface AskQuestion {
  id: string;
  question: string;
  /** Each inner array is a group of synonyms; matching any term in a group scores a point. */
  keywords: string[][];
}

export const ASK_QUESTIONS: AskQuestion[] = [
  {
    id: "week",
    question: "What do I need to do this week?",
    keywords: [["this week", "today", "to do", "todo", "need to do", "priorit", "urgent", "on my plate", "what should i", "deadline"], ["week", "do", "need", "deadline"]],
  },
  {
    id: "marcus",
    question: "Why are we paying for Marcus Bell?",
    keywords: [["marcus", "bell"], ["paying", "billed", "charged", "ghost", "still"]],
  },
  {
    id: "ale",
    question: "Are we going to become an ALE next year?",
    keywords: [["ale", "aca", "large employer", "employer mandate", "1095", "applicable"], ["next year", "2027", "become", "50", "fte"]],
  },
  {
    id: "oregon",
    question: "What do I need to do now that we hired someone in Oregon?",
    keywords: [["oregon", "portland", "elena", "new state"], ["hire", "hired", "register", "registration", "do"]],
  },
  {
    id: "levelfunded",
    question: "How is our level-funded plan tracking?",
    keywords: [["level-funded", "level funded", "claims", "surplus", "stop-loss", "stop loss", "funded"], ["tracking", "plan", "doing", "how"]],
  },
  {
    id: "oe",
    question: "Draft the open enrollment announcement for Slack.",
    keywords: [["announcement", "announce", "slack", "draft", "message"], ["open enrollment", "oe", "enrollment"]],
  },
];

export function matchQuestion(text: string): string | null {
  const q = ` ${text.toLowerCase().replace(/[^\w\s-]/g, " ")} `;
  let best: { id: string; score: number } | null = null;
  for (const item of ASK_QUESTIONS) {
    let score = 0;
    item.keywords.forEach((group, gi) => {
      if (group.some((k) => (k.length <= 3 ? q.includes(` ${k} `) : q.includes(k)))) score += gi === 0 ? 2 : 1;
    });
    if (score >= 2 && (!best || score > best.score)) best = { id: item.id, score };
  }
  return best?.id ?? null;
}

export const FALLBACK_TEXT = `In this demo I can answer the questions below. For anything else, ${advisor.name.split(" ")[0]} (your licensed advisor) would pick this up within one business day.`;

type Done = DemoState["done"];

export function answerFor(id: string, done: Done): AnswerBlock[] {
  switch (id) {
    case "week":
      return weekAnswer(done);
    case "marcus":
      return marcusAnswer();
    case "ale":
      return aleAnswer();
    case "oregon":
      return oregonAnswer(done);
    case "levelfunded":
      return levelFundedAnswer();
    case "oe":
      return oeAnswer();
    default:
      return [{ type: "text", text: FALLBACK_TEXT }];
  }
}

function weekAnswer(done: Done): AnswerBlock[] {
  const m = metrics(done);
  const pending = actions.filter((a) => a.urgency !== "later" && !done[a.id]);
  if (pending.length === 0) {
    return [
      { type: "text", text: "Nothing needs you this week. You've approved everything Bobby proposed. I'll keep watching invoices, deadlines, and thresholds overnight." },
      { type: "action", label: "Back to Today", href: "/" },
    ];
  }
  const rows = pending.map((a) => [
    a.title,
    a.dueDate ? `${fmtShort(a.dueDate)}${daysFromToday(a.dueDate) < 0 ? " (overdue)" : ""}` : a.amount ? money(a.amount) : "—",
  ]);
  return [
    {
      type: "text",
      text: `${plural(pending.length, "thing")} need${pending.length === 1 ? "s" : ""} your approval, and ${m.todayCount} of them should happen today. Everything is drafted, so each one is a single click.`,
    },
    { type: "table", columns: ["Approval", "Due / impact"], rows },
    {
      type: "text",
      text: `Also on deck: open enrollment opens ${fmtShort(openEnrollment.start)}. I'm handling everything else, including ${plural(m.openCases, "carrier case")} and next month's reconciliation.`,
    },
    { type: "action", label: "Go to approvals", href: "/" },
  ];
}

function marcusAnswer(): AnswerBlock[] {
  const marcus = employeeById[STORY.marcus];
  const fs = findings.filter((f) => f.employeeId === STORY.marcus);
  const rows = fs.flatMap((f) =>
    f.months.map((ym) => [
      monthLabel(ym),
      carriers[f.carrierId].shortName,
      f.billedTier ? TIER_LABEL[f.billedTier] : "—",
      money(rateFor(marcus, f.line, f.billedTier), { cents: true }),
    ]),
  );
  const total = fs.reduce((s, f) => s + findingImpact(f), 0);
  return [
    {
      type: "text",
      text: `${fullName(marcus)} left on Aug 28, so his coverage ended Aug 31. Payroll stopped his deductions, but Meridian and Brightline never processed the termination. They billed EE+Spouse for September and October.`,
    },
    { type: "table", columns: ["Month", "Carrier", "Billed", "Amount"], rows },
    { type: "stat", value: money(total, { cents: true }), label: "overbilled across 2 carriers" },
    { type: "text", text: "I've drafted credit requests to both carriers with the termination date and payroll proof attached." },
    { type: "action", label: "Approve: send credit request to Meridian", actionId: "credit-marcus-meridian" },
  ];
}

function aleAnswer(): AnswerBlock[] {
  const p = acaProjection(0);
  const actual = p.months.filter((m) => !m.projected);
  const avgFt = actual.reduce((s, m) => s + m.fullTime + m.partTimeAsFullTime, 0) / actual.length;
  const avgFte = actual.reduce((s, m) => s + m.fte, 0) / actual.length;
  return [
    {
      type: "text",
      text: `Not yet, but it's close. Your 2026 average is projected at ${num(p.average, 2)} full-time equivalents. The IRS rounds that down to ${p.counted}, which is under ${ALE_THRESHOLD}, so you would not be an ALE in 2027.`,
    },
    { type: "stat", value: num(p.average, 2), label: "projected 2026 average FTEs" },
    {
      type: "table",
      columns: ["Component (Jan–Oct avg)", "Value"],
      rows: [
        ["Full-time employees (30+ hrs/wk)", num(avgFt, 1)],
        ["Part-time FTEs (hours ÷ 120)", num(avgFte, 2)],
        ["Hires needed to cross 50", `${p.hiresToCross} full-time before Dec 31`],
      ],
    },
    {
      type: "text",
      text: `If you hire ${p.hiresToCross} or more full-time people before year-end, you cross 50. In 2027 you'd then have to offer affordable coverage to 95% of full-timers and file 1095-C forms. Watch Sam Whitaker too: his hours are trending above 30/week.`,
    },
    { type: "action", label: "Open the ACA projection", href: "/growth" },
  ];
}

function oregonAnswer(done: Done): AnswerBlock[] {
  const elena = employeeById[STORY.elena];
  const filed = !!done["oregon-registrations"];
  const or = complianceViews(done).filter((c) => c.state === "OR");
  return [
    {
      type: "text",
      text: `${fullName(elena)} started Oct 1 in ${elena.city}, your first Oregon employee. That creates three state registrations, and payroll ran on Oct 15, so they're already late.`,
    },
    {
      type: "table",
      columns: ["Registration", "Status", "Owner"],
      rows: or.map((c) => [c.title, c.effectiveStatus === "Done" ? "Filed" : c.effectiveStatus, c.owner]),
    },
    {
      type: "text",
      text: "I also checked benefits. Your Meridian, Brightline, and ClearView plans all have national networks that cover Oregon, so no plan changes are needed. One catch: Elena's dental is being deducted, but Brightline doesn't have her yet. I'm fixing that in Savings.",
    },
    filed
      ? { type: "action", label: "Registrations filed. View Growth Alerts", href: "/growth" }
      : { type: "action", label: "Approve: Bobby files registrations", actionId: "oregon-registrations" },
  ];
}

function levelFundedAnswer(): AnswerBlock[] {
  const s = levelFundedSummary();
  return [
    {
      type: "text",
      text: `Tracking well. Through September, claims have used ${Math.round(s.lossRatio * 100)}% of the claims fund. One month (May) ran hot, but stop-loss caps any single claimant at the ${money(levelFunded.specificDeductible)} specific deductible.`,
    },
    {
      type: "table",
      columns: ["Jan–Sep 2026", "Amount"],
      rows: [
        ["Claims fund", money(s.ytdFund)],
        ["Paid claims", money(s.ytdClaims)],
        ["Surplus to date", money(s.ytdSurplus)],
      ],
    },
    { type: "stat", value: `${money(s.low)}–${money(s.high)}`, label: "projected year-end surplus (80% range)" },
    {
      type: "text",
      text: `Meridian returns ${Math.round(levelFunded.surplusRefundPct * 100)}% of the surplus after run-out, roughly ${money(s.refundEstimate)}. ${plural(s.flaggedCount, "claimant")} is over 50% of the specific deductible. That's de-identified; I never see or show names.`,
    },
    { type: "action", label: "Open Plan & Costs", href: "/plan" },
  ];
}

export function oeAnnouncement() {
  const eligible = employees.filter((e) => e.status === "Active" && e.type === "Full-time").length;
  return `*2027 Open Enrollment: ${fmtShort(openEnrollment.start)} – ${fmtShort(openEnrollment.end)}*

Hi team! Open enrollment for 2027 benefits runs Mon, ${fmtShort(openEnrollment.start)} through Fri, ${fmtShort(openEnrollment.end)}.

*What's new*
• Same three Meridian medical plans: PPO 500, PPO 1500, HDHP 3000 + HSA
• Parallax still covers ${Math.round(medicalContribution.employeeOnlyPct * 100)}% of employee-only premiums and ${Math.round(medicalContribution.dependentPct * 100)}% for dependents
• HSA seed stays at $500 (you) / $1,000 (with dependents)

*What you need to do*
1. Open Bobby and review your options (about 5 minutes)
2. Re-elect your FSA if you want one, because it doesn't roll over
3. Add or remove dependents if anything changed this year

Questions? DM Bobby anytime, or book 15 minutes with ${advisor.name}, our licensed benefits advisor.

_This message goes to all ${eligible} benefits-eligible employees._`;
}

function oeAnswer(): AnswerBlock[] {
  return [
    { type: "text", text: "Here's a draft for #general. It's friendly, short, and has the dates up top:" },
    { type: "text", text: oeAnnouncement() },
    { type: "action", label: "Approve & post to #general", actionId: "oe-announcement" },
  ];
}
