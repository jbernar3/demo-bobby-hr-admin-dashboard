"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/format";

/** Chip that opens a multi-select checkbox menu. */
export function FilterMenu({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: { value: string; label: string; count: number }[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        ref.current?.querySelector<HTMLButtonElement>("button")?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const active = selected.length > 0;
  const toggle = (v: string) => onChange(selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={menuId}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-[4px] border px-3 text-[13px] font-semibold transition-colors duration-150",
          active ? "border-ink bg-ink text-paper" : "border-neutral-300 hover:border-ink",
        )}
      >
        {label}
        {active && <span className="num font-medium">· {selected.length === 1 ? selected[0] : selected.length}</span>}
        <ChevronDown className="size-3.5" aria-hidden />
      </button>
      {open && (
        <div id={menuId} role="group" aria-label={`${label} filter`} className="absolute left-0 top-10 z-20 w-[240px] rounded-[6px] border border-ink bg-paper p-1.5">
          <ul className="scroll-thin max-h-[300px] overflow-y-auto">
            {options.map((o) => {
              const on = selected.includes(o.value);
              return (
                <li key={o.value}>
                  <label className="flex cursor-pointer items-center gap-2.5 rounded-[3px] px-2 py-1.5 text-[13.5px] hover:bg-neutral-100">
                    <input type="checkbox" checked={on} onChange={() => toggle(o.value)} className="peer sr-only" />
                    <span className={cn("inline-flex size-4 items-center justify-center rounded-[3px] border peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink", on ? "border-ink bg-ink text-paper" : "border-neutral-400")} aria-hidden>
                      {on && <Check className="size-3" strokeWidth={3} />}
                    </span>
                    <span className="flex-1">{o.label}</span>
                    <span className="num text-[12px] text-neutral-500">{o.count}</span>
                  </label>
                </li>
              );
            })}
          </ul>
          {active && (
            <button type="button" onClick={() => onChange([])} className="mt-1 w-full rounded-[3px] px-2 py-1.5 text-left text-[12.5px] font-semibold text-neutral-600 hover:bg-neutral-100">
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
