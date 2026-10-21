"use client";

import { Check, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { actionById } from "@/data/actions";
import { openEnrollment } from "@/data/company";
import { employeeById, employees, fullName } from "@/data/employees";
import { lifeEvents, newHires, nudgeMessage, oeStatusById } from "@/data/enrollment";
import { addDays, DEMO_TODAY, daysBetween, daysFromToday, fmtDate, fmtShort, relativeDue } from "@/lib/dates";
import { cn, plural } from "@/lib/format";
import { approve, toast, useDemoState } from "@/lib/store";
import type { OEStatus } from "@/lib/types";
import { Badge, Button, Drawer, PageHeader, Reveal, SectionTitle, Segmented, Status } from "../ui";

const OE_ORDER: OEStatus[] = ["Not started", "In progress", "Complete", "Waived"];

export function EnrollmentView() {
  const state = useDemoState();
  const [filter, setFilter] = useState<"all" | OEStatus>("all");
  const [nudgeOpen, setNudgeOpen] = useState(false);
  const [message, setMessage] = useState(nudgeMessage);

  const eligible = employees.filter((e) => e.status === "Active" && e.type === "Full-time");
  const withStatus = eligible.map((e) => ({ e, status: oeStatusById[e.id] ?? ("Not started" as OEStatus) }));
  const counts = OE_ORDER.reduce<Record<OEStatus, number>>(
    (m, s) => ({ ...m, [s]: withStatus.filter((w) => w.status === s).length }),
    { "Not started": 0, "In progress": 0, Complete: 0, Waived: 0 },
  );
  const shown = withStatus
    .filter((w) => filter === "all" || w.status === filter)
    .sort((a, b) => OE_ORDER.indexOf(a.status) - OE_ORDER.indexOf(b.status) || a.e.lastName.localeCompare(b.e.lastName));

  const opensIn = daysFromToday(openEnrollment.start);
  const windowDays = daysBetween(openEnrollment.start, openEnrollment.end) + 1;
  const nudged = state.done["nudge-oe"];
  const packetDone = state.done["oe-packet"];
  const soon = opensIn <= 45;

  return (
    <div>
      <PageHeader eyebrow="Enrollment · 2027 plan year" title="Open enrollment command center" sub="Keel runs open enrollment, life events, and new-hire eligibility. You approve the messages and changes." />

      {/* ── Countdown ───────────────────────────────────── */}
      <section aria-label="Open enrollment countdown" className="mb-14 grid grid-cols-1 border border-ink lg:grid-cols-[1fr_1fr_1.2fr]">
        <div className="surface-dark bg-ink p-7 text-paper">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Opens in</p>
          <p className="num mt-4 text-[96px] font-bold leading-[0.8] tracking-[-0.08em]">
            {opensIn}
            <span className="ml-2 align-top text-[22px] font-medium tracking-[-0.02em] text-neutral-400">days</span>
          </p>
          <p className="num mt-5 text-[13px] text-neutral-400">
            {fmtDate(openEnrollment.start)} – {fmtShort(openEnrollment.end)} · {windowDays}-day window
          </p>
        </div>
        <div className="border-b border-ink p-7 lg:border-b-0 lg:border-r">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-500">Readiness</p>
          <ul className="mt-4 space-y-2.5 text-[14px]">
            <li className="flex items-center gap-2.5">
              <span className="ml-1 mr-0.5 size-2 rounded-full border-[1.5px] border-ink" aria-hidden />
              Renewal finalized ({openEnrollment.renewalsFinalized}/{openEnrollment.renewalsTotal}): proposal expected this summer
            </li>
            <li className="flex items-center gap-2.5">
              <span className="ml-1 mr-0.5 size-2 rounded-full border-[1.5px] border-ink" aria-hidden />
              Decision support opens {fmtShort(openEnrollment.decisionSupportOpened)}
            </li>
            <li className="flex items-center gap-2.5">
              {packetDone ? <Check className="size-4" aria-hidden /> : <span className="ml-1 mr-0.5 size-2 rounded-full border-[1.5px] border-ink" aria-hidden />}
              OE packet with SBCs {packetDone ? `scheduled (${packetDone.at})` : soon ? "awaiting your approval" : "Keel drafts this closer to open"}
            </li>
          </ul>
          {!packetDone && soon && (
            <Button
              variant="primary"
              className="mt-5"
              onClick={() => {
                approve("oe-packet");
                toast(actionById["oe-packet"].toast);
              }}
            >
              <Check className="size-4" aria-hidden /> Approve OE packet
            </Button>
          )}
        </div>
        <div className="p-7">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-500">Early decisions · {eligible.length} eligible</p>
          <div className="mt-5 flex h-3 w-full overflow-hidden rounded-[2px] bg-neutral-100" role="img" aria-label={OE_ORDER.map((s) => `${counts[s]} ${s}`).join(", ")}>
            <div className="bg-ink" style={{ width: `${(counts.Complete / eligible.length) * 100}%` }} />
            <div className="bg-neutral-500" style={{ width: `${(counts.Waived / eligible.length) * 100}%` }} />
            <div className="bg-[repeating-linear-gradient(45deg,#000_0_1.5px,#fff_1.5px_4px)]" style={{ width: `${(counts["In progress"] / eligible.length) * 100}%` }} />
          </div>
          <dl className="mt-4 grid grid-cols-4 gap-2">
            {OE_ORDER.map((s) => (
              <div key={s}>
                <dt className="text-[11.5px] text-neutral-500">{s}</dt>
                <dd className="num text-[24px] font-bold tracking-[-0.04em]">{counts[s]}</dd>
              </div>
            ))}
          </dl>
          {!soon ? (
            <p className="mt-4 text-[13.5px] text-neutral-600">Early decisions open {fmtShort(openEnrollment.decisionSupportOpened)}. Keel nudges anyone who hasn&apos;t started.</p>
          ) : nudged ? (
            <p className="mt-4 flex items-center gap-2 text-[13.5px] font-semibold"><Check className="size-4" aria-hidden /> Nudge sent at {nudged.at}</p>
          ) : (
            <Button className="mt-4" onClick={() => setNudgeOpen(true)}>
              <MessageSquare className="size-4" aria-hidden /> Nudge everyone who hasn&apos;t started ({counts["Not started"]})
            </Button>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-12 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* ── Status by employee ─────────────────────────── */}
        <section aria-labelledby="status-title">
          <SectionTitle id="status-title" count={shown.length}>
            Status by employee
          </SectionTitle>
          <div className="mb-3">
            <Segmented
              label="Filter by status"
              value={filter}
              onChange={setFilter}
              options={[{ value: "all", label: "All" }, ...OE_ORDER.map((s) => ({ value: s, label: s }))]}
            />
          </div>
          <ul className="scroll-thin max-h-[640px] divide-y divide-neutral-100 overflow-y-auto pr-1">
            {shown.map(({ e, status }) => (
              <li key={e.id} className="flex items-center justify-between gap-3 py-2.5">
                <Link href={`/employees?id=${e.id}`} className="min-w-0 hover:underline">
                  <span className="block truncate text-[14px] font-semibold">{fullName(e)}</span>
                  <span className="block truncate text-[12px] text-neutral-500">{e.department} · {e.state}</span>
                </Link>
                <Status kind={status === "Complete" ? "done" : status === "In progress" ? "pending" : status === "Waived" ? "neutral" : "info"}>{status}</Status>
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-12">
          {/* ── Life events ──────────────────────────────── */}
          <section aria-labelledby="le-title">
            <SectionTitle id="le-title" count={lifeEvents.length}>Life events</SectionTitle>
            <ul className="space-y-3">
              {lifeEvents.map((le, i) => {
                const emp = employeeById[le.employeeId];
                const approved = le.actionId ? state.done[le.actionId] : undefined;
                const done = le.status === "Completed" || !!approved;
                const closes = addDays(le.eventDate, le.windowDays);
                return (
                  <Reveal as="li" key={le.id} index={i} className={cn("rounded-[6px] border p-5", done ? "border-neutral-200" : "border-ink")}>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={done ? "muted" : "solid"}>{le.type}</Badge>
                      {!done && le.type !== "Dependent age-out" && <Badge tone="muted" mono>Window closes {fmtShort(closes)} · {relativeDue(closes)}</Badge>}
                      {done && <span className="num text-[12px] text-neutral-500">{approved ? `Approved ${approved.at}` : `Completed ${fmtShort(le.completedOn!)}`}</span>}
                    </div>
                    <p className="mt-2.5 text-[16px] font-bold">
                      <Link href={`/employees?id=${emp.id}`} className="hover:underline">{fullName(emp)}</Link>
                      <span className="num ml-2 text-[13px] font-normal text-neutral-500">{fmtDate(le.eventDate)}</span>
                    </p>
                    <p className="mt-1 text-[13.5px] leading-snug text-neutral-600">{le.description}</p>
                    {le.actionId && !done && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="mt-4"
                        onClick={() => {
                          approve(le.actionId!);
                          toast(actionById[le.actionId!].toast);
                        }}
                      >
                        <Check className="size-3.5" aria-hidden /> Approve change
                      </Button>
                    )}
                  </Reveal>
                );
              })}
            </ul>
          </section>

          {/* ── New hires ─────────────────────────────────── */}
          <section aria-labelledby="nh-title">
            <SectionTitle id="nh-title" count={newHires.length}>New-hire eligibility</SectionTitle>
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="text-left text-[12px] text-neutral-500">
                  <th scope="col" className="pb-2 font-semibold">Employee</th>
                  <th scope="col" className="pb-2 font-semibold">Hired</th>
                  <th scope="col" className="pb-2 font-semibold">Waiting period</th>
                  <th scope="col" className="pb-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {newHires.map((nh) => {
                  const emp = employeeById[nh.employeeId];
                  const waiting = daysBetween(emp.hireDate, nh.eligibleOn);
                  const progress = Math.min(1, Math.max(0, daysBetween(emp.hireDate, DEMO_TODAY) / Math.max(waiting, 1)));
                  return (
                    <tr key={nh.employeeId} className="border-t border-neutral-200 align-top">
                      <td className="py-3 pr-3">
                        <Link href={`/employees?id=${emp.id}`} className="font-semibold hover:underline">{fullName(emp)}</Link>
                        <span className="block text-[12px] text-neutral-500">{emp.city}, {emp.state}</span>
                      </td>
                      <td className="num whitespace-nowrap py-3 pr-3">{fmtShort(emp.hireDate)}</td>
                      <td className="py-3 pr-3">
                        {waiting === 0 ? (
                          <span className="text-[13px]">None (hired on the 1st)</span>
                        ) : (
                          <>
                            <span className="num block whitespace-nowrap text-[13px]">Eligible {fmtShort(nh.eligibleOn)}</span>
                            <span className="mt-1.5 block h-1 w-28 overflow-hidden rounded-full bg-neutral-200">
                              <span className="block h-full bg-ink" style={{ width: `${progress * 100}%` }} />
                            </span>
                          </>
                        )}
                      </td>
                      <td className="py-3">
                        <Status kind={nh.election === "Enrolled" ? "done" : nh.election === "Elected" ? "pending" : "info"}>{nh.election}</Status>
                        <span className="mt-1 block max-w-[260px] text-[12px] leading-snug text-neutral-500">{nh.note}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        </div>
      </div>

      <Drawer
        open={nudgeOpen}
        onClose={() => setNudgeOpen(false)}
        width={560}
        title={
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Slack · #general + DMs</p>
            <h2 className="mt-1 text-[24px] font-black tracking-[-0.03em]">Nudge {plural(counts["Not started"], "person", "people")}</h2>
          </div>
        }
        footer={
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                approve("nudge-oe");
                toast(actionById["nudge-oe"].toast);
                setNudgeOpen(false);
              }}
            >
              <Check className="size-4" aria-hidden /> Approve &amp; send
            </Button>
            <Button size="lg" onClick={() => setNudgeOpen(false)}>Cancel</Button>
          </div>
        }
      >
        <p className="mb-4 text-[13.5px] text-neutral-600">
          Keel drafted this. It posts once in #general and goes as a DM to everyone who hasn&apos;t started. Edit anything before approving.
        </p>
        <label htmlFor="nudge-text" className="sr-only">Slack message</label>
        <textarea
          id="nudge-text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={14}
          className="w-full resize-y rounded-[6px] border border-neutral-300 p-4 text-[14px] leading-relaxed outline-none focus:border-ink"
        />
        <p className="mb-2 mt-5 text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Recipients</p>
        <p className="text-[13px] leading-relaxed text-neutral-600">
          {withStatus.filter((w) => w.status === "Not started").map((w) => fullName(w.e)).join(", ")}
        </p>
      </Drawer>
    </div>
  );
}
