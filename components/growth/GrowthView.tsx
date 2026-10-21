"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Check, ChevronDown, Minus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { actionById } from "@/data/actions";
import { employeeById, employees, fullName, STORY } from "@/data/employees";
import {
  ACA_YEAR_MONTHS,
  acaProjection,
  ALE_THRESHOLD,
  FT_MONTHLY_HOURS,
  FTE_DIVISOR,
  PLANNED_HIRE_MONTHS,
  recentAverage,
  WEEKS_PER_MONTH,
} from "@/lib/aca";
import { fmtShort, monthLabel, monthName } from "@/lib/dates";
import { cn, num, plural } from "@/lib/format";
import { complianceViews } from "@/lib/selectors";
import { approve, toast, useDemoState } from "@/lib/store";
import { BarChart, LineChart } from "../charts";
import { Badge, Button, PageHeader, Reveal, SectionTitle, Status } from "../ui";
import { TileMap } from "./TileMap";

const MAX_HIRES = 6;

export function GrowthView() {
  const active = employees.filter((e) => e.status === "Active");
  const baseline = acaProjection(0);
  const participants = active.filter((e) => e.coverage.medical).length;

  return (
    <div>
      <PageHeader eyebrow="Growth Alerts" title={<>Keel watches the lines you&apos;re about to cross.</>} sub="Federal and state rules switch on at specific headcounts. Keel tracks where Parallax is against each one and warns you before you cross." />
      <ThresholdTrack employees={active.length} fte={baseline.average} participants={participants} />
      <AcaProjection />
      <div className="mt-16 grid grid-cols-1 gap-12 xl:grid-cols-2">
        <OregonAlert />
        <PartTimeWatch />
      </div>
    </div>
  );
}

// ── Threshold timeline ───────────────────────────────────

function ThresholdTrack({ employees: headcount, fte, participants }: { employees: number; fte: number; participants: number }) {
  const max = 110;
  const pct = (v: number) => (v / max) * 100;
  const milestones = [
    { at: 20, metric: "employees", rule: "Federal COBRA", detail: "Continuation coverage for departing employees", value: headcount, unit: "employees" },
    { at: 50, metric: "FTEs", rule: "ACA employer mandate", detail: "Offer coverage + file Forms 1094-C / 1095-C", value: fte, unit: "FTEs" },
    { at: 50, metric: "employees", rule: "FMLA", detail: "50 within 75 miles of a worksite. Worksite rules apply", value: headcount, unit: "employees" },
    { at: 100, metric: "participants", rule: "Form 5500 filing", detail: "Annual ERISA filing for the health plan", value: participants, unit: "plan participants" },
  ];
  const status = (m: (typeof milestones)[number]) =>
    m.value > m.at ? "Crossed" : m.value === m.at ? "At threshold" : m.at - m.value <= 2 ? "Approaching" : "Future";

  return (
    <section aria-labelledby="track-title" className="mb-16">
      <SectionTitle id="track-title">Threshold timeline</SectionTitle>
      <div className="relative mx-2 mb-10 mt-16 h-16">
        <div className="absolute inset-x-0 top-1/2 h-px bg-neutral-300" />
        <div className="absolute left-0 top-1/2 h-[3px] -translate-y-px bg-ink" style={{ width: `${pct(headcount)}%` }} />
        {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110].map((t) => (
          <div key={t} className="absolute top-1/2" style={{ left: `${pct(t)}%` }}>
            <span className="block h-2 w-px -translate-y-1/2 bg-neutral-400" />
            <span className="num absolute left-0 top-3 -translate-x-1/2 text-[10.5px] text-neutral-500">{t}</span>
          </div>
        ))}
        {[20, 50, 100].map((t) => (
          <span key={t} className="absolute top-1/2 block size-3.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border-2 border-ink bg-paper" style={{ left: `${pct(t)}%` }} aria-hidden />
        ))}
        <div className="absolute bottom-[calc(50%+14px)] -translate-x-1/2" style={{ left: `${pct(headcount)}%` }}>
          <div className="whitespace-nowrap rounded-[3px] bg-ink px-2 py-1 text-[11.5px] font-semibold text-paper">
            Parallax · <span className="num">{headcount}</span>
          </div>
          <div className="mx-auto h-3 w-px bg-ink" />
        </div>
      </div>
      <ol className="grid grid-cols-1 gap-px overflow-hidden rounded-[6px] border border-neutral-200 bg-neutral-200 md:grid-cols-2 xl:grid-cols-4">
        {milestones.map((m, i) => {
          const s = status(m);
          const hot = s === "Approaching" || s === "At threshold";
          return (
            <Reveal as="li" key={m.rule} index={i} className={cn("p-5", hot ? "surface-dark bg-ink text-paper" : "bg-paper")}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="num text-[34px] font-bold leading-none tracking-[-0.05em]">{m.at}</p>
                <Badge tone={hot ? "inverse" : s === "Crossed" ? "solid" : "outline"}>{s}</Badge>
              </div>
              <p className={cn("mt-1 text-[12px] font-medium uppercase tracking-[0.1em]", hot ? "text-neutral-400" : "text-neutral-500")}>{m.metric}</p>
              <p className="mt-4 text-[16px] font-bold leading-tight">{m.rule}</p>
              <p className={cn("mt-1 text-[13px] leading-snug", hot ? "text-neutral-400" : "text-neutral-600")}>{m.detail}</p>
              <p className="num mt-4 text-[12.5px]">
                You: <span className="font-bold">{Number.isInteger(m.value) ? m.value : num(m.value, 2)}</span> {m.unit}
              </p>
            </Reveal>
          );
        })}
      </ol>
    </section>
  );
}

