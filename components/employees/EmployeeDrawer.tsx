"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { fullName, initials } from "@/data/employees";
import { lifeEvents } from "@/data/enrollment";
import { dentalPlan, LIFE_RATE_PER_EMPLOYEE, medicalPlans, TIER_LABEL, visionPlan } from "@/data/plans";
import { recentAverage } from "@/lib/aca";
import { agedOffBy, coverageEffective, medicalSplit } from "@/lib/billing";
import { ageOn, DEMO_TODAY, fmtDate, fmtShort } from "@/lib/dates";
import { cn, money } from "@/lib/format";
import { employeeFlags } from "@/lib/flags";
import { useDemoState } from "@/lib/store";
import type { Employee } from "@/lib/types";
import { Avatar, Badge, Drawer, Meta } from "../ui";
import { medicalLabel } from "./labels";
import { platform } from "@/data/company";

export function EmployeeDrawer({ employee, onClose }: { employee: Employee | null; onClose: () => void }) {
  return (
    <Drawer
      open={!!employee}
      onClose={onClose}
      width={600}
      title={
        employee ? (
          <div className="flex items-center gap-4">
            <Avatar initials={initials(employee)} size={48} />
            <div>
              <h2 className="text-[24px] font-black leading-tight tracking-[-0.03em]">{fullName(employee)}</h2>
              <p className="text-[13.5px] text-neutral-600">
                {employee.title} · {employee.department}
              </p>
            </div>
          </div>
        ) : null
      }
    >
      {employee && <EmployeeBody e={employee} />}
    </Drawer>
  );
}

