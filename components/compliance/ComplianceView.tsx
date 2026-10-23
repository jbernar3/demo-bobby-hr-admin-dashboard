"use client";

import { ArrowUpRight, CalendarRange, Check, List } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { actionById } from "@/data/actions";
import { advisor, platform } from "@/data/company";
import { employees } from "@/data/employees";
import { DEMO_TODAY, daysBetween, fmtDate, fmtShort, relativeDue } from "@/lib/dates";
import { cn, money, plural } from "@/lib/format";
import { type ComplianceView as CView, complianceScore, complianceViews, penaltyExposure, sbcRecipients } from "@/lib/selectors";
import { approve, toast, useDemoState } from "@/lib/store";
import type { ComplianceStatus, Owner } from "@/lib/types";
import { Avatar, Button, CountUp, PageHeader, SectionTitle, Segmented, Status } from "../ui";

const STATUS_KIND: Record<ComplianceStatus, "done" | "pending" | "urgent" | "info" | "neutral"> = {
  Done: "done",
  "Due soon": "pending",
  Overdue: "urgent",
  "Needs info": "info",
  "Not required": "neutral",
};

const STATUS_RANK: Record<ComplianceStatus, number> = { Overdue: 0, "Due soon": 1, "Needs info": 2, Done: 4, "Not required": 5 };

const ACTION_LABEL: Record<string, string> = {
  "cobra-priya": "Approve & send notice",
  "oregon-registrations": "Approve & file",
  "generate-s125": "Generate for review",
  "oe-packet": "Approve OE packet",
};

function stateCount(state?: string) {
  return employees.filter((e) => e.status === "Active" && e.state === state).length;
}

