"use client";

import { ArrowRight, FileText, Mail, MessageSquare, Phone, StickyNote } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { advisor } from "@/data/company";
import { cases } from "@/data/cases";
import { employeeById, fullName } from "@/data/employees";
import { carriers } from "@/data/plans";
import { DEMO_TODAY, daysBetween, fmtDate, fmtShort } from "@/lib/dates";
import { cn } from "@/lib/format";
import { demoToast } from "@/lib/store";
import type { CarrierCase, CaseEvent } from "@/lib/types";
import { Avatar, Badge, Button, Drawer, PageHeader, Status } from "../ui";

const CHANNEL_ICON: Record<CaseEvent["channel"], typeof Phone> = {
  Call: Phone,
  Email: Mail,
  Portal: FileText,
  Note: StickyNote,
  Slack: MessageSquare,
};

function age(c: CarrierCase) {
  const end = c.status === "Resolved" ? c.events[c.events.length - 1].at.slice(0, 10) : DEMO_TODAY;
  return daysBetween(c.openedOn, end);
}

function statusKind(s: CarrierCase["status"]) {
  return s === "Resolved" ? "done" : s === "Escalated" ? "info" : "pending";
}

function Owner({ owner }: { owner: CarrierCase["owner"] }) {
  return owner === "Marco" ? (
    <span className="inline-flex items-center gap-2">
      <Avatar initials={advisor.initials} size={22} /> Marco
    </span>
  ) : (
    <span className="inline-flex items-center gap-2">
      <span className="inline-flex size-[22px] items-center justify-center rounded-[3px] bg-ink text-[11px] font-black text-paper" aria-hidden>B</span>
      Bobby
    </span>
  );
}