function EmployeeBody({ e }: { e: Employee }) {
  const state = useDemoState();
  const flags = employeeFlags(e, state.done);
  const events = lifeEvents.filter((l) => l.employeeId === e.id);
  const plan = e.coverage.medical ? medicalPlans.find((p) => p.id === e.coverage.medical!.plan) : undefined;
  const split = plan && e.coverage.medical ? medicalSplit(plan.rates, e.coverage.medical.tier) : undefined;
  const lifeCovered = e.type === "Full-time" && e.status === "Active" && coverageEffective(e) <= DEMO_TODAY;

  return (
    <div className="space-y-8">
      {flags.length > 0 && (
        <section aria-labelledby="flags-title" className="surface-dark rounded-[6px] bg-ink p-5 text-paper">
          <h3 id="flags-title" className="mb-3 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em] text-neutral-400">
            <span className="inline-flex size-5 items-center justify-center rounded-[3px] bg-paper text-[11px] font-black text-ink" aria-hidden>{platform.monogram}</span>
            {platform.name} flags
          </h3>
          <ul className="space-y-3">
            {flags.map((f) => (
              <li key={f.id}>
                <Link href={f.href ?? "#"} className="group flex items-start gap-3">
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", f.resolved ? "border border-neutral-500" : f.urgent ? "bg-signal" : "bg-paper")} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className={cn("block text-[14.5px] font-semibold group-hover:underline", f.resolved && "text-neutral-400 line-through")}>{f.text}</span>
                    {f.detail && <span className="block text-[12.5px] leading-snug text-neutral-400">{f.detail}</span>}
                  </span>
                  <ArrowUpRight className="mt-1 size-3.5 shrink-0 text-neutral-500" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="profile-title">
        <h3 id="profile-title" className="mb-3 border-b border-ink pb-2 text-[12px] font-bold uppercase tracking-[0.12em]">Profile</h3>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
          <Meta label="Location">{e.city}, {e.state}</Meta>
          <Meta label="Hired"><span className="num">{fmtDate(e.hireDate)}</span></Meta>
          <Meta label="Type">
            {e.type}
            {e.type === "Part-time" && <span className="num block text-[12.5px] text-neutral-500">{recentAverage(e).toFixed(1)} hrs/wk (3 mo avg)</span>}
          </Meta>
          <Meta label="Status">
            {e.status}
            {e.terminationDate && <span className="num block text-[12.5px] text-neutral-500">Terminated {fmtDate(e.terminationDate)}</span>}
          </Meta>
          <Meta label="Work email" className="col-span-2"><span className="num text-[13px]">{e.email}</span></Meta>
        </dl>
      </section>

      <section aria-labelledby="cov-title">
        <h3 id="cov-title" className="mb-3 border-b border-ink pb-2 text-[12px] font-bold uppercase tracking-[0.12em]">Coverage</h3>
        <table className="w-full text-[13.5px]">
          <thead>
            <tr className="text-left text-[12px] text-neutral-500">
              <th scope="col" className="pb-2 font-semibold">Line</th>
              <th scope="col" className="pb-2 font-semibold">Plan · tier</th>
              <th scope="col" className="pb-2 text-right font-semibold">Monthly</th>
              <th scope="col" className="pb-2 text-right font-semibold">Employee pays</th>
            </tr>
          </thead>
          <tbody className="[&_td]:border-t [&_td]:border-neutral-100 [&_td]:py-2.5">
            <tr>
              <td className="font-semibold">Medical</td>
              <td>{plan && e.coverage.medical ? `Meridian ${plan.name} · ${TIER_LABEL[e.coverage.medical.tier]}` : <span className="text-neutral-500">{medicalLabel(e).text}</span>}</td>
              <td className="num text-right">{split ? money(split.total, { cents: true }) : "—"}</td>
              <td className="num text-right">{split ? money(split.employee, { cents: true }) : "—"}</td>
            </tr>
            <tr>
              <td className="font-semibold">Dental</td>
              <td>{e.coverage.dental ? `Brightline PPO · ${TIER_LABEL[e.coverage.dental]}` : <span className="text-neutral-500">Not enrolled</span>}</td>
              <td className="num text-right">{e.coverage.dental ? money(dentalPlan.rates[e.coverage.dental], { cents: true }) : "—"}</td>
              <td className="num text-right">
                {e.coverage.dental
                  ? money(
                      dentalPlan.rates[e.coverage.dental] -
                        (dentalPlan.rates.EE * dentalPlan.contribution.employeeOnlyPct +
                          (dentalPlan.rates[e.coverage.dental] - dentalPlan.rates.EE) * dentalPlan.contribution.dependentPct),
                      { cents: true },
                    )
                  : "—"}
              </td>
            </tr>
            <tr>
              <td className="font-semibold">Vision</td>
              <td>{e.coverage.vision ? `ClearView · ${TIER_LABEL[e.coverage.vision]}` : <span className="text-neutral-500">Not enrolled</span>}</td>
              <td className="num text-right">{e.coverage.vision ? money(visionPlan.rates[e.coverage.vision], { cents: true }) : "—"}</td>
              <td className="num text-right">{e.coverage.vision ? money(visionPlan.rates[e.coverage.vision] - visionPlan.rates.EE, { cents: true }) : "—"}</td>
            </tr>
            <tr>
              <td className="font-semibold">Life + Disability</td>
              <td>{lifeCovered ? "Anchor · Basic Life/AD&D, STD, LTD" : <span className="text-neutral-500">Not covered</span>}</td>
              <td className="num text-right">{lifeCovered ? money(LIFE_RATE_PER_EMPLOYEE, { cents: true }) : "—"}</td>
              <td className="num text-right">{lifeCovered ? "$0.00" : "—"}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section aria-labelledby="dep-title">
        <h3 id="dep-title" className="mb-3 border-b border-ink pb-2 text-[12px] font-bold uppercase tracking-[0.12em]">
          Dependents <span className="num text-neutral-500">{e.dependents.length}</span>
        </h3>
        {e.dependents.length === 0 ? (
          <p className="text-[13.5px] text-neutral-500">No dependents on file.</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {e.dependents.map((d) => {
              const aged = d.relationship === "Child" && agedOffBy(d.dob, DEMO_TODAY);
              return (
                <li key={d.name} className="flex items-center justify-between gap-4 py-2.5">
                  <span>
                    <span className="block text-[14px] font-semibold">{d.name}</span>
                    <span className="text-[12.5px] text-neutral-500">
                      {d.relationship}
                      {d.addedOn && ` · added ${fmtShort(d.addedOn)}`}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    {aged && <Badge tone="solid">Aged out</Badge>}
                    <span className="num text-[12.5px] text-neutral-600">
                      DOB {fmtDate(d.dob)} · {ageOn(d.dob, DEMO_TODAY)}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="le-title">
        <h3 id="le-title" className="mb-3 border-b border-ink pb-2 text-[12px] font-bold uppercase tracking-[0.12em]">Recent life events</h3>
        {events.length === 0 ? (
          <p className="text-[13.5px] text-neutral-500">None in 2026.</p>
        ) : (
          <ul className="space-y-3">
            {events.map((l) => (
              <li key={l.id} className="text-[13.5px]">
                <p className="font-semibold">
                  {l.type} · <span className="num font-normal">{fmtDate(l.eventDate)}</span>{" "}
                  <Badge tone={l.status === "Completed" || (l.actionId && state.done[l.actionId]) ? "muted" : "outline"} className="ml-1">
                    {l.status === "Completed" || (l.actionId && state.done[l.actionId]) ? "Completed" : "Pending"}
                  </Badge>
                </p>
                <p className="mt-0.5 leading-snug text-neutral-600">{l.description}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
