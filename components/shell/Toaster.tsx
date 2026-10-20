"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Info, X } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/format";
import { dismissToast, type Toast, useToasts } from "@/lib/store";

function ToastItem({ t }: { t: Toast }) {
  useEffect(() => {
    const timer = window.setTimeout(() => dismissToast(t.id), t.tone === "demo" ? 3800 : 5200);
    return () => window.clearTimeout(timer);
  }, [t.id, t.tone]);

  const dark = t.tone === "default";
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6, transition: { duration: 0.12 } }}
      transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
      className={cn(
        "pointer-events-auto flex w-[400px] max-w-[calc(100vw-32px)] items-start gap-3 rounded-[6px] border px-4 py-3.5",
        dark ? "surface-dark border-ink bg-ink text-paper" : "border-ink bg-paper text-ink",
      )}
    >
      <span
        className={cn(
          "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full",
          dark ? "bg-paper text-ink" : "border border-ink",
        )}
        aria-hidden
      >
        {dark ? <Check className="size-3.5" strokeWidth={3} /> : <Info className="size-3" strokeWidth={2.5} />}
      </span>
      <p className="flex-1 text-[14px] leading-snug">{t.message}</p>
      <button
        type="button"
        onClick={() => dismissToast(t.id)}
        aria-label="Dismiss notification"
        className={cn("-mr-1 -mt-0.5 inline-flex size-6 items-center justify-center rounded-[3px]", dark ? "text-neutral-400 hover:text-paper" : "text-neutral-500 hover:text-ink")}
      >
        <X className="size-4" />
      </button>
    </motion.li>
  );
}

export function Toaster() {
  const toasts = useToasts();
  return (
    <div aria-live="polite" aria-atomic="false" className="pointer-events-none fixed bottom-5 right-5 z-[70]">
      <ul className="flex flex-col items-end gap-2">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <ToastItem key={t.id} t={t} />
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
