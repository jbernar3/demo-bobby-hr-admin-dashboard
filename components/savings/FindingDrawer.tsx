"use client";

import { Check, Paperclip } from "lucide-react";
import { useState } from "react";
import { actionById } from "@/data/actions";
import { employeeById, fullName } from "@/data/employees";
import { carriers, TIER_LABEL } from "@/data/plans";
import { enrolledTier, findingImpact, hrisTier, rateFor } from "@/lib/billing";
import { fmtDate, monthLabelLong } from "@/lib/dates";
import { carrierEmail, draftEmail } from "@/lib/emails";
import { cn, money } from "@/lib/format";
import { findingStatus, statusKind } from "@/lib/selectors";
import { approve, toast, useDemoState } from "@/lib/store";
import type { Finding, Tier } from "@/lib/types";
import { Badge, Button, Drawer, Status } from "../ui";

export function FindingDrawer({ finding, onClose }: { finding: Finding | null; onClose: () => void }) {
  return (
    <Drawer
      open={!!finding}
      onClose={onClose}
      width={720}
      title={finding ? <DrawerTitle f={finding} /> : null}
    >
      {finding && <FindingBody key={finding.id} f={finding} />}
    </Drawer>
  );
}

function DrawerTitle({ f }: { f: Finding }) {
  const state = useDemoState();
  const status = findingStatus(f, state.done);
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className="num text-[12px] text-neutral-500">{f.id}</span>
        <Badge tone="outline">{f.type}</Badge>
        <Status kind={statusKind(status)}>{status}</Status>
      </div>
      <h2 className="text-[26px] font-black leading-tight tracking-[-0.03em]">
        {fullName(employeeById[f.employeeId])} · {carriers[f.carrierId].shortName}
      </h2>
    </div>
  );
}

