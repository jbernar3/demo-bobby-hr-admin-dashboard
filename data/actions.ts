import { findingImpact } from "@/lib/billing";
import { fmtShort } from "@/lib/dates";
import type { ApprovalAction } from "@/lib/types";
import { complianceItems } from "./compliance";
import { findings } from "./findings";
import { advisor, platform } from "./company";

// Everything Keel proposes and Dana approves. Approval state is client-side only (lib/store.tsx).

const impact = (actionId: string) =>
  findings.filter((f) => f.actionId === actionId).reduce((s, f) => s + findingImpact(f), 0);

const due = (id: string) => complianceItems.find((c) => c.id === id)?.dueDate;

export const actions: ApprovalAction[] = [
  {
    id: "cobra-priya",
    title: "Send Priya Raman's COBRA election notice",
    why: `Her Family coverage ended May 31. The notice must go out within 44 days, and ${platform.name} has it pre-filled for Keystone Admin.`,
    urgency: "today",
    dueDate: due("cobra-priya"),
    href: "/compliance",
    approveLabel: "Approve & send",
    toast: `Done. ${platform.name} sent the COBRA election notice to Priya Raman via Keystone Admin.`,
    feed: "Sent COBRA election notice to Priya Raman via Keystone Admin",
  },
  {
    id: "credit-marcus-meridian",
    title: "Request Meridian credit for Marcus Bell",
    why: "Marcus left Apr 28, but Meridian billed EE+Spouse medical for May and June.",
    urgency: "today",
    amount: impact("credit-marcus-meridian"),
    amountLabel: "overbilled",
    href: "/savings?finding=F-1042",
    approveLabel: "Approve & send",
    toast: `Done. ${platform.name} sent Meridian a credit request for Marcus Bell. Credits usually land on the next invoice.`,
    feed: "Sent credit request to Meridian for Marcus Bell (May–Jun)",
  },
  {
    id: "oregon-registrations",
    title: "Register for Paid Leave Oregon",
    why: `Elena Vasquez is your first Oregon employee. ${platform.name} will also file Oregon withholding and unemployment insurance on the same form.`,
    urgency: "today",
    dueDate: due("or-paid-leave"),
    href: "/growth",
    approveLabel: "Approve & file",
    toast: `Done. ${platform.name} filed Paid Leave Oregon, withholding, and UI registrations. Confirmations usually arrive in 3–5 business days.`,
    feed: "Filed Oregon registrations: Paid Leave Oregon, withholding, UI",
  },
  {
    id: "oe-packet",
    title: "Approve the 2027 open enrollment packet",
    why: `It includes the three Meridian SBCs, which must go out with OE materials. ${platform.name} schedules it for Oct 26.`,
    urgency: "later",
    dueDate: due("sbc"),
    href: "/enrollment",
    toast: "Done. The OE packet with SBCs is scheduled for Mon, Oct 26 at 9:00 AM.",
    feed: "Scheduled 2027 OE packet with SBCs for Oct 26",
  },
  {
    id: "add-aisha-newborn",
    title: "Add Aisha Mohammed's newborn to coverage",
    why: `Zayn was born Jun 8. ${platform.name} drafted the switch from EE+Spouse to Family on medical, dental, and vision.`,
    urgency: "week",
    dueDate: "2026-07-08",
    href: "/enrollment",
    toast: `Done. ${platform.name} submitted Zayn's enrollment to Meridian, Brightline, and ClearView, effective Jun 8.`,
    feed: "Added Zayn Mohammed to Family coverage, effective Jun 8",
  },
  {
    id: "downgrade-jordan",
    title: "Downgrade Jordan Kim to EE+Spouse",
    why: "Daniel Kim turned 26 on May 12 and aged off May 31. June was billed at Family on three lines.",
    urgency: "week",
    amount: impact("downgrade-jordan"),
    amountLabel: "per month",
    href: "/employees?id=e04",
    toast: `Done. ${platform.name} changed Jordan Kim to EE+Spouse and requested a June credit.`,
    feed: "Changed Jordan Kim to EE+Spouse; requested Jun credit",
  },
  // Not on the Today list by default, but reachable from Savings / Growth / Compliance.
  {
    id: "credit-marcus-brightline",
    title: "Request Brightline credit for Marcus Bell",
    why: "Brightline billed EE+Spouse dental after Marcus's coverage ended.",
    urgency: "later",
    amount: impact("credit-marcus-brightline"),
    amountLabel: "overbilled",
    href: "/savings?finding=F-1043",
    toast: `Done. ${platform.name} sent Brightline a credit request for Marcus Bell.`,
    feed: "Sent credit request to Brightline for Marcus Bell (May–Jun)",
  },
  {
    id: "add-elena-brightline",
    title: "Add Elena Vasquez to the Brightline invoice",
    why: "Payroll is deducting her dental, but Brightline doesn't have her. A claim could be denied.",
    urgency: "later",
    amount: Math.abs(impact("add-elena-brightline")),
    amountLabel: "per month",
    href: "/savings?finding=F-1053",
    toast: `Done. ${platform.name} sent Brightline Elena's enrollment, retro to Jun 1.`,
    feed: "Sent Elena Vasquez's dental enrollment to Brightline (retro Jun 1)",
  },
  {
    id: "fix-greg-meridian",
    title: "Correct Greg Novak's tier with Meridian",
    why: "Meridian bills EE-only, but Greg added Lily Mar 1. We owe the difference, so fixing it now avoids a surprise retro bill.",
    urgency: "later",
    amount: Math.abs(impact("fix-greg-meridian")),
    amountLabel: "owed",
    href: "/savings?finding=F-1054",
    toast: `Done. ${platform.name} sent Meridian the EE+Child(ren) correction for Greg Novak, retro to Mar 1.`,
    feed: "Sent Meridian tier correction for Greg Novak (retro Mar 1)",
  },
  {
    id: "generate-s125",
    title: "Generate a Section 125 plan document",
    why: `No cafeteria plan document is on file. ${platform.name} drafts it and ${advisor.name} reviews before signature.`,
    urgency: "later",
    href: "/compliance",
    toast: `Done. ${platform.name} generated a Section 125 plan document and sent it to ${advisor.name} for review.`,
    feed: "Generated Section 125 plan document; sent to Marco for review",
  },
  {
    id: "nudge-oe",
    title: "Nudge everyone who hasn't started",
    why: "Send a friendly Slack reminder ahead of the Oct 26 open.",
    urgency: "later",
    href: "/enrollment",
    toast: `Done. ${platform.name} posted the reminder in #general and DM'd everyone who hasn't started.`,
    feed: "Nudged employees who haven't started OE (Slack)",
  },
  {
    id: "oe-announcement",
    title: "Post the open enrollment announcement",
    why: `Drafted by ${platform.name} for #general.`,
    urgency: "later",
    href: "/enrollment",
    toast: `Done. ${platform.name} posted the open enrollment announcement to #general.`,
    feed: "Posted the OE announcement to #general",
  },
];

export const actionById: Record<string, ApprovalAction> = Object.fromEntries(actions.map((a) => [a.id, a]));

export const todayActionIds = actions.filter((a) => a.urgency !== "later").map((a) => a.id);

export function dueBadge(a: ApprovalAction) {
  return a.dueDate ? fmtShort(a.dueDate) : undefined;
}
