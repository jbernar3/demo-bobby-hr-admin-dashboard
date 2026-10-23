"use client";

import { ShieldAlert } from "lucide-react";
import { employees } from "@/data/employees";
import { largeClaimants } from "@/data/claims";
import {
  accountsAdmin,
  carriers,
  dentalPlan,
  levelFunded,
  LIFE_RATE_PER_EMPLOYEE,
  lifeDisability,
  medicalContribution,
  medicalPlans,
  TIER_LABEL,
  TIERS,
  visionPlan,
} from "@/data/plans";
import { enrolledTier, lifeCovered, medicalSplit, monthlyPremium } from "@/lib/billing";
import { CURRENT_MONTH, fmtDate, monthLabel, monthLabelLong } from "@/lib/dates";
import { cn, money, moneyK, plural } from "@/lib/format";
import { levelFundedSummary, spendTrend } from "@/lib/levelFunded";
import type { Tier } from "@/lib/types";
import { BarChart, LineChart } from "../charts";
import { RenewalOptions } from "./RenewalOptions";
import { Badge, CountUp, PageHeader, Reveal, SectionTitle } from "../ui";
import { platform } from "@/data/company";

function split(rates: Record<Tier, number>, tier: Tier, eePct: number, depPct: number) {
  const employer = rates.EE * eePct + (rates[tier] - rates.EE) * depPct;
  return { employer, employee: rates[tier] - employer };
}

/** Employer vs employee share of this month's expected premium. */
function currentShares() {
  let employer = 0;
  let employee = 0;
  for (const e of employees) {
    const med = enrolledTier(e, "medical", CURRENT_MONTH);
    const plan = medicalPlans.find((p) => p.id === e.coverage.medical?.plan);
    if (med && plan) {
      const s = medicalSplit(plan.rates, med);
      employer += s.employer;
      employee += s.employee;
    }
    const den = enrolledTier(e, "dental", CURRENT_MONTH);
    if (den) {
      const s = split(dentalPlan.rates, den, dentalPlan.contribution.employeeOnlyPct, dentalPlan.contribution.dependentPct);
      employer += s.employer;
      employee += s.employee;
    }
    const vis = enrolledTier(e, "vision", CURRENT_MONTH);
    if (vis) {
      const s = split(visionPlan.rates, vis, visionPlan.contribution.employeeOnlyPct, visionPlan.contribution.dependentPct);
      employer += s.employer;
      employee += s.employee;
    }
    if (lifeCovered(e, CURRENT_MONTH)) employer += LIFE_RATE_PER_EMPLOYEE;
  }
  return { employer, employee };
}