export function CasesView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const selected = cases.find((c) => c.id === params.get("case")) ?? null;
  const open = (id: string | null) => router.replace(id ? `${pathname}?case=${id}` : pathname, { scroll: false });

  const openCases = cases.filter((c) => c.status !== "Resolved");
  const actions = cases.reduce((s, c) => s + c.events.filter((e) => e.actor === "Bobby").length, 0);
  const calls = cases.reduce((s, c) => s + c.events.filter((e) => e.actor === "Bobby" && e.channel === "Call").length, 0);

  const sorted = [...cases].sort((a, b) => Number(a.status === "Resolved") - Number(b.status === "Resolved") || age(b) - age(a));

  return (
    <div>
      <PageHeader
        eyebrow="Cases"
        title={
          <>
            <span className="num tracking-[-0.07em]">{openCases.length}</span> open cases. Zero on hold for you.
          </>
        }
        sub={`Bobby and ${advisor.name} work carrier issues end to end. That's ${actions} actions taken so far, including ${calls} phone calls you didn't have to make.`}
      />

      <div className="scroll-thin overflow-x-auto border-t border-ink">
        <table className="w-full min-w-[980px] text-[14px]">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-[12px] text-neutral-500">
              <th scope="col" className="py-2.5 pr-4 font-semibold">Case</th>
              <th scope="col" className="py-2.5 pr-4 font-semibold">Opened</th>
              <th scope="col" className="py-2.5 pr-4 text-right font-semibold">Age</th>
              <th scope="col" className="py-2.5 pr-4 font-semibold">Owner</th>
              <th scope="col" className="py-2.5 pr-4 font-semibold">Carrier</th>
              <th scope="col" className="py-2.5 pr-4 font-semibold">Status</th>
              <th scope="col" className="py-2.5 pr-4 font-semibold">Next step</th>
              <th scope="col" className="w-6"><span className="sr-only">Open</span></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => (
              <tr key={c.id} onClick={() => open(c.id)} className={cn("group cursor-pointer border-b border-neutral-200 align-top hover:bg-neutral-50", c.status === "Resolved" && "text-neutral-500")}>
                <td className="py-4 pr-4">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      open(c.id);
                    }}
                    className="text-left"
                  >
                    <span className={cn("block font-semibold group-hover:underline", c.status !== "Resolved" && "text-ink")}>{c.title}</span>
                    <span className="num block text-[12px] text-neutral-500">
                      #{c.id}
                      {c.employeeId && ` · ${fullName(employeeById[c.employeeId])}`}
                    </span>
                  </button>
                </td>
                <td className="num py-4 pr-4 text-[13px]">{fmtShort(c.openedOn)}</td>
                <td className="num py-4 pr-4 text-right text-[13px]">{age(c)}d</td>
                <td className="py-4 pr-4 text-[13px]"><Owner owner={c.owner} /></td>
                <td className="py-4 pr-4">{carriers[c.carrierId].shortName}</td>
                <td className="py-4 pr-4"><Status kind={statusKind(c.status)}>{c.status}</Status></td>
                <td className="max-w-[300px] py-4 pr-4 text-[13px] leading-snug text-neutral-600">{c.nextStep}</td>
                <td className="py-4 text-neutral-400 group-hover:text-ink"><ArrowRight className="size-4" aria-hidden /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Drawer
        open={!!selected}
        onClose={() => open(null)}
        width={600}
        title={
          selected ? (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="num text-[12px] text-neutral-500">#{selected.id}</span>
                <Badge tone="outline">{carriers[selected.carrierId].name}</Badge>
                <Status kind={statusKind(selected.status)}>{selected.status}</Status>
              </div>
              <h2 className="text-[24px] font-black leading-tight tracking-[-0.03em]">{selected.title}</h2>
            </div>
          ) : null
        }
        footer={
          selected && selected.status !== "Resolved" ? (
            <div className="flex gap-2">
              <Button variant="primary" onClick={() => demoToast("Messaging the case owner")}>Message {selected.owner}</Button>
              <Button onClick={() => demoToast("Adding a note")}>Add a note</Button>
            </div>
          ) : undefined
        }
      >
        {selected && (
          <div>
            <dl className="mb-8 grid grid-cols-3 gap-4 border-b border-neutral-200 pb-6">
              <div>
                <dt className="text-[12px] text-neutral-500">Owner</dt>
                <dd className="mt-1 text-[14px] font-semibold"><Owner owner={selected.owner} /></dd>
              </div>
              <div>
                <dt className="text-[12px] text-neutral-500">Opened</dt>
                <dd className="num mt-1 text-[14px]">{fmtDate(selected.openedOn)}</dd>
              </div>
              <div>
                <dt className="text-[12px] text-neutral-500">Age</dt>
                <dd className="num mt-1 text-[14px]">{age(selected)} days</dd>
              </div>
              {selected.employeeId && (
                <div className="col-span-3">
                  <dt className="text-[12px] text-neutral-500">Employee</dt>
                  <dd className="mt-1 text-[14px]">
                    <Link href={`/employees?id=${selected.employeeId}`} className="font-semibold underline-offset-2 hover:underline">
                      {fullName(employeeById[selected.employeeId])}
                    </Link>
                  </dd>
                </div>
              )}
              <div className="col-span-3 rounded-[4px] bg-neutral-100 px-4 py-3">
                <dt className="text-[12px] font-semibold uppercase tracking-[0.1em] text-neutral-500">Next step</dt>
                <dd className="mt-1 text-[14px] font-medium">{selected.nextStep}</dd>
              </div>
            </dl>

            <h3 className="mb-4 text-[12px] font-bold uppercase tracking-[0.12em]">What happened</h3>
            <ol className="relative border-l border-neutral-300 pl-6">
              {[...selected.events].reverse().map((ev, i) => {
                const Icon = CHANNEL_ICON[ev.channel];
                return (
                  <li key={i} className="relative pb-6 last:pb-0">
                    <span
                      className={cn(
                        "absolute -left-[37px] top-0 inline-flex size-[26px] items-center justify-center rounded-full border",
                        ev.actor === "Bobby" ? "border-ink bg-ink text-paper" : "border-neutral-300 bg-paper text-ink",
                      )}
                      aria-hidden
                    >
                      <Icon className="size-3.5" />
                    </span>
                    <p className="num text-[11.5px] text-neutral-500">
                      {fmtShort(ev.at.slice(0, 10))} · {ev.at.slice(11)} · {ev.channel}
                    </p>
                    <p className="mt-0.5 text-[14px] leading-snug">
                      <span className="font-semibold">{ev.actor}:</span> {ev.summary}
                    </p>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </Drawer>
    </div>
  );
}