function FindingBody({ f }: { f: Finding }) {
  const state = useDemoState();
  const emp = employeeById[f.employeeId];
  const status = findingStatus(f, state.done);
  const impact = findingImpact(f);
  const draft = draftEmail(f);
  const [body, setBody] = useState(draft.body);
  const action = f.actionId ? actionById[f.actionId] : undefined;
  const approvedAt = f.actionId ? state.done[f.actionId]?.at : undefined;

  const tierText = (t: Tier | null) => (t ? TIER_LABEL[t] : "Not covered");
  const billedText = (t: Tier | null) => (t ? TIER_LABEL[t] : "Not on invoice");

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-[auto_1fr] items-end gap-6">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
            {f.type === "Missing from invoice" ? "Coverage at risk" : impact < 0 ? "We owe" : "Overbilled"}
          </p>
          <p className="num mt-2 text-[48px] font-bold leading-none tracking-[-0.06em]">
            {money(Math.abs(impact), { cents: true })}
            {f.type === "Missing from invoice" && <span className="ml-1 text-[18px] font-medium text-neutral-500">/mo</span>}
          </p>
        </div>
        <p className="pb-1 text-[14px] leading-snug text-neutral-600">{f.summary}</p>
      </div>

      <section aria-labelledby="sbs-title">
        <h3 id="sbs-title" className="mb-3 text-[12px] font-bold uppercase tracking-[0.12em]">
          Side by side
        </h3>
        <div className="overflow-hidden rounded-[6px] border border-neutral-200">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-[12px] text-neutral-500">
                <th scope="col" className="px-3 py-2 font-semibold">Month</th>
                <th scope="col" className="px-3 py-2 font-semibold">HRIS (eligibility)</th>
                <th scope="col" className="px-3 py-2 font-semibold">Payroll deduction</th>
                <th scope="col" className="px-3 py-2 font-semibold">Carrier invoice</th>
              </tr>
            </thead>
            <tbody>
              {f.months.map((ym) => {
                const h = hrisTier(emp, f.line, ym);
                const p = enrolledTier(emp, f.line, ym);
                const inv = f.billedTier;
                const cells: { text: string; amt: number; off: boolean }[] = [
                  { text: tierText(h), amt: rateFor(emp, f.line, h), off: false },
                  { text: p ? TIER_LABEL[p] : "No deduction", amt: rateFor(emp, f.line, p), off: p !== h },
                  { text: billedText(inv), amt: rateFor(emp, f.line, inv), off: inv !== h },
                ];
                return (
                  <tr key={ym} className="border-b border-neutral-100 last:border-0">
                    <th scope="row" className="num px-3 py-3 text-left font-medium">
                      {monthLabelLong(ym)}
                    </th>
                    {cells.map((c, i) => (
                      <td key={i} className="p-1.5">
                        <div className={cn("rounded-[3px] px-2 py-1.5", c.off ? "surface-dark bg-ink text-paper" : "")}>
                          <span className="block font-semibold">{c.text}</span>
                          <span className={cn("num block text-[12px]", c.off ? "text-neutral-400" : "text-neutral-500")}>
                            {money(c.amt, { cents: true })}
                          </span>
                        </div>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[12px] text-neutral-500">
          Highlighted cells disagree with HRIS eligibility, Keel&apos;s source of truth.
          {emp.terminationDate && ` Terminated ${fmtDate(emp.terminationDate)}.`}
        </p>
      </section>

      {status === "Recovered" ? (
        <section className="rounded-[6px] border border-neutral-200 p-5">
          <p className="flex items-center gap-2 text-[15px] font-semibold">
            <Check className="size-4" aria-hidden /> Credit applied {f.resolvedOn ? `on ${fmtDate(f.resolvedOn)}` : ""}
          </p>
          <p className="mt-1 text-[13.5px] text-neutral-600">
            Keel detected this on {fmtDate(f.detectedOn)}, requested the credit, and verified it on the following invoice.
          </p>
        </section>
      ) : (
        <section aria-labelledby="email-title">
          <div className="mb-3 flex items-center justify-between">
            <h3 id="email-title" className="text-[12px] font-bold uppercase tracking-[0.12em]">
              Keel-drafted {f.type === "Missing from invoice" || f.type === "Underbilled" ? "correction" : "credit request"}
            </h3>
            {!approvedAt && <span className="text-[12px] text-neutral-500">Editable</span>}
          </div>
          <div className="overflow-hidden rounded-[6px] border border-neutral-300 focus-within:border-ink">
            <dl className="grid grid-cols-[64px_1fr] gap-y-1.5 border-b border-neutral-200 bg-neutral-50 px-4 py-3 text-[13px]">
              <dt className="text-neutral-500">To</dt>
              <dd className="num">{carrierEmail(f.carrierId)}</dd>
              <dt className="text-neutral-500">Subject</dt>
              <dd className="font-semibold">{draft.subject}</dd>
            </dl>
            <label htmlFor={`email-${f.id}`} className="sr-only">
              Email body
            </label>
            <textarea
              id={`email-${f.id}`}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              readOnly={!!approvedAt}
              rows={14}
              className="scroll-thin block w-full resize-y px-4 py-3 text-[13.5px] leading-relaxed outline-none read-only:text-neutral-500"
            />
            <div className="flex items-center gap-2 border-t border-neutral-200 px-4 py-2.5 text-[12px] text-neutral-500">
              <Paperclip className="size-3.5" aria-hidden />
              {f.type === "Ghost enrollee" ? "hris-termination-record.pdf · payroll-register.pdf" : "eligibility-documentation.pdf"}
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            {approvedAt ? (
              <p className="flex items-center gap-2 text-[14px] font-semibold">
                <Check className="size-4" aria-hidden /> Sent at {approvedAt}. {status}.
              </p>
            ) : (
              <>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => {
                    if (!f.actionId) return;
                    approve(f.actionId);
                    toast(action?.toast ?? "Done. Keel sent it.");
                  }}
                >
                  <Check className="size-4" aria-hidden /> Approve &amp; send
                </Button>
                <Button size="lg" onClick={() => setBody(draft.body)} disabled={body === draft.body}>
                  Reset draft
                </Button>
              </>
            )}
          </div>
          {action && action.id === "downgrade-jordan" && !approvedAt && (
            <p className="mt-3 text-[12.5px] text-neutral-500">Approving also fixes the dental and vision tiers for Jordan Kim.</p>
          )}
        </section>
      )}
    </div>
  );
}