// ── ACA projection ───────────────────────────────────────

function AcaProjection() {
  const [hires, setHires] = useState(0);
  const [showMath, setShowMath] = useState(false);
  const p = acaProjection(hires);
  const base = acaProjection(0);

  const bars = p.months.map((m) => ({
    label: monthLabel(m.month),
    value: m.total - m.plannedHires,
    stack: m.plannedHires,
    style: m.projected ? ("hatched" as const) : ("solid" as const),
    title: `${monthLabel(m.month)} 2026${m.projected ? " (projected)" : ""}`,
  }));

  const changes = [
    { title: "Offer of coverage", body: "Offer affordable, minimum-value coverage to at least 95% of full-time employees (30+ hrs/week) and their dependent children." },
    { title: "Affordability test", body: "The employee's cost for the cheapest EE-only plan must stay under the IRS affordability percentage of pay, tested per person." },
    { title: "1095-C reporting", body: "File Forms 1094-C and 1095-C for the 2027 plan year, and furnish a 1095-C to every full-time employee by early 2028." },
  ];

  return (
    <section aria-labelledby="aca-title" className="rounded-[6px] border border-ink">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="p-7 lg:border-r lg:border-ink">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-500">ACA projection · 2026 lookback year</p>
          <h2 id="aca-title" className="mt-2 text-[28px] font-black leading-tight tracking-[-0.03em]">
            Will Parallax be an Applicable Large Employer in 2027?
          </h2>

          <div className="mt-8 grid grid-cols-1 items-end gap-8 sm:grid-cols-[auto_1fr]">
            <div>
              <p className="text-[12px] text-neutral-500">Projected 2026 average</p>
              <p className="num mt-1 text-[84px] font-bold leading-[0.85] tracking-[-0.07em]" aria-live="polite">
                {num(p.average, 2)}
              </p>
              <p className="num mt-2 text-[12.5px] text-neutral-500">
                FTEs · rounds down to <span className="font-bold text-ink">{p.counted}</span> · threshold {ALE_THRESHOLD}
              </p>
            </div>
            <div>
              <label htmlFor="hires" className="flex items-baseline justify-between text-[14px] font-semibold">
                Planned hires before Dec 31
                <span className="num text-[28px] font-bold tracking-[-0.04em]">{hires}</span>
              </label>
              <input
                id="hires"
                type="range"
                min={0}
                max={MAX_HIRES}
                step={1}
                value={hires}
                onChange={(e) => setHires(Number(e.target.value))}
                className="range mt-1 w-full"
                aria-valuetext={`${hires} planned hires, projected average ${num(p.average, 2)} FTEs, ${p.isAle ? "ALE in 2027" : "not an ALE in 2027"}`}
              />
              <div className="num flex justify-between text-[11px] text-neutral-500" aria-hidden>
                {Array.from({ length: MAX_HIRES + 1 }, (_, i) => (
                  <span key={i} className={cn(i === base.hiresToCross && "font-bold text-ink")}>{i}</span>
                ))}
              </div>
              <p className="mt-2 text-[12.5px] text-neutral-500">
                Assumes full-time hires starting Nov 2. Each adds {num(base.perHire, 2)} to the annual average. The line is crossed at {base.hiresToCross}.
              </p>
            </div>
          </div>

          <div className="mt-8">
            <BarChart
              data={bars}
              yMin={40}
              yMax={56}
              threshold={ALE_THRESHOLD}
              thresholdLabel="50 FTE"
              format={(n) => num(n, n % 1 ? 1 : 0)}
              ariaLabel="Monthly full-time equivalent count for 2026, with projected months hatched"
              valueLabel="FTEs"
              height={230}
            />
            <div className="mt-2 flex flex-wrap gap-4 text-[12px] text-neutral-600">
              <span className="flex items-center gap-1.5"><span className="inline-block size-3 bg-ink" aria-hidden /> Actual</span>
              <span className="flex items-center gap-1.5"><span className="inline-block size-3 border border-ink bg-[repeating-linear-gradient(45deg,#000_0_1.5px,#fff_1.5px_4px)]" aria-hidden /> Projected (current roster)</span>
              <span className="flex items-center gap-1.5"><span className="inline-block size-3 border border-dashed border-ink" aria-hidden /> Planned hires</span>
            </div>
          </div>
        </div>

        <motion.div
          className={cn("flex flex-col p-7 transition-colors duration-200", p.isAle ? "surface-dark bg-ink text-paper" : "bg-paper")}
          layout
        >
          <p className={cn("text-[12px] font-semibold uppercase tracking-[0.14em]", p.isAle ? "text-neutral-400" : "text-neutral-500")}>2027 status</p>
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={p.isAle ? "ale" : "not"}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16 }}
              className="mt-3 text-[44px] font-black leading-[0.95] tracking-[-0.045em]"
              aria-live="polite"
            >
              {p.isAle ? "You'll be an ALE in 2027." : "Not an ALE in 2027."}
            </motion.p>
          </AnimatePresence>
          <p className={cn("mt-4 text-[14px] leading-snug", p.isAle ? "text-neutral-300" : "text-neutral-600")}>
            {p.isAle
              ? `With ${plural(hires, "hire")}, your average reaches ${num(p.average, 2)}. These switch on Jan 1, 2027:`
              : `You're ${num(ALE_THRESHOLD - p.average, 2)} FTEs under. If Parallax crosses 50, these switch on Jan 1, 2027:`}
          </p>
          <ul className="mt-5 space-y-4">
            {changes.map((c) => (
              <li key={c.title} className="flex gap-3">
                <span
                  className={cn(
                    "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-[3px] border",
                    p.isAle ? "border-paper bg-paper text-ink" : "border-neutral-300 text-neutral-400",
                  )}
                  aria-hidden
                >
                  {p.isAle ? <Check className="size-3.5" strokeWidth={3} /> : <Minus className="size-3.5" />}
                </span>
                <span>
                  <span className="block text-[14.5px] font-bold">{c.title}</span>
                  <span className={cn("block text-[13px] leading-snug", p.isAle ? "text-neutral-400" : "text-neutral-500")}>{c.body}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className={cn("mt-auto pt-6 text-[12px]", p.isAle ? "text-neutral-400" : "text-neutral-500")}>
            Parallax already offers coverage to full-timers. Marco would review affordability before 2027 contributions are set.
          </p>
        </motion.div>
      </div>

      <div className="border-t border-ink">
        <button
          type="button"
          onClick={() => setShowMath((v) => !v)}
          aria-expanded={showMath}
          aria-controls="aca-math"
          className="flex w-full items-center justify-between px-7 py-4 text-left text-[14px] font-semibold hover:bg-neutral-50"
        >
          How Keel calculated this
          <ChevronDown className={cn("size-4 transition-transform duration-150", showMath && "rotate-180")} aria-hidden />
        </button>
        <AnimatePresence initial={false}>
          {showMath && (
            <motion.div
              id="aca-math"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 gap-8 px-7 pb-7 lg:grid-cols-[320px_1fr]">
                <ol className="space-y-3 text-[13.5px] leading-snug text-neutral-700">
                  <li><span className="num font-bold text-ink">1.</span> Each month, count full-time employees: anyone averaging 30+ hrs/week ({FT_MONTHLY_HOURS}+ hours that month). Part-timers who crossed {FT_MONTHLY_HOURS} hours count as full-time that month.</li>
                  <li><span className="num font-bold text-ink">2.</span> Add part-time equivalents: total part-time hours that month ÷ {FTE_DIVISOR} (each person capped at {FTE_DIVISOR}). Weekly hours × {num(WEEKS_PER_MONTH, 2)} = monthly hours.</li>
                  <li><span className="num font-bold text-ink">3.</span> Average the 12 monthly totals. Nov–Dec use today&apos;s roster and each part-timer&apos;s trailing 3-month hours. Planned hires add {PLANNED_HIRE_MONTHS} months each.</li>
                  <li><span className="num font-bold text-ink">4.</span> Round down. {ALE_THRESHOLD} or more means ALE status for the following year.</li>
                  <li className="text-[12px] text-neutral-500">People count in a month if on payroll on the 15th. Not tax advice; Marco confirms before filing season.</li>
                </ol>
                <div className="scroll-thin overflow-x-auto">
                  <table className="num w-full min-w-[560px] text-[12.5px]">
                    <thead>
                      <tr className="border-b border-ink text-left text-neutral-500">
                        <th scope="col" className="py-1.5 pr-3 font-semibold">Month</th>
                        <th scope="col" className="py-1.5 pr-3 text-right font-semibold">Full-time</th>
                        <th scope="col" className="py-1.5 pr-3 text-right font-semibold">PT ≥130h</th>
                        <th scope="col" className="py-1.5 pr-3 text-right font-semibold">PT hours</th>
                        <th scope="col" className="py-1.5 pr-3 text-right font-semibold">÷120</th>
                        <th scope="col" className="py-1.5 pr-3 text-right font-semibold">Planned</th>
                        <th scope="col" className="py-1.5 text-right font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.months.map((m, i) => (
                        <tr key={m.month} className={cn("border-b border-neutral-100", m.projected && "text-neutral-500")}>
                          <td className="py-1.5 pr-3">{monthName(i)}{m.projected ? "*" : ""}</td>
                          <td className="py-1.5 pr-3 text-right">{m.fullTime}</td>
                          <td className="py-1.5 pr-3 text-right">{m.partTimeAsFullTime}</td>
                          <td className="py-1.5 pr-3 text-right">{num(m.partTimeHours, 0)}</td>
                          <td className="py-1.5 pr-3 text-right">{num(m.fte, 2)}</td>
                          <td className="py-1.5 pr-3 text-right">{m.plannedHires || "–"}</td>
                          <td className="py-1.5 text-right font-semibold text-ink">{num(m.total, 2)}</td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan={6} className="pt-2.5 pr-3 text-right font-semibold">Sum {num(p.months.reduce((s, m) => s + m.total, 0), 2)} ÷ {ACA_YEAR_MONTHS.length} =</td>
                        <td className="pt-2.5 text-right text-[15px] font-bold">{num(p.average, 2)}</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="mt-2 text-[11.5px] text-neutral-500">* Projected</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

// ── Oregon alert + state map ─────────────────────────────

function OregonAlert() {
  const state = useDemoState();
  const elena = employeeById[STORY.elena];
  const filed = !!state.done["oregon-registrations"];
  const items = complianceViews(state.done).filter((c) => c.state === "OR");
  const counts = employees
    .filter((e) => e.status === "Active")
    .reduce<Record<string, number>>((m, e) => ((m[e.state] = (m[e.state] ?? 0) + 1), m), {});
  const stateCount = Object.keys(counts).length;

  return (
    <section aria-labelledby="or-title">
      <SectionTitle id="or-title" right={<Badge tone="solid">New state</Badge>}>
        New-state alerts
      </SectionTitle>
      <div className="rounded-[6px] border border-neutral-200 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[34px] font-black leading-none tracking-[-0.04em]">Oregon</p>
            <p className="mt-2 text-[14px] text-neutral-600">
              First employee: <Link href={`/employees?id=${elena.id}`} className="font-semibold text-ink underline-offset-2 hover:underline">{fullName(elena)}</Link>, {elena.city}, started{" "}
              <span className="num">{fmtShort(elena.hireDate)}</span>
            </p>
          </div>
          <p className="num text-right text-[12px] text-neutral-500">
            {stateCount} states
            <br />
            {employees.filter((e) => e.status === "Active").length} employees
          </p>
        </div>

        <ul className="mt-6 divide-y divide-neutral-200 border-y border-neutral-200">
          {items.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-4 py-3">
              <span>
                <span className="block text-[14px] font-semibold">{c.title}</span>
                <span className="block text-[12.5px] text-neutral-500">{c.rule}</span>
              </span>
              <Status kind={c.effectiveStatus === "Done" ? "done" : "urgent"}>
                {c.effectiveStatus === "Done" ? "Filed" : `Overdue · ${fmtShort(c.dueDate!)}`}
              </Status>
            </li>
          ))}
          <li className="flex items-center justify-between gap-4 py-3">
            <span>
              <span className="block text-[14px] font-semibold">Carrier network check</span>
              <span className="block text-[12.5px] text-neutral-500">Meridian, Brightline, ClearView cover Oregon</span>
            </span>
            <Status kind="done">Done</Status>
          </li>
          <li className="flex items-center justify-between gap-4 py-3">
            <span>
              <span className="block text-[14px] font-semibold">Dental enrollment at Brightline</span>
              <span className="block text-[12.5px] text-neutral-500">Deducted in payroll, missing from invoice</span>
            </span>
            <Link href="/savings?finding=F-1053" className="inline-flex items-center gap-1 text-[13px] font-semibold underline-offset-2 hover:underline">
              In Savings <ArrowUpRight className="size-3.5" aria-hidden />
            </Link>
          </li>
        </ul>

        <div className="mt-5">
          {filed ? (
            <p className="flex items-center gap-2 text-[14px] font-semibold">
              <Check className="size-4" aria-hidden /> Keel filed all three registrations at {state.done["oregon-registrations"].at}. Confirmations in 3–5 business days.
            </p>
          ) : (
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                approve("oregon-registrations");
                toast(actionById["oregon-registrations"].toast);
              }}
            >
              <Check className="size-4" aria-hidden /> Approve: Keel files registrations
            </Button>
          )}
        </div>

        <div className="mt-8">
          <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Employees by state</p>
          <TileMap counts={counts} highlight="OR" />
        </div>
      </div>
    </section>
  );
}

// ── Part-time watch ──────────────────────────────────────

function PartTimeWatch() {
  const sam = employeeById[STORY.sam];
  const hours = sam.weeklyHoursByMonth ?? [];
  const recent = recentAverage(sam);
  const partTimers = employees.filter((e) => e.status === "Active" && e.type === "Part-time");
  return (
    <section aria-labelledby="pt-title">
      <SectionTitle id="pt-title" right={<Badge tone="outline">{plural(partTimers.length, "part-timer")}</Badge>}>
        Part-time watch
      </SectionTitle>
      <div className="rounded-[6px] border border-neutral-200 p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[24px] font-black tracking-[-0.03em]">{fullName(sam)}</p>
            <p className="text-[13.5px] text-neutral-600">{sam.title} · {sam.city}, {sam.state}</p>
          </div>
          <div className="text-right">
            <p className="num text-[44px] font-bold leading-none tracking-[-0.06em]">{num(recent, 1)}</p>
            <p className="text-[12px] text-neutral-500">avg hrs/week, last 3 months</p>
          </div>
        </div>
        <div className="mt-6">
          <LineChart
            points={hours.map((h, i) => ({ label: monthName(i), value: h }))}
            yMin={15}
            yMax={36}
            threshold={30}
            thresholdLabel="30 hrs/week · ACA full-time"
            format={(n) => num(n, 0)}
            ariaLabel={`${fullName(sam)} average weekly hours by month, 2026, against the 30 hour line`}
            projectedFrom={hours.length - 2}
            width={520}
            height={260}
          />
        </div>
        <p className="mt-4 rounded-[4px] bg-neutral-100 px-4 py-3 text-[13.5px] leading-snug">
          <span className="font-semibold">Keel:</span> Sam has averaged {num(recent, 1)} hrs/week since March. If the trend holds, he counts as full-time for ACA purposes, which matters for the offer-of-coverage rule once Parallax is an ALE. Consider offering benefits or capping hours. Oct is month-to-date.
        </p>
        <table className="mt-6 w-full text-[13.5px]">
          <caption className="sr-only">Part-time employees and recent hours</caption>
          <thead>
            <tr className="border-b border-neutral-200 text-left text-[12px] text-neutral-500">
              <th scope="col" className="py-2 font-semibold">Part-timer</th>
              <th scope="col" className="py-2 text-right font-semibold">Avg hrs/wk (3 mo)</th>
              <th scope="col" className="py-2 text-right font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {partTimers.map((e) => {
              const avg = recentAverage(e);
              return (
                <tr key={e.id} className="border-b border-neutral-100">
                  <td className="py-2.5">
                    <Link href={`/employees?id=${e.id}`} className="font-semibold hover:underline">{fullName(e)}</Link>
                  </td>
                  <td className="num py-2.5 text-right">{num(avg, 1)}</td>
                  <td className="py-2.5 text-right">
                    {avg >= 30 ? <Status kind="pending">Over 30: watch</Status> : <Status kind="neutral">Under 30</Status>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
