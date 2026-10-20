"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { daysFromToday, fmtShort, relativeDue } from "@/lib/dates";
import { cn, money } from "@/lib/format";
import { approve, dismiss, toast } from "@/lib/store";
import type { ApprovalAction } from "@/lib/types";
import { Badge, Button } from "../ui";

export function ApprovalCard({ action: a, index }: { action: ApprovalAction; index: number }) {
  const router = useRouter();
  const overdue = a.dueDate ? daysFromToday(a.dueDate) < 0 : false;
  const today = a.urgency === "today";

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.22, delay: Math.min(index, 8) * 0.04, ease: [0.2, 0, 0, 1] } }}
      exit={{ opacity: 0, x: 24, transition: { duration: 0.18 } }}
      className="group relative rounded-[6px] border border-neutral-200 bg-paper transition-colors duration-150 hover:border-ink"
    >
      <article className="grid grid-cols-[48px_minmax(0,1fr)] gap-x-4 p-5 sm:grid-cols-[56px_minmax(0,1fr)_auto] sm:p-6">
        <span className="num pt-0.5 text-[28px] font-bold leading-none tracking-[-0.04em] text-neutral-300" aria-hidden>
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            {today && (
              <Badge tone="outline" className="border-ink text-ink">
                <span className="size-1.5 rounded-full bg-signal" aria-hidden />
                Today
              </Badge>
            )}
            {a.dueDate && (
              <Badge tone={overdue ? "signal" : "muted"} mono>
                {overdue ? `Overdue · ${fmtShort(a.dueDate)}` : `${fmtShort(a.dueDate)} · ${relativeDue(a.dueDate)}`}
              </Badge>
            )}
            {a.amount !== undefined && a.amount > 0 && (
              <Badge tone="solid" mono>
                {money(a.amount, { cents: a.amount < 1000 })} {a.amountLabel}
              </Badge>
            )}
          </div>
          <h3 className="text-[18px] font-bold leading-snug tracking-[-0.015em]">{a.title}</h3>
          <p className="mt-1.5 max-w-[60ch] text-[14.5px] leading-snug text-neutral-600">{a.why}</p>
        </div>
        <div className="col-span-2 mt-5 flex flex-wrap items-center gap-2 sm:col-span-1 sm:col-start-3 sm:row-start-1 sm:mt-0 sm:w-[148px] sm:flex-col sm:items-stretch">
          <Button
            variant="primary"
            onClick={() => {
              approve(a.id);
              toast(a.toast);
            }}
            aria-label={`Approve: ${a.title}`}
          >
            <Check className="size-4" aria-hidden />
            {a.approveLabel ?? "Approve"}
          </Button>
          <Button onClick={() => router.push(a.href)} aria-label={`Review: ${a.title}`}>
            Review
          </Button>
          <Button
            variant="ghost"
            className={cn("sm:opacity-70 sm:group-hover:opacity-100")}
            onClick={() => dismiss(a.id)}
            aria-label={`Dismiss: ${a.title}`}
          >
            Dismiss
          </Button>
        </div>
      </article>
    </motion.li>
  );
}