export function PlanView() {
  const trend = spendTrend();
  const total = monthlyPremium(CURRENT_MONTH);
  const lines = ["medical", "dental", "vision"] as const;
  const covered = employees.filter(
    (e) => lines.some((l) => enrolledTier(e, l, CURRENT_MONTH)) || lifeCovered(e, CURRENT_MONTH),
  ).length;
  const perEmployee = total / covered;
  const shares = currentShares();
  const lf = levelFundedSummary();
  const first = trend[0].total;
  const change = (total - first) / first;

  return (
    <div>
      <PageHeader
        eyebrow="Plan & Costs · renews Jan 1"
        title={
          <>
            <CountUp id="plan-total" value={total} format={(n) => money(n)} className="tracking-[-0.07em]" />
            <span className="text-neutral-400"> / mo</span>
          </>
        }
        sub={`Total benefits premium for ${monthLabelLong(CURRENT_MONTH)} across ${Object.keys(carriers).length - 1} carriers. Parallax pays ${Math.round((shares.employer / (shares.employer + shares.employee)) * 100)}%.`}
      />

      <RenewalOptions />

      <section aria-label="Cost summary" className="mb-14 grid grid-cols-1 border border-ink lg:grid-cols-[1fr_1fr_1fr_1.6fr]">
        <Stat label="Annualized" value={money(total * 12)} />
        <Stat label="Per covered employee" value={money(perEmployee)} note={`${covered} covered employees`} />
        <Stat label="Employer / employee" value={`${moneyK(shares.employer)} / ${moneyK(shares.employee)}`} small note="Monthly, at current elections" />
        <div className="p-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Monthly spend, 2026</p>
          <p className="num mt-1 text-[12.5px] text-neutral-500">{change < 0 ? "−" : "+"}{Math.abs(change * 100).toFixed(1)}% since January (headcount + tier changes)</p>
          <LineChart
            points={trend.map((t) => ({ label: monthLabel(t.month), value: t.total }))}
            yMin={60000}
            yMax={85000}
            format={(n) => `$${Math.round(n / 1000)}k`}
            ariaLabel="Total monthly benefits spend, January to June 2026"
            height={150}
            width={520}
          />
        </div>
      </section>

      {/* ── Level-funded panel ─────────────────────────── */}
      <section aria-labelledby="lf-title" className="mb-16">
        <SectionTitle id="lf-title" right={<span className="num text-[12px] text-neutral-500">Meridian report · {fmtDate(lf.reportDate)}</span>}>
          Level-funded medical · claims vs. fund
        </SectionTitle>
        <div className="grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <BarChart
              data={lf.months.map((m) => ({
                label: monthLabel(m.month),
                value: m.claims,
                reference: m.fund,
                style: m.claims > m.fund ? "hatched" : "solid",
                title: monthLabelLong(m.month),
              }))}
              yMax={60000}
              format={(n) => `$${Math.round(n / 1000)}k`}
              ariaLabel="Monthly paid claims versus the claims fund, January to May 2026"
              valueLabel="Claims"
              referenceLabel="Claims fund"
              height={280}
            />
            <div className="mt-2 flex flex-wrap gap-5 text-[12px] text-neutral-600">
              <span className="flex items-center gap-1.5"><span className="inline-block size-3 bg-ink" aria-hidden /> Paid claims</span>
              <span className="flex items-center gap-1.5"><span className="inline-block size-3 border border-dashed border-neutral-500" aria-hidden /> Claims fund ({Math.round(levelFunded.claimsFundPct * 100)}% of premium)</span>
              <span className="flex items-center gap-1.5"><span className="inline-block size-3 border border-ink bg-[repeating-linear-gradient(45deg,#000_0_1.5px,#fff_1.5px_4px)]" aria-hidden /> Month over fund (covered by surplus)</span>
            </div>

            <div className="mt-8">
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Where each medical premium dollar goes · {monthLabel(CURRENT_MONTH)}</p>
              <div className="flex h-10 w-full overflow-hidden rounded-[4px] border border-ink text-[12px] font-semibold">
                <div className="flex items-center bg-ink px-3 text-paper" style={{ width: `${levelFunded.claimsFundPct * 100}%` }}>
                  Claims fund <span className="num ml-auto font-medium">{money(lf.currentFund)}</span>
                </div>
                <div className="flex items-center border-l border-ink bg-[repeating-linear-gradient(45deg,#000_0_1px,#fff_1px_5px)] px-3" style={{ width: `${levelFunded.stopLossPct * 100}%` }}>
                  <span className="bg-paper px-1">Stop-loss <span className="num font-medium">{money(lf.stopLoss)}</span></span>
                </div>
                <div className="flex items-center border-l border-ink px-2" style={{ width: `${levelFunded.adminFeePct * 100}%` }} title={`Admin fee ${money(lf.adminFee)}`}>
                  <span className="truncate">Admin</span>
                </div>
              </div>
              <p className="num mt-2 text-[12px] text-neutral-500">Admin fee {money(lf.adminFee)} · {Math.round(levelFunded.adminFeePct * 100)}%</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="surface-dark rounded-[6px] bg-ink p-6 text-paper">
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-400">Projected year-end surplus</p>
              <p className="num mt-3 text-[44px] font-bold leading-none tracking-[-0.06em]">{money(lf.projected)}</p>
              <p className="num mt-2 text-[13px] text-neutral-400">80% range {money(lf.low)} – {money(lf.high)}</p>
              <div className="relative mt-4 h-1.5 rounded-full bg-neutral-700" aria-hidden>
                <div className="absolute inset-y-0 rounded-full bg-neutral-400" style={{ left: "10%", right: "10%" }} />
                <div className="absolute -top-1 h-3.5 w-0.5 bg-paper" style={{ left: "50%" }} />
              </div>
              <p className="mt-4 text-[13px] leading-snug text-neutral-400">
                Meridian refunds {Math.round(levelFunded.surplusRefundPct * 100)}% of surplus after run-out: about <span className="num text-paper">{money(lf.refundEstimate)}</span>.
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[6px] border border-neutral-200 bg-neutral-200">
              <Cell label="YTD claims fund" value={money(lf.ytdFund)} />
              <Cell label="YTD paid claims" value={money(lf.ytdClaims)} />
              <Cell label="Fund used" value={`${Math.round(lf.lossRatio * 100)}%`} />
              <Cell label="Specific deductible" value={money(levelFunded.specificDeductible)} />
            </dl>
            <div className="rounded-[6px] border border-ink p-5">
              <p className="flex items-center gap-2 text-[14px] font-bold">
                <ShieldAlert className="size-4" aria-hidden />
                {plural(lf.flaggedCount, "claimant")} over 50% of the specific deductible
              </p>
              <p className="mt-1 text-[13px] leading-snug text-neutral-600">
                Largest is at {Math.round(lf.topPctOfDeductible * 100)}% of {money(levelFunded.specificDeductible)}. Stop-loss pays above that. De-identified: {platform.name} never sees or shows names or conditions.
              </p>
              <ul className="mt-3 space-y-1.5">
                {largeClaimants.map((c) => (
                  <li key={c.label} className="flex items-center gap-3 text-[12.5px]">
                    <span className="w-[76px] text-neutral-600">{c.label}</span>
                    <span className="relative h-1.5 flex-1 rounded-full bg-neutral-100">
                      <span className="absolute inset-y-0 left-0 rounded-full bg-ink" style={{ width: `${Math.min(100, (c.paidToDate / levelFunded.specificDeductible) * 100)}%` }} />
                      <span className="absolute -top-1 h-3.5 w-px bg-neutral-400" style={{ left: "50%" }} />
                    </span>
                    <span className="num w-[34px] text-right">{Math.round((c.paidToDate / levelFunded.specificDeductible) * 100)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Plan cards ─────────────────────────────────── */}
      <section aria-labelledby="plans-title">
        <SectionTitle id="plans-title">Plans &amp; rates · monthly</SectionTitle>
        <Reveal className="mb-6 rounded-[6px] border border-neutral-200">
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-neutral-200 px-6 py-4">
            <div>
              <p className="text-[20px] font-black tracking-[-0.02em]">Medical · {carriers.meridian.name}</p>
              <p className="text-[13px] text-neutral-500">
                Level-funded · employer pays {Math.round(medicalContribution.employeeOnlyPct * 100)}% of EE-only and {Math.round(medicalContribution.dependentPct * 100)}% of dependent premium
              </p>
            </div>
            <Badge tone="solid">Renews Jan 1 · rates flat</Badge>
          </div>
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full min-w-[780px] text-[13.5px]">
              <thead>
                <tr className="text-left text-[12px] text-neutral-500">
                  <th scope="col" className="px-6 py-3 font-semibold">Plan</th>
                  {TIERS.map((t) => (
                    <th key={t} scope="col" className="px-3 py-3 text-right font-semibold">{TIER_LABEL[t]}</th>
                  ))}
                  <th scope="col" className="px-6 py-3 text-right font-semibold">Enrolled</th>
                </tr>
              </thead>
              <tbody>
                {medicalPlans.map((p) => {
                  const enrolledCount = employees.filter((e) => e.coverage.medical?.plan === p.id && enrolledTier(e, "medical", CURRENT_MONTH)).length;
                  return (
                    <tr key={p.id} className="border-t border-neutral-100 align-top">
                      <td className="px-6 py-3">
                        <span className="block font-bold">{p.name}</span>
                        <span className="num block text-[12px] text-neutral-500">
                          Ded {money(p.deductible)} · OOP {money(p.oopMax)} · {p.coinsurance} · PCP {p.pcpCopay}
                        </span>
                      </td>
                      {TIERS.map((t) => {
                        const s = medicalSplit(p.rates, t);
                        return (
                          <td key={t} className="num px-3 py-3 text-right">
                            <span className="block font-semibold">{money(s.total)}</span>
                            <span className="block text-[11.5px] text-neutral-500">EE pays {money(s.employee)}</span>
                          </td>
                        );
                      })}
                      <td className="num px-6 py-3 text-right font-semibold">{enrolledCount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-4">
          <SmallPlan
            index={1}
            line="Dental"
            carrier={carriers.brightline.name}
            details={[dentalPlan.coverage + " coinsurance", `Annual max ${money(dentalPlan.annualMax)}`, `Ortho ${dentalPlan.orthodontia}`]}
            rates={dentalPlan.rates}
            contribution={`Employer pays ${Math.round(dentalPlan.contribution.employeeOnlyPct * 100)}% EE / ${Math.round(dentalPlan.contribution.dependentPct * 100)}% dependents`}
          />
          <SmallPlan
            index={2}
            line="Vision"
            carrier={carriers.clearview.name}
            details={[`Exam ${visionPlan.exam}`, `Frames ${visionPlan.frames}`, `Contacts ${visionPlan.contacts}`]}
            rates={visionPlan.rates}
            contribution={`Employer pays ${Math.round(visionPlan.contribution.employeeOnlyPct * 100)}% EE only`}
            cents
          />
          <Reveal index={3} className="rounded-[6px] border border-neutral-200 p-5">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Life + Disability</p>
            <p className="mt-1 text-[17px] font-black tracking-[-0.02em]">{carriers.anchor.name}</p>
            <ul className="mt-4 space-y-3 text-[13px]">
              {Object.values(lifeDisability).map((l) => (
                <li key={l.name} className="flex justify-between gap-3">
                  <span>
                    <span className="block font-semibold">{l.name}</span>
                    <span className="block text-neutral-500">{l.benefit}</span>
                  </span>
                  <span className="num shrink-0">{money(l.ratePerEmployee, { cents: true })}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-neutral-100 pt-3 text-[12.5px] text-neutral-500">Employer-paid · per employee per month</p>
          </Reveal>
          <Reveal index={4} className="rounded-[6px] border border-neutral-200 p-5">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-500">FSA / HSA + COBRA admin</p>
            <p className="mt-1 text-[17px] font-black tracking-[-0.02em]">{carriers.keystone.name}</p>
            <ul className="mt-4 space-y-3 text-[13px]">
              <li><span className="block font-semibold">HSA</span><span className="text-neutral-500">{accountsAdmin.hsa}</span></li>
              <li><span className="block font-semibold">FSA</span><span className="text-neutral-500">{accountsAdmin.fsa}</span></li>
              <li><span className="block font-semibold">COBRA</span><span className="text-neutral-500">{accountsAdmin.cobra}</span></li>
            </ul>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, note, small }: { label: string; value: string; note?: string; small?: boolean }) {
  return (
    <div className="border-b border-ink p-6 lg:border-b-0 lg:border-r">
      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-500">{label}</p>
      <p className={cn("num mt-3 font-bold leading-none tracking-[-0.05em]", small ? "text-[24px]" : "text-[30px]")}>{value}</p>
      {note && <p className="mt-2 text-[12.5px] text-neutral-500">{note}</p>}
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-paper p-4">
      <dt className="text-[12px] text-neutral-500">{label}</dt>
      <dd className="num mt-1 text-[19px] font-bold tracking-[-0.03em]">{value}</dd>
    </div>
  );
}

function SmallPlan({
  index,
  line,
  carrier,
  details,
  rates,
  contribution,
  cents,
}: {
  index: number;
  line: string;
  carrier: string;
  details: string[];
  rates: Record<Tier, number>;
  contribution: string;
  cents?: boolean;
}) {
  return (
    <Reveal index={index} className="rounded-[6px] border border-neutral-200 p-5">
      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-500">{line}</p>
      <p className="mt-1 text-[17px] font-black tracking-[-0.02em]">{carrier}</p>
      <ul className="mt-3 space-y-0.5 text-[12.5px] text-neutral-600">
        {details.map((d) => (
          <li key={d}>{d}</li>
        ))}
      </ul>
      <table className="mt-4 w-full text-[13px]">
        <tbody>
          {TIERS.map((t) => (
            <tr key={t} className="border-t border-neutral-100">
              <th scope="row" className="py-1.5 text-left font-medium text-neutral-600">{TIER_LABEL[t]}</th>
              <td className={cn("num py-1.5 text-right font-semibold")}>{cents ? money(rates[t], { cents: true }) : money(rates[t])}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 border-t border-neutral-100 pt-3 text-[12.5px] text-neutral-500">{contribution}</p>
    </Reveal>
  );
}
