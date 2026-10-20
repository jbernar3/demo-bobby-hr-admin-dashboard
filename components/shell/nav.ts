import {
  ClipboardCheck,
  Inbox,
  Layers,
  type LucideIcon,
  PiggyBank,
  ShieldCheck,
  Sun,
  TrendingUp,
  Users,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

export const NAV: NavItem[] = [
  { href: "/", label: "Today", icon: Sun, description: "Approvals and what Bobby did overnight" },
  { href: "/employees", label: "Employees", icon: Users, description: "Roster, coverage, dependents" },
  { href: "/enrollment", label: "Enrollment", icon: ClipboardCheck, description: "Open enrollment, life events, new hires" },
  { href: "/plan", label: "Plan & Costs", icon: Layers, description: "Plans, rates, level-funded tracking" },
  { href: "/savings", label: "Savings", icon: PiggyBank, description: "Leakage monitor and credits" },
  { href: "/compliance", label: "Compliance", icon: ShieldCheck, description: "Deadlines, notices, filings" },
  { href: "/growth", label: "Growth Alerts", icon: TrendingUp, description: "Thresholds, ACA, new states" },
  { href: "/cases", label: "Cases", icon: Inbox, description: "Carrier cases Bobby and Marco are handling" },
];
