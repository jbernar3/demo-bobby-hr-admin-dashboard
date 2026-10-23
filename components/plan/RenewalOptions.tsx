"use client";

import { useEffect, useState } from "react";
import { renewalOptions } from "@/data/plans";
import { money, moneyK } from "@/lib/format";
import { levelFundedSummary } from "@/lib/levelFunded";
import { Badge, SectionTitle, WorkingDot } from "../ui";
import { platform } from "@/data/company";

function pct(n: number) {
  return `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(Math.round(n * 100))}%`;
}

/** Cycles through short status lines so the card reads as live work. */
function LiveLine({ lines, offset }: { lines: string[]; offset: number }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    let t: ReturnType<typeof setInterval>;
    const start = setTimeout(() => {
      t = setInterval(() => setI((n) => (n + 1) % lines.length), 4200);
    }, offset);
    return () => {
      clearTimeout(start);
      clearInterval(t);
    };
  }, [lines.length, offset]);
  return (
    <div className="mt-auto pt-5">
      <div className="relative h-px w-full overflow-hidden bg-neutral-200" aria-hidden>
        <div className="absolute inset-y-0 left-0 w-1/4 animate-sweep bg-ink" style={{ animationDelay: `${offset}ms` }} />
      </div>
      <p className="mt-3 flex items-center gap-2 text-[12px] text-neutral-600" aria-live="off">
        <WorkingDot />
        <span key={i}>{lines[i]}…</span>
      </p>
    </div>
  );
}

export function RenewalOptions() {
  const current = levelFundedSummary().currentPremium * 12;
  return (
    <section aria-labelledby="options-title" className="mb-14">
      <SectionTitle id="options-title" right={
          <span className="flex items-center gap-3">
            <span className="hidden items-center gap-2 text-[12px] text-neutral-600 sm:flex">
              <WorkingDot /> Updated 4 min ago
            </span>
            <Badge tone="muted">{platform.name} estimates · medical only</Badge>
          </span>
        }>
        2027 renewal: current plan vs. options
      </SectionTitle>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="surface-dark flex flex-col rounded-[6px] bg-ink p-6 text-paper">
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-400">Current plan</p>
          <p className="mt-1 text-[16px] font-bold">Meridian Health</p>
          <p className="text-[13px] text-neutral-400">Level-funded medical</p>
          <p className="num mt-6 text-[34px] font-bold leading-none tracking-[-0.05em]">{money(current)}</p>
          <p className="num mt-1 text-[12.5px] text-neutral-400">per year · {money(current / 12)}/mo</p>
          <ul className="mt-5 space-y-2 text-[13px] leading-snug text-neutral-300">
            <li>Renewal proposal expected this summer</li>
            <li>Surplus is partly refunded after run-out</li>
          </ul>
        </article>

        {renewalOptions.map((o, idx) => {
          const low = current * (1 + o.range[0]);
          const high = current * (1 + o.range[1]);
          const saving = Math.round((current - (low + high) / 2) / 100) * 100;
          return (
            <article key={o.id} className="flex flex-col rounded-[6px] border border-ink p-6">
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-500">{o.label}</p>
              <p className="mt-1 text-[16px] font-bold">{o.provider}</p>
              <p className="text-[13px] text-neutral-500">{o.structure}</p>
              <p className="num mt-6 text-[34px] font-bold leading-none tracking-[-0.05em]">
                {moneyK(low)}–{moneyK(high)}
              </p>
              <p className="num mt-1 text-[12.5px] text-neutral-500">
                per year · {pct(o.range[0])} to {pct(o.range[1])} vs. current
              </p>
              <p
                className={
                  saving > 0
                    ? "num mt-4 inline-flex w-fit items-center rounded-[4px] bg-green-50 px-2.5 py-1 text-[13px] font-semibold text-green-800 ring-1 ring-green-200"
                    : "num mt-4 inline-flex w-fit items-center rounded-[4px] bg-neutral-100 px-2.5 py-1 text-[13px] font-semibold text-neutral-700"
                }
              >
                {saving > 0 ? `Saves ~${moneyK(saving)}/yr` : `Costs ~${moneyK(-saving)}/yr more`}
              </p>
              <ul className="mt-5 space-y-2 text-[13px] leading-snug text-neutral-700">
                {o.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              <LiveLine lines={o.live} offset={idx * 1400} />
            </article>
          );
        })}
      </div>
    </section>
  );
}
