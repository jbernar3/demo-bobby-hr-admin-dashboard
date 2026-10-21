"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { actions } from "@/data/actions";
import { overnightActivity } from "@/data/activity";
import { openEnrollment, planningTodos, user } from "@/data/company";
import { employees } from "@/data/employees";
import { oeStatusById } from "@/data/enrollment";
import { addDays, DEMO_TODAY, daysFromToday, fmtShort, parts, relative } from "@/lib/dates";
import { cn, plural } from "@/lib/format";
import { demoToast, useDemo } from "@/lib/store";
import type { Urgency } from "@/lib/types";
import { Badge, Reveal, SectionTitle, WorkingDot } from "../ui";
import { ApprovalCard } from "./ApprovalCard";

const URGENCY_RANK: Record<Urgency, number> = { today: 0, week: 1, later: 2 };
const WEEKDAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function TodayView() {
  const { state, restore } = useDemo();

  const queue = actions
    .map((a, i) => ({ a, i }))
    .filter(({ a }) => a.urgency !== "later" && !state.done[a.id] && !state.dismissed[a.id])
    .sort((x, y) => URGENCY_RANK[x.a.urgency] - URGENCY_RANK[y.a.urgency] || x.i - y.i)
    .map(({ a }) => a);
  const dismissed = actions.filter((a) => state.dismissed[a.id] && !state.done[a.id]);

  const approvedFeed = Object.entries(state.done)
    .sort((a, b) => b[1].seq - a[1].seq)
    .map(([id, d]) => ({ id, at: d.at, text: actions.find((a) => a.id === id)?.feed ?? id }));

  const { y, m: mo, d } = parts(DEMO_TODAY);
  const weekday = WEEKDAYS_LONG[new Date(Date.UTC(y, mo - 1, d)).getUTCDay()];

  return (
    <div>
      <header className="mb-12">
        <p className="num mb-5 text-[12.5px] uppercase tracking-[0.12em] text-neutral-500">
          {weekday}, {MONTHS_LONG[mo - 1]} {d}
        </p>
        <h1 className="text-[52px] font-black leading-[0.92] tracking-[-0.045em] md:text-[76px]">
          Good morning, {user.firstName}.
        </h1>
      </header>

      <div className="grid grid-cols-1 gap-12 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* ── Approvals ─────────────────────────────────── */}
        <section aria-labelledby="approvals-title">
          <SectionTitle
            id="approvals-title"
            count={queue.length}
            right={<span className="text-[12.5px] text-neutral-500">Keel proposes. You approve.</span>}
          >
            Needs your approval
          </SectionTitle>

          {queue.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="surface-dark rounded-[6px] bg-ink px-8 py-12 text-paper"
            >
              <p className="text-[40px] font-black leading-none tracking-[-0.04em]">Inbox zero.</p>
              <p className="mt-3 max-w-md text-[15px] text-neutral-400">
                Everything Keel proposed is approved. Keel keeps watching invoices, deadlines, and thresholds overnight.
              </p>
            </motion.div>
          )}

          <ul className="space-y-3">
            <AnimatePresence initial={false}>
              {queue.map((a, i) => (
                <ApprovalCard key={a.id} action={a} index={i} />
              ))}
            </AnimatePresence>
          </ul>

          {dismissed.length > 0 && (
            <p className="mt-4 text-[13px] text-neutral-500">
              {plural(dismissed.length, "item")} dismissed.{" "}
              <button
                type="button"
                className="font-semibold text-ink underline underline-offset-2"
                onClick={() => dismissed.forEach((a) => restore(a.id))}
              >
                Restore
              </button>
            </p>
          )}
        </section>

        {/* ── Right rail ────────────────────────────────── */}
        <div className="space-y-12">
          <Reveal index={0} as="section" className="border border-ink p-6">
            <StatLabel>Your next to-dos</StatLabel>
            <ul className="space-y-2">
              {planningTodos.map((t) => (
                <li key={t.id} className="flex items-baseline gap-3 text-[14px]">
                  <span className="num w-[52px] shrink-0 font-semibold">{fmtShort(addDays(openEnrollment.start, -t.daysBefore))}</span>
                  <Link href={t.href} className="min-w-0 flex-1 text-neutral-700 hover:text-ink hover:underline">
                    {t.label}
                  </Link>
                </li>
              ))}
            </ul>
            <StatLink href="/plan">Plan &amp; Costs</StatLink>
          </Reveal>

          <section aria-labelledby="feed-title">
            <SectionTitle id="feed-title" right={<WorkingDot />}>
              Keel, overnight
            </SectionTitle>
            <ol className="relative">
              <AnimatePresence initial={false}>
                {approvedFeed.map((f) => (
                  <motion.li
                    key={`done-${f.id}`}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
                    className="overflow-hidden"
                  >
                    <FeedRow at={f.at} text={f.text} tag="You approved" />
                  </motion.li>
                ))}
              </AnimatePresence>
              {overnightActivity.map((item, i) => (
                <Reveal as="li" key={item.id} index={i + 3}>
                  <FeedRow at={item.at} text={item.text} detail={item.detail} href={item.href} />
                </Reveal>
              ))}
            </ol>
          </section>

          <OEModule />
        </div>
      </div>
    </div>
  );
}

