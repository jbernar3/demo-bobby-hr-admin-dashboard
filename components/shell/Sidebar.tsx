"use client";

import { RotateCcw, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { carriers } from "@/data/plans";
import { company, user } from "@/data/company";
import { cn } from "@/lib/format";
import { metrics } from "@/lib/selectors";
import { resetDemo, toast, useDemoState } from "@/lib/store";
import { Avatar, WorkingDot } from "../ui";
import { NAV } from "./nav";
import { useUI } from "./ui-context";

function useTicker(messages: string[], interval = 2600) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setI((n) => (n + 1) % messages.length), interval);
    return () => window.clearInterval(t);
  }, [messages.length, interval]);
  return messages[i % messages.length];
}

export function Sidebar() {
  const pathname = usePathname();
  const state = useDemoState();
  const m = metrics(state.done);
  const { navOpen, setNavOpen } = useUI();

  const counts: Record<string, number | undefined> = {
    "/": m.pendingApprovals || undefined,
    "/savings": m.openFindings || undefined,
    "/cases": m.openCases || undefined,
  };

  const carrierCount = Object.keys(carriers).length - 1; // Keystone is an administrator, not a carrier
  const ticker = useTicker([
    "Reconciling Jun invoices",
    `Monitoring ${carrierCount} carriers`,
    `Tracking ${m.openCases} open cases`,
    "Checking eligibility rules",
    "Watching state thresholds",
  ]);

  return (
    <>
      {navOpen && (
        <div className="fixed inset-0 z-40 bg-ink/40 lg:hidden" onClick={() => setNavOpen(false)} aria-hidden />
      )}
      <aside
        className={cn(
          "surface-dark fixed inset-y-0 left-0 z-40 flex w-[244px] flex-col bg-ink text-paper transition-transform duration-200 lg:translate-x-0",
          navOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Primary"
      >
        <div className="flex items-center justify-between px-6 pb-8 pt-6">
          <Link href="/" className="text-[30px] font-black leading-none tracking-[-0.06em]" onClick={() => setNavOpen(false)}>
            Keel
          </Link>
          <button
            type="button"
            className="inline-flex size-8 items-center justify-center rounded-[4px] text-neutral-400 hover:text-paper lg:hidden"
            onClick={() => setNavOpen(false)}
            aria-label="Close navigation"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mx-6 mb-6 border-t border-neutral-800 pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">Company</p>
          <p className="mt-1 text-[14px] font-semibold">{company.shortName}</p>
        </div>

        <nav className="flex-1 px-3">
          <ul className="space-y-0.5">
            {NAV.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              const count = counts[item.href];
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setNavOpen(false)}
                    className={cn(
                      "group flex h-9 items-center gap-3 rounded-[4px] px-3 text-[14px] font-medium transition-colors duration-150",
                      active ? "bg-paper text-ink" : "text-neutral-300 hover:bg-neutral-900 hover:text-paper",
                    )}
                  >
                    <Icon className="size-[17px] shrink-0" strokeWidth={active ? 2.4 : 1.9} aria-hidden />
                    <span className="flex-1">{item.label}</span>
                    {count !== undefined && (
                      <span
                        className={cn("num text-[12px]", active ? "text-neutral-500" : "text-neutral-500")}
                        aria-label={`${count} open`}
                      >
                        {count}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="px-6 pb-5">
          <div className="mb-5 flex items-center gap-2.5 border-t border-neutral-800 pt-4" aria-live="off">
            <WorkingDot dark />
            <span className="num truncate text-[11.5px] text-neutral-400">
              {ticker}
              <span className="animate-blink">_</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Avatar initials={user.initials} dark size={32} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-semibold">{user.name}</p>
              <p className="truncate text-[12px] text-neutral-400">{user.title}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              resetDemo();
              toast("Demo reset. All approvals restored.");
            }}
            className="mt-4 inline-flex items-center gap-1.5 text-[11.5px] font-medium text-neutral-500 hover:text-paper"
          >
            <RotateCcw className="size-3" aria-hidden />
            Reset demo
          </button>
        </div>
      </aside>
    </>
  );
}
