"use client";

import { ArrowRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { employeeById, fullName } from "@/data/employees";
import { findings } from "@/data/findings";
import { carriers } from "@/data/plans";
import { BILLING_MONTHS, carrierMonth, type CarrierMonth, findingImpact, LINES } from "@/lib/billing";
import { fmtDate, LAST_RECONCILIATION, monthLabel, monthLabelLong } from "@/lib/dates";
import { cn, money, moneyK, plural } from "@/lib/format";
import { findingStatus, metrics, statusKind } from "@/lib/selectors";
import { useDemoState } from "@/lib/store";
import type { Finding, FindingStatus } from "@/lib/types";
import { CountUp, PageHeader, SectionTitle, Segmented, Status, WorkingDot } from "../ui";
import { FindingDrawer } from "./FindingDrawer";

type CellStatus = "Matched" | "Discrepancy" | "Credit pending";

function cellStatus(cm: CarrierMonth, done: ReturnType<typeof useDemoState>["done"]): { status: CellStatus; credited: boolean } {
  const statuses = cm.findings.map((f) => findingStatus(f, done));
  if (statuses.includes("Open")) return { status: "Discrepancy", credited: false };
  if (statuses.some((s) => s === "Credit requested" || s === "Correction requested")) return { status: "Credit pending", credited: false };
  return { status: "Matched", credited: statuses.includes("Recovered") };
}

type Filter = "open" | "progress" | "resolved" | "all";

export function SavingsView() {
  const state = useDemoState();
  const m = metrics(state.done);
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const selectedId = params.get("finding");
  const selected = findings.find((f) => f.id === selectedId) ?? null;
  const [filter, setFilter] = useState<Filter>("all");
  const [cell, setCell] = useState<{ line: (typeof LINES)[number]; month: string }>({
    line: "medical",
    month: BILLING_MONTHS[BILLING_MONTHS.length - 1],
  });

  const openFinding = (id: string | null) => {
    const q = new URLSearchParams(params.toString());
    if (id) q.set("finding", id);
    else q.delete("finding");
    const qs = q.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const rows = findings
    .map((f) => ({ f, status: findingStatus(f, state.done), impact: findingImpact(f) }))
    .filter(({ status }) =>
      filter === "all"
        ? true
        : filter === "open"
          ? status === "Open"
          : filter === "resolved"
            ? status === "Recovered"
            : status === "Credit requested" || status === "Correction requested",
    )
    .sort((a, b) => {
      const rank = (s: FindingStatus) => ({ Open: 0, "Credit requested": 1, "Correction requested": 1, Recovered: 2 })[s];
      return rank(a.status) - rank(b.status) || Math.abs(b.impact) - Math.abs(a.impact);
    });

  const selectedCell = carrierMonth(cell.line, cell.month);

  return (
    <div>
      <PageHeader
        eyebrow="Savings · Leakage monitor"
        title={
          <>
            <CountUp id="savings-recovered" value={m.recoveredYtd} format={(n) => money(n)} className="tracking-[-0.07em]" />
            <br />
            recovered.
          </>
        }
        sub="Bobby reconciles every invoice against payroll and your HRIS each month. Industry data suggests ~5% of premium spend is lost to billing errors."
      />

      <section aria-label="Savings summary" className="mb-14 grid grid-cols-2 border-y border-ink lg:grid-cols-4">
        <Kpi label="Recovered YTD" value={money(m.recoveredYtd)} />
        <Kpi label="Pending credit" value={money(m.pendingCredit)} note={m.pendingCredit ? "Requested from carriers" : "Approve a request to start"} />
        <Kpi
          label="Open findings"
          value={String(m.openFindings)}
          note={`${money(m.openOverbilled)} overbilled · ${money(m.openOwed)} owed`}
          accent={m.openFindings > 0}
        />
        <Kpi
          label="Last reconciliation"
          value={`${fmtDate(LAST_RECONCILIATION.date).replace(", 2026", "")}, ${LAST_RECONCILIATION.time}`}
          note={
            <span className="inline-flex items-center gap-2">
              <WorkingDot /> Next run tonight
            </span>
          }
          small
        />
      </section>

      {/* ── Three-way match ──────────────────────────────── */}
      <section aria-labelledby="match-title" className="mb-14">
        <SectionTitle
          id="match-title"
          right={
            <div className="hidden items-center gap-4 text-[12px] text-neutral-600 md:flex">
              <LegendSwatch kind="Matched" /> Matched
              <LegendSwatch kind="Discrepancy" /> Discrepancy
              <LegendSwatch kind="Credit pending" /> Credit pending
            </div>
          }
        >
          Three-way match · HRIS × Payroll × Invoice
        </SectionTitle>

        <div className="scroll-thin overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-[12px]">
            <thead>
              <tr>
                <th scope="col" className="w-[150px] pb-2 text-left font-semibold text-neutral-500">
                  Carrier
                </th>
                {BILLING_MONTHS.map((ym) => (
                  <th key={ym} scope="col" className="num pb-2 text-left font-medium text-neutral-500">
                    {monthLabel(ym)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LINES.map((line) => {
                const carrier = carriers[carrierMonth(line, BILLING_MONTHS[0]).carrierId];
                return (
                  <tr key={line}>
                    <th scope="row" className="border-t border-neutral-200 py-1.5 pr-3 text-left align-middle">
                      <span className="block text-[13.5px] font-bold">{carrier.shortName}</span>
                      <span className="block text-[11.5px] font-normal text-neutral-500">{carrier.line}</span>
                    </th>
                    {BILLING_MONTHS.map((ym) => {
                      const cm = carrierMonth(line, ym);
                      const { status, credited } = cellStatus(cm, state.done);
                      const diff = cm.invoice.amount - cm.hris.amount;
                      const isSel = cell.line === line && cell.month === ym;
                      return (
                        <td key={ym} className="border-t border-neutral-200 p-1">
                          <button
                            type="button"
                            onClick={() => setCell({ line, month: ym })}
                            aria-pressed={isSel}
                            aria-label={`${carrier.shortName} ${monthLabelLong(ym)}: ${status}. Invoice ${money(cm.invoice.amount)}`}
                            className={cn(
                              "flex h-[54px] w-full flex-col justify-between rounded-[3px] px-2 py-1.5 text-left transition-colors duration-150",
                              status === "Discrepancy" && "bg-ink text-paper",
                              status === "Credit pending" && "border border-dashed border-ink",
                              status === "Matched" && "bg-neutral-50 hover:bg-neutral-100",
                              isSel && "ring-2 ring-ink ring-offset-2",
                            )}
                          >
                            <span className="flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-[0.06em]">
                              {status === "Matched" ? (
                                <span className="text-neutral-500">✓{credited ? " credited" : ""}</span>
                              ) : status === "Discrepancy" ? (
                                <>
                                  <span className="size-1.5 rounded-full bg-signal" aria-hidden /> {diff >= 0 ? "Over" : "Under"}
                                </>
                              ) : (
                                "Pending"
                              )}
                            </span>
                            <span className="num text-[12px] font-medium">
                              {status === "Matched" ? moneyK(cm.invoice.amount) : money(diff, { sign: true })}
                            </span>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <CellDetail cm={selectedCell} done={state.done} onOpenFinding={openFinding} />
      </section>

      {/* ── Findings ─────────────────────────────────────── */}
      <section aria-labelledby="findings-title">
        <SectionTitle
          id="findings-title"
          count={rows.length}
          right={
            <Segmented<Filter>
              label="Filter findings"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: "All" },
                { value: "open", label: "Open" },
                { value: "progress", label: "In progress" },
                { value: "resolved", label: "Resolved" },
              ]}
            />
          }
        >
          Findings
        </SectionTitle>
        <div className="scroll-thin overflow-x-auto">
          <table className="w-full min-w-[900px] text-[14px]">
            <thead>
              <tr className="text-left text-[12px] text-neutral-500">
                <th scope="col" className="py-2 pr-4 font-semibold">ID</th>
                <th scope="col" className="py-2 pr-4 font-semibold">Employee</th>
                <th scope="col" className="py-2 pr-4 font-semibold">Carrier</th>
                <th scope="col" className="py-2 pr-4 font-semibold">Issue</th>
                <th scope="col" className="py-2 pr-4 font-semibold">Months</th>
                <th scope="col" className="py-2 pr-4 text-right font-semibold">Impact</th>
                <th scope="col" className="py-2 pr-4 font-semibold">Status</th>
                <th scope="col" className="w-8 py-2"><span className="sr-only">Open</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ f, status, impact }) => (
                <FindingRow key={f.id} f={f} status={status} impact={impact} onOpen={() => openFinding(f.id)} />
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-neutral-500">
                    Nothing here. Bobby will flag new discrepancies after tonight&apos;s reconciliation.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <FindingDrawer finding={selected} onClose={() => openFinding(null)} />
    </div>
  );
}

function Kpi({ label, value, note, accent, small }: { label: string; value: string; note?: React.ReactNode; accent?: boolean; small?: boolean }) {
  return (
    <div className="border-neutral-200 px-1 py-6 pr-6 [&:not(:last-child)]:lg:border-r lg:px-6 lg:first:pl-0">
      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-500">{label}</p>
      <p className={cn("num mt-3 font-bold leading-none tracking-[-0.05em]", small ? "text-[22px] tracking-[-0.03em]" : "text-[34px]")}>
        {accent && <span className="mr-2 inline-block size-2.5 translate-y-[-6px] rounded-full bg-signal" aria-hidden />}
        {value}
      </p>
      {note && <p className="mt-2 text-[12.5px] text-neutral-500">{note}</p>}
    </div>
  );
}

function LegendSwatch({ kind }: { kind: CellStatus }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-3 rounded-[2px]",
        kind === "Matched" && "bg-neutral-100",
        kind === "Discrepancy" && "bg-ink",
        kind === "Credit pending" && "border border-dashed border-ink",
      )}
    />
  );
}

function CellDetail({
  cm,
  done,
  onOpenFinding,
}: {
  cm: CarrierMonth;
  done: ReturnType<typeof useDemoState>["done"];
  onOpenFinding: (id: string) => void;
}) {
  const carrier = carriers[cm.carrierId];
  const sources = [
    { label: "HRIS (eligibility)", v: cm.hris },
    { label: "Payroll deductions", v: cm.payroll },
    { label: "Carrier invoice", v: cm.invoice },
  ];
  return (
    <div className="mt-5 grid grid-cols-1 gap-6 rounded-[6px] border border-neutral-200 p-5 md:grid-cols-[220px_1fr_1fr_1fr]" aria-live="polite">
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Selected</p>
        <p className="mt-1 text-[18px] font-bold tracking-[-0.02em]">{carrier.shortName}</p>
        <p className="num text-[13px] text-neutral-600">{monthLabelLong(cm.month)}</p>
      </div>
      {sources.map((s) => {
        const off = Math.abs(s.v.amount - cm.hris.amount) > 0.005;
        return (
          <div key={s.label} className={cn("rounded-[4px] p-3", off ? "surface-dark bg-ink text-paper" : "bg-neutral-50")}>
            <p className={cn("text-[12px]", off ? "text-neutral-400" : "text-neutral-500")}>{s.label}</p>
            <p className="num mt-1 text-[22px] font-bold tracking-[-0.04em]">{money(s.v.amount, { cents: true })}</p>
            <p className={cn("num text-[12px]", off ? "text-neutral-400" : "text-neutral-500")}>{plural(s.v.lives, "covered employee")}</p>
          </div>
        );
      })}
      {cm.findings.length > 0 && (
        <div className="md:col-span-4">
          <ul className="flex flex-wrap gap-2">
            {cm.findings.map((f) => (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => onOpenFinding(f.id)}
                  className="inline-flex items-center gap-2 rounded-[4px] border border-neutral-300 px-3 py-1.5 text-[13px] hover:border-ink"
                >
                  <span className="num text-neutral-500">{f.id}</span>
                  <span className="font-semibold">{fullName(employeeById[f.employeeId])}</span>
                  <span className="text-neutral-500">{f.type}</span>
                  <Status kind={statusKind(findingStatus(f, done))}>{findingStatus(f, done)}</Status>
                  <ArrowRight className="size-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function FindingRow({
  f,
  status,
  impact,
  onOpen,
}: {
  f: Finding;
  status: FindingStatus;
  impact: number;
  onOpen: () => void;
}) {
  const emp = employeeById[f.employeeId];
  return (
    <tr
        className="group cursor-pointer border-t border-neutral-200 hover:bg-neutral-50"
        onClick={onOpen}
      >
        <td className="num py-3.5 pr-4 text-[12.5px] text-neutral-500">{f.id}</td>
        <td className="py-3.5 pr-4">
          <button type="button" onClick={(e) => { e.stopPropagation(); onOpen(); }} className="text-left font-semibold hover:underline">
            {fullName(emp)}
          </button>
          {emp.status === "Terminated" && <span className="ml-2 text-[12px] text-neutral-500">Terminated</span>}
        </td>
        <td className="py-3.5 pr-4">{carriers[f.carrierId].shortName}</td>
        <td className="py-3.5 pr-4">{f.type}</td>
        <td className="num py-3.5 pr-4 text-[13px]">{f.months.map(monthLabel).join(", ")}</td>
        <td className={cn("num py-3.5 pr-4 text-right font-semibold", impact < 0 && "text-neutral-600")}>
          {impact < 0 ? `${money(impact, { cents: true })}` : money(impact, { cents: true })}
          <span className="block text-[11px] font-normal text-neutral-500">
            {f.type === "Missing from invoice" ? "coverage gap" : impact < 0 ? "we owe" : "overbilled"}
          </span>
        </td>
        <td className="py-3.5 pr-4">
          <Status kind={statusKind(status)}>{status}</Status>
        </td>
        <td className="py-3.5 text-neutral-400 group-hover:text-ink">
          <ArrowRight className="size-4" aria-hidden />
        </td>
      </tr>
  );
}