function StatLabel({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <p className={cn("mb-5 text-[12px] font-semibold uppercase tracking-[0.14em]", dark ? "text-neutral-400" : "text-neutral-500")}>
      {children}
    </p>
  );
}

function StatLink({ href, children, dark }: { href: string; children: React.ReactNode; dark?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "mt-6 inline-flex items-center gap-1 text-[13px] font-semibold underline-offset-4 hover:underline",
        dark ? "text-paper" : "text-ink",
      )}
    >
      {children}
      <ArrowUpRight className="size-3.5" aria-hidden />
    </Link>
  );
}

function FeedRow({ at, text, detail, href, tag }: { at: string; text: string; detail?: string; href?: string; tag?: string }) {
  const body = (
    <>
      <span className="num w-[68px] shrink-0 pt-px text-[11.5px] leading-5 text-neutral-500">{at}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-medium leading-5">
          {tag && (
            <Badge tone="solid" className="mr-2 h-[18px] translate-y-[-1px] px-1 text-[10.5px]">
              {tag}
            </Badge>
          )}
          {text}
        </span>
        {detail && <span className="mt-0.5 block text-[12.5px] leading-snug text-neutral-500">{detail}</span>}
      </span>
    </>
  );
  return href ? (
    <Link href={href} className="-mx-2 flex gap-3 rounded-[4px] border-b border-neutral-100 px-2 py-3 hover:bg-neutral-50">
      {body}
    </Link>
  ) : (
    <div className="flex gap-3 border-b border-neutral-100 py-3">{body}</div>
  );
}

function OEModule() {
  const eligible = employees.filter((e) => e.status === "Active" && e.type === "Full-time");
  const statuses = eligible.map((e) => oeStatusById[e.id] ?? "Not started");
  const complete = statuses.filter((s) => s === "Complete" || s === "Waived").length;
  const inProgress = statuses.filter((s) => s === "In progress").length;
  const startsIn = daysFromToday(openEnrollment.start);
  return (
    <section aria-labelledby="oe-title">
      <SectionTitle id="oe-title" right={<Badge tone="solid" mono>{startsIn > 0 ? `Starts ${relative(openEnrollment.start)}` : "Open now"}</Badge>}>
        Open enrollment
      </SectionTitle>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
        <div>
          <dt className="text-[12px] text-neutral-500">Renewals finalized</dt>
          <dd className="num mt-1 text-[26px] font-bold leading-none tracking-[-0.03em]">
            {openEnrollment.renewalsFinalized}/{openEnrollment.renewalsTotal}
          </dd>
        </div>
        <div>
          <dt className="text-[12px] text-neutral-500">Window</dt>
          <dd className="num mt-1 text-[15px] font-semibold leading-tight">
            {fmtShort(openEnrollment.start)} – {fmtShort(openEnrollment.end)}
          </dd>
        </div>
      </dl>
      {startsIn > 30 ? (
        <p className="mt-5 text-[13px] text-neutral-600">
          Early decisions open <span className="num font-semibold text-ink">{fmtShort(openEnrollment.decisionSupportOpened)}</span>. Keel is lining up the renewal first.
        </p>
      ) : (
      <div className="mt-5">
        <div className="mb-2 flex justify-between text-[12px] text-neutral-500">
          <span>Early decisions</span>
          <span className="num">
            {complete} done · {inProgress} in progress · {eligible.length - complete - inProgress} not started
          </span>
        </div>
        <div className="flex h-2 w-full overflow-hidden rounded-[2px] bg-neutral-100" role="img" aria-label={`${complete} of ${eligible.length} employees done`}>
          <div className="bg-ink" style={{ width: `${(complete / eligible.length) * 100}%` }} />
          <div className="bg-neutral-400" style={{ width: `${(inProgress / eligible.length) * 100}%` }} />
        </div>
      </div>
      )}
      <div className="mt-5 flex items-center gap-3 rounded-[4px] border border-neutral-300 px-3 py-2.5">
        <span className="size-3.5 shrink-0 rounded-[3px] border border-ink" aria-hidden />
        <span className="min-w-0 flex-1 text-[13px]">
          <span className="font-semibold">To do:</span> Book time with Marco, your licensed advisor
        </span>
        <button
          type="button"
          onClick={() => demoToast("Booking time with Marco")}
          className="shrink-0 text-[12.5px] font-semibold underline-offset-4 hover:underline"
        >
          Book
        </button>
      </div>
      <Link href="/enrollment" className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold underline-offset-4 hover:underline">
        Enrollment command center <ArrowUpRight className="size-3.5" aria-hidden />
      </Link>
    </section>
  );
}
