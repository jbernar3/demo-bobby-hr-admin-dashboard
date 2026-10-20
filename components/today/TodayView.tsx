"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { actions } from "@/data/actions";
import { overnightActivity } from "@/data/activity";
import { openEnrollment, user } from "@/data/company";
import { employees } from "@/data/employees";
import { oeStatusById } from "@/data/enrollment";
import { DEMO_TODAY, daysFromToday, fmtShort, parts, relative } from "@/lib/dates";
import { cn, money, plural } from "@/lib/format";
import { metrics } from "@/lib/selectors";
import { useDemo } from "@/lib/store";
import type { Urgency } from "@/lib/types";
import { Badge, CountUp, Reveal, SectionTitle, WorkingDot } from "../ui";
import { ApprovalCard } from "./ApprovalCard";

const URGENCY_RANK: Record<Urgency, number> = { today: 0, week: 1, later: 2 };
const WEEKDAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function TodayView() {
  const { state, restore } = useDemo();
  const m = metrics(state.done);

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

  const summary =
    m.todayCount === 0
      ? queue.length === 0
        ? "You're all caught up. Everything else is handled."
        : `Nothing urgent today. ${plural(queue.length, "item")} can wait for this week.`
      : `${m.todayCount} ${m.todayCount === 1 ? "thing needs" : "things need"} you today. Everything else is handled.`;

  return (
    <div>
      <header className="mb-12">
        <p className="num mb-5 text-[12.5px] uppercase tracking-[0.12em] text-neutral-500">
          {weekday}, {MONTHS_LONG[mo - 1]} {d}
        </p>
        <h1 className="text-[52px] font-black leading-[0.92] tracking-[-0.045em] md:text-[76px]">
          Good morning, {user.firstName}.
        </h1>
        <p className="mt-5 flex items-center gap-3 text-[19px] font-medium text-neutral-700">
          <WorkingDot />
          <span>{summary}</span>
        </p>
      </header>

      {/* ── Stat blocks ─────────────────────────────────── */}
      <section aria-label="Key numbers" className="mb-14 grid grid-cols-1 border border-ink md:grid-cols-3">
        <Reveal index={0} className="border-b border-ink p-7 md:border-b-0 md:border-r">
          <StatLabel>Recovered YTD</StatLabel>
          <CountUp id="today-recovered" value={m.recoveredYtd} format={(n) => money(n)} className="block text-[54px] font-bold leading-none tracking-[-0.075em] xl:text-[60px] 2xl:text-[68px]" />
          <p className="mt-4 text-[13.5px] text-neutral-600">
            Billing errors caught and credited in 2026.
            {m.pendingCredit > 0 && (
              <>
                {" "}
                <span className="num font-semibold text-ink">{money(m.pendingCredit)}</span> more pending.
              </>
            )}
          </p>
          <StatLink href="/savings">Leakage monitor</StatLink>
        </Reveal>

        <Reveal index={1} className="surface-dark border-b border-ink bg-ink p-7 text-paper md:border-b-0 md:border-r">
          <StatLabel dark>At risk</StatLabel>
          <CountUp
            id="today-risk"
            value={m.atRisk}
            format={(n) => money(n)}
            className={cn("block text-[54px] font-bold leading-none tracking-[-0.075em] xl:text-[60px] 2xl:text-[68px]", m.atRisk > 0 ? "text-signal" : "text-paper")}
          />
          <p className="mt-4 text-[13.5px] text-neutral-400">
            <span className="num text-paper">{money(m.billingAtRisk)}</span> open billing issues
            {m.penaltyAtRisk > 0 && (
              <>
                {" "}
                + up to <span className="num text-paper">{money(m.penaltyAtRisk)}</span> in SBC penalties if OE materials slip
              </>
            )}
            .
          </p>
          <StatLink href="/savings" dark>
            See what&apos;s open
          </StatLink>
        </Reveal>

        <Reveal index={2} className="p-7">
          <StatLabel>Deadlines · next 30 days</StatLabel>
          <CountUp id="today-deadlines" value={m.deadlines.length} format={(n) => String(Math.round(n))} className="block text-[54px] font-bold leading-none tracking-[-0.075em] xl:text-[60px] 2xl:text-[68px]" />
          <ul className="mt-4 space-y-1.5">
            {m.deadlines.slice(0, 3).map((dl) => {
              const overdue = daysFromToday(dl.date) < 0;
              return (
                <li key={dl.id} className="flex items-baseline gap-3 text-[13.5px]">
                  <span className={cn("num w-[52px] shrink-0 font-semibold", overdue ? "text-signal-ink" : "text-ink")}>{fmtShort(dl.date)}</span>
                  <span className="truncate text-neutral-600">{dl.label}</span>
                </li>
              );
            })}
          </ul>
          <StatLink href="/compliance">Compliance calendar</StatLink>
        </Reveal>
      </section>

      <div className="grid grid-cols-1 gap-12 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* ── Approvals ─────────────────────────────────── */}
        <section aria-labelledby="approvals-title">
          <SectionTitle
            id="approvals-title"
            count={queue.length}
            right={<span className="text-[12.5px] text-neutral-500">Bobby proposes. You approve.</span>}
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
                Everything Bobby proposed is approved. Bobby keeps watching invoices, deadlines, and thresholds overnight.
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
          <section aria-labelledby="feed-title">
            <SectionTitle id="feed-title" right={<WorkingDot />}>
              Bobby, overnight
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
      <Link href="/enrollment" className="mt-5 inline-flex items-center gap-1 text-[13px] font-semibold underline-offset-4 hover:underline">
        Enrollment command center <ArrowUpRight className="size-3.5" aria-hidden />
      </Link>
    </section>
  );
}