export function ComplianceView() {
  const state = useDemoState();
  const views = complianceViews(state.done);
  const { score, drags } = complianceScore(state.done);
  const [mode, setMode] = useState<"timeline" | "list">("timeline");

  // The COBRA notice is the top priority while open; then overdue → due soon → needs info → done.
  const top = (v: CView) => (v.id === "cobra-priya" && v.effectiveStatus !== "Done" ? 0 : 1);
  const sorted = [...views].sort(
    (a, b) =>
      top(a) - top(b) ||
      STATUS_RANK[a.effectiveStatus] - STATUS_RANK[b.effectiveStatus] ||
      (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"),
  );

  return (
    <div>
      <PageHeader
        eyebrow="Compliance"
        title="Every deadline, watched."
        sub={`${platform.name} tracks federal, state, and local obligations for Parallax and drafts what's needed. Nothing here is legal advice, and Marco reviews anything that is.`}
      />

      {/* ── Score ─────────────────────────────────────────── */}
      <section aria-labelledby="score-title" className="mb-14 grid grid-cols-1 border border-ink lg:grid-cols-[400px_1fr]">
        <div className="surface-dark bg-ink p-8 text-paper">
          <p id="score-title" className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
            Compliance health
          </p>
          <p className="mt-5 flex items-baseline gap-2">
            <CountUp id="compliance-score" value={score} format={(n) => String(Math.round(n))} className="text-[104px] font-bold leading-[0.8] tracking-[-0.08em]" />
            <span className="num text-[28px] text-neutral-500">/ 100</span>
          </p>
          <p className="mt-6 text-[14px] text-neutral-400">
            {drags.length === 0 ? "Nothing is dragging the score down." : `${plural(drags.length, "item")} dragging it down. Approve them to reach 100.`}
          </p>
        </div>
        <div className="p-6 lg:p-8">
          <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-500">What&apos;s dragging it down</p>
          {drags.length === 0 ? (
            <p className="text-[22px] font-bold tracking-[-0.02em]">All clear. {platform.name} will keep watching.</p>
          ) : (
            <ul className="divide-y divide-neutral-200">
              {groupByAction(drags).map((g) => (
                <li key={g.key} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                  <span className="num w-[42px] text-[20px] font-bold tracking-[-0.04em]">−{g.weight}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold">{g.title}</span>
                    <span className="block text-[13px] text-neutral-500">{g.note}</span>
                  </span>
                  {g.actionId && !state.done[g.actionId] && (
                    <ActionButton actionId={g.actionId} />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <SectionTitle
        right={
          <Segmented
            label="View"
            value={mode}
            onChange={setMode}
            options={[
              { value: "timeline", label: <><CalendarRange className="size-3.5" aria-hidden /> Timeline</> },
              { value: "list", label: <><List className="size-3.5" aria-hidden /> List</> },
            ]}
          />
        }
        count={views.length}
      >
        Obligations
      </SectionTitle>

      {mode === "timeline" ? <Timeline views={views} /> : null}
      <ItemList views={mode === "timeline" ? sorted.filter((v) => v.effectiveStatus !== "Done" && v.effectiveStatus !== "Not required") : sorted} compact={mode === "timeline"} />
      {mode === "timeline" && (
        <p className="mt-4 text-[13px] text-neutral-500">
          Showing open items.{" "}
          <button type="button" onClick={() => setMode("list")} className="font-semibold text-ink underline underline-offset-2">
            See all {views.length} in list view
          </button>
        </p>
      )}
    </div>
  );
}

function groupByAction(drags: CView[]) {
  const map = new Map<string, { key: string; title: string; note: string; weight: number; actionId?: string }>();
  for (const d of drags) {
    const key = d.actionId ?? d.id;
    const existing = map.get(key);
    if (existing) {
      existing.weight += d.effectiveWeight;
      continue;
    }
    const isOregon = d.actionId === "oregon-registrations";
    map.set(key, {
      key,
      title: isOregon ? "Oregon registrations (3)" : d.title,
      note: isOregon ? "Paid Leave Oregon, withholding, UI. First paycheck was Jun 15" : d.effectiveNote ?? d.rule,
      weight: d.effectiveWeight,
      actionId: d.actionId,
    });
  }
  return [...map.values()].sort((a, b) => b.weight - a.weight);
}

function ActionButton({ actionId, size = "sm" }: { actionId: string; size?: "sm" | "md" }) {
  const a = actionById[actionId];
  return (
    <Button
      variant="primary"
      size={size}
      onClick={() => {
        approve(actionId);
        toast(a.toast);
      }}
    >
      <Check className="size-3.5" aria-hidden />
      {ACTION_LABEL[actionId] ?? "Approve"}
    </Button>
  );
}

// ── Timeline ─────────────────────────────────────────────

const RANGE_START = "2026-06-01";
const RANGE_END = "2027-01-15";
const MONTH_TICKS = ["2026-06-01", "2026-07-01", "2026-08-01", "2026-09-01", "2026-10-01", "2026-11-01", "2026-12-01"];

function Timeline({ views }: { views: CView[] }) {
  const span = daysBetween(RANGE_START, RANGE_END);
  const pos = (d: string) => Math.max(0, Math.min(1, daysBetween(RANGE_START, d) / span)) * 100;

  // One marker per action group, dated items within range only.
  const seen = new Set<string>();
  const items = views
    .filter((v) => v.dueDate && v.dueDate >= RANGE_START && v.dueDate <= RANGE_END)
    .filter((v) => {
      const key = v.actionId ?? v.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((v) => ({
      v,
      label: v.actionId === "oregon-registrations" ? "Oregon registrations" : v.actionId === "oe-packet" ? "SBCs with OE packet" : v.title.replace(" (Form 720)", ""),
      x: pos(v.dueDate!),
    }))
    .sort((a, b) => a.x - b.x);

  // Greedy lane assignment so labels don't collide (~18% of width per label).
  const laneEnds: number[] = [];
  const placed = items.map((it) => {
    // Labels near the right edge flip to the left of their marker.
    const start = it.x > 80 ? it.x - 21 : it.x;
    let lane = laneEnds.findIndex((end) => start > end);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(0);
    }
    laneEnds[lane] = it.x > 80 ? it.x : it.x + 21;
    return { ...it, lane };
  });
  const lanes = Math.max(1, laneEnds.length);
  const todayX = pos(DEMO_TODAY);

  return (
    <div className="mb-8 scroll-thin overflow-x-auto">
      <div className="relative min-w-[900px] pb-2" style={{ height: 64 + lanes * 62 }}>
        {/* Month axis */}
        <div className="absolute inset-x-0 top-6 h-px bg-ink" />
        {MONTH_TICKS.map((t) => (
          <div key={t} className="absolute top-0" style={{ left: `${pos(t)}%` }}>
            <span className="num block text-[11.5px] font-semibold uppercase text-neutral-500">{fmtShort(t).split(" ")[0]}</span>
            <span className="absolute left-0 top-6 block h-2 w-px bg-ink" />
          </div>
        ))}
        {/* Today */}
        <div className="absolute bottom-0 top-4 w-px bg-neutral-300" style={{ left: `${todayX}%` }}>
          <span className="num absolute -left-px -top-4 whitespace-nowrap bg-ink px-1.5 py-0.5 text-[10.5px] font-semibold text-paper">
            Today
          </span>
        </div>
        {placed.map(({ v, label, x, lane }) => {
          const status = v.effectiveStatus;
          return (
            <div key={v.id} className="absolute z-10" style={{ left: `${x}%`, top: 44 + lane * 62 }}>
              <span
                className={cn(
                  "absolute -left-[5px] top-0 block size-[11px] rounded-full",
                  status === "Done" && "bg-ink",
                  status === "Overdue" && "bg-signal",
                  (status === "Due soon" || status === "Needs info") && "border-2 border-ink bg-paper",
                )}
                aria-hidden
              />
              <span className="absolute left-0 top-[11px] block h-3 w-px bg-neutral-300" aria-hidden />
              <div className={cn("w-[190px] -translate-y-[3px] bg-paper", x > 80 ? "absolute right-3 text-right" : "ml-3")}>
                <p className={cn("text-[13px] font-semibold leading-tight", status === "Done" && "text-neutral-500")}>{label}</p>
                <p className={cn("num mt-0.5 text-[11.5px]", status === "Overdue" ? "text-signal-ink" : "text-neutral-500")}>
                  {fmtShort(v.dueDate!)} · {status === "Done" ? "Done" : status === "Overdue" ? relativeDue(v.dueDate!) : status}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── List ─────────────────────────────────────────────────

function OwnerChip({ owner }: { owner: Owner }) {
  if (owner === "Advisor")
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px]">
        <Avatar initials={advisor.initials} size={20} /> Marco
      </span>
    );
  if (owner === "Platform")
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px]">
        <span className="inline-flex size-5 items-center justify-center rounded-[3px] bg-ink text-[10px] font-black text-paper" aria-hidden>{platform.monogram}</span>
        {platform.name}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px]">
      <span className="inline-flex size-5 items-center justify-center rounded-full border border-ink text-[8px] font-bold" aria-hidden>DO</span> Dana
    </span>
  );
}

function PenaltyCell({ v }: { v: CView }) {
  if (v.penalty) {
    const exposure = penaltyExposure(v);
    return (
      <span className="text-[13px]">
        <span className="num font-semibold">
          Up to {money(v.penalty.perUnit)}/{v.penalty.unit}
        </span>
        {exposure > 0 && (
          <span className="block text-[12px] text-neutral-500">
            Up to {money(exposure)} across {sbcRecipients} employees
          </span>
        )}
        {v.penalty.note && <span className="block text-[12px] text-neutral-500">{v.penalty.note}</span>}
      </span>
    );
  }
  return <span className="text-[13px] text-neutral-500">Penalty: varies</span>;
}

function ItemList({ views, compact }: { views: CView[]; compact?: boolean }) {
  const state = useDemoState();
  return (
    <div className="scroll-thin overflow-x-auto">
      <table className="w-full min-w-[960px]">
        <thead>
          <tr className="border-b border-neutral-200 text-left text-[12px] text-neutral-500">
            <th scope="col" className="py-2 pr-4 font-semibold">Obligation</th>
            <th scope="col" className="w-[110px] py-2 pr-4 font-semibold">Owner</th>
            <th scope="col" className="w-[150px] py-2 pr-4 font-semibold">Due</th>
            <th scope="col" className="w-[150px] py-2 pr-4 font-semibold">Status</th>
            <th scope="col" className="w-[200px] py-2 pr-4 font-semibold">Penalty exposure</th>
            <th scope="col" className="w-[170px] py-2 font-semibold"><span className="sr-only">Action</span></th>
          </tr>
        </thead>
        <tbody>
          {views.map((v) => {
            const count = v.state ? stateCount(v.state) : 0;
            return (
              <tr key={v.id} className="border-b border-neutral-200 align-top">
                  <td className="py-4 pr-6">
                    <p className="text-[15px] font-semibold leading-snug">
                      {v.title}
                      {v.id === "cobra-priya" && v.effectiveStatus !== "Done" && (
                        <span className="ml-2 inline-flex translate-y-[-1px] items-center rounded-[3px] bg-ink px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.06em] text-paper">
                          Top priority
                        </span>
                      )}
                    </p>
                    <p className="num mt-0.5 text-[11.5px] text-neutral-500">
                      {v.rule}
                      {v.state && ` · ${plural(count, "employee")} in ${v.state}`}
                    </p>
                    {!compact || v.effectiveStatus !== "Done" ? (
                      <p className="mt-1.5 max-w-[62ch] text-[13.5px] leading-snug text-neutral-600">{v.explanation}</p>
                    ) : null}
                    {v.link && (
                      <Link href={v.link.href} className="mt-1.5 inline-flex items-center gap-1 text-[13px] font-semibold underline-offset-2 hover:underline">
                        {v.link.label} <ArrowUpRight className="size-3.5" aria-hidden />
                      </Link>
                    )}
                  </td>
                  <td className="py-4 pr-4"><OwnerChip owner={v.owner} /></td>
                  <td className="py-4 pr-4">
                    {v.dueDate ? (
                      <>
                        <span className="num block text-[13.5px] font-medium">{v.dueLabel && !v.dueLabel.includes("(") ? v.dueLabel : fmtDate(v.dueDate)}</span>
                        {v.effectiveStatus !== "Done" && (
                          <span className={cn("num block text-[12px]", v.effectiveStatus === "Overdue" ? "text-signal-ink" : "text-neutral-500")}>
                            {relativeDue(v.dueDate)}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-[13px] text-neutral-500">{v.dueLabel ?? "Ongoing"}</span>
                    )}
                  </td>
                  <td className="py-4 pr-4">
                    <Status kind={STATUS_KIND[v.effectiveStatus]}>{v.effectiveStatus}</Status>
                    {(v.effectiveNote || v.completedOn) && (
                      <span className="mt-1 block text-[12px] text-neutral-500">
                        {v.approvedAt ? `${v.effectiveNote} · ${v.approvedAt}` : v.completedOn && !v.effectiveNote ? `Completed ${fmtShort(v.completedOn)}` : v.effectiveNote}
                      </span>
                    )}
                  </td>
                  <td className="py-4 pr-4"><PenaltyCell v={v} /></td>
                  <td className="py-4">
                    {v.actionId && !state.done[v.actionId] && <ActionButton actionId={v.actionId} />}
                  </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
