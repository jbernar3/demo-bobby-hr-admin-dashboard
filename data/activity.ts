import type { ActivityItem } from "@/lib/types";

// What Bobby did overnight, newest first. Approvals Dana makes are prepended at runtime.
export const overnightActivity: ActivityItem[] = [
  {
    id: "a1",
    at: "6:02 AM",
    text: "Prepared today's approvals",
    detail: "Sorted by deadline and dollars at risk",
  },
  {
    id: "a2",
    at: "5:40 AM",
    text: "Followed up with Meridian on case #MH-20931",
    detail: "Out-of-network ER denial, now in medical director review",
    href: "/cases",
  },
  {
    id: "a3",
    at: "3:18 AM",
    text: "Answered 7 employee questions in Slack",
    detail: "HSA limits (3), OE dates (2), dental ortho (1), ID cards (1)",
  },
  {
    id: "a4",
    at: "2:51 AM",
    text: "Confirmed Part D creditable coverage notices were delivered",
    detail: "Delivered Oct 9, ahead of the Oct 15 deadline",
    href: "/compliance",
  },
  {
    id: "a5",
    at: "2:20 AM",
    text: "Checked dependent ages against plan rules",
    detail: "1 age-out found: Jordan Kim's dependent",
    href: "/employees?id=e04",
  },
  {
    id: "a6",
    at: "1:47 AM",
    text: "Staged 2027 open enrollment packet",
    detail: "3 SBCs, rate sheet, and decision guide, ready for your approval",
    href: "/enrollment",
  },
  {
    id: "a7",
    at: "Yesterday 4:12 AM",
    text: "Reconciled 4 carrier invoices against payroll (Oct)",
    detail: "New: Jordan Kim age-out, Elena Vasquez missing from Brightline, Greg Novak underbilled",
    href: "/savings",
  },
];
