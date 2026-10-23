"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CornerDownLeft, MessageSquare, Search, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ASK_QUESTIONS } from "@/data/askKeel";
import { employees, fullName } from "@/data/employees";
import { cn } from "@/lib/format";
import { Kbd, useDialogBehavior } from "../ui";
import { NAV } from "./nav";
import { useUI } from "./ui-context";
import { platform } from "@/data/company";

interface PaletteItem {
  id: string;
  group: string;
  label: string;
  hint?: string;
  icon: "ask" | "page" | "person";
  run: () => void;
}

export function CommandPalette() {
  const { paletteOpen, setPaletteOpen, openAsk } = useUI();
  const router = useRouter();

  // Global shortcut: ⌘K / Ctrl+K toggles the palette.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(!paletteOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paletteOpen, setPaletteOpen]);

  return (
    <AnimatePresence>
      {paletteOpen && (
        <PaletteDialog
          onClose={() => setPaletteOpen(false)}
          onAsk={(q) => openAsk(q)}
          onNavigate={(href) => {
            setPaletteOpen(false);
            router.push(href);
          }}
        />
      )}
    </AnimatePresence>
  );
}

function PaletteDialog({
  onClose,
  onAsk,
  onNavigate,
}: {
  onClose: () => void;
  onAsk: (q: string) => void;
  onNavigate: (href: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  useDialogBehavior(true, onClose, panelRef, inputRef);

  const items = useMemo<PaletteItem[]>(() => {
    const q = query.trim().toLowerCase();
    const out: PaletteItem[] = [];
    if (q) {
      out.push({
        id: "ask-free",
        group: `Ask ${platform.name}`,
        label: `Ask ${platform.name}: “${query.trim()}”`,
        icon: "ask",
        run: () => onAsk(query.trim()),
      });
    }
    ASK_QUESTIONS.filter((a) => !q || a.question.toLowerCase().includes(q))
      .slice(0, q ? 3 : 6)
      .forEach((a) =>
        out.push({ id: `ask-${a.id}`, group: `Ask ${platform.name}`, label: a.question, icon: "ask", run: () => onAsk(a.question) }),
      );
    NAV.filter((n) => !q || n.label.toLowerCase().includes(q) || n.description.toLowerCase().includes(q)).forEach((n) =>
      out.push({ id: `nav-${n.href}`, group: "Pages", label: n.label, hint: n.description, icon: "page", run: () => onNavigate(n.href) }),
    );
    if (q) {
      employees
        .filter((e) => `${fullName(e)} ${e.title} ${e.department} ${e.city} ${e.state}`.toLowerCase().includes(q))
        .slice(0, 6)
        .forEach((e) =>
          out.push({
            id: `emp-${e.id}`,
            group: "Employees",
            label: fullName(e),
            hint: `${e.title} · ${e.city}, ${e.state}${e.status === "Terminated" ? " · Terminated" : ""}`,
            icon: "person",
            run: () => onNavigate(`/employees?id=${e.id}`),
          }),
        );
    }
    return out;
  }, [query, onAsk, onNavigate]);

  const safeActive = Math.min(active, Math.max(items.length - 1, 0));

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${safeActive}"]`)?.scrollIntoView({ block: "nearest" });
  }, [safeActive]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((safeActive + 1) % Math.max(items.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((safeActive - 1 + items.length) % Math.max(items.length, 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      items[safeActive]?.run();
    }
  };

  let lastGroup = "";

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]">
      <motion.div
        className="absolute inset-0 bg-ink/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.12 }}
        onClick={onClose}
        aria-hidden
      />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Ask ${platform.name} or search`}
        className="relative w-full max-w-[640px] overflow-hidden rounded-[6px] border border-ink bg-paper"
        initial={{ opacity: 0, y: -6, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -4, transition: { duration: 0.1 } }}
        transition={{ duration: 0.16, ease: [0.2, 0, 0, 1] }}
      >
        <div className="flex items-center gap-3 border-b border-neutral-200 px-5">
          <Search className="size-[18px] shrink-0" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder={`Ask ${platform.name} or search people and pages…`}
            className="h-14 flex-1 bg-transparent text-[16px] outline-none placeholder:text-neutral-400"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={items[safeActive] ? `palette-${items[safeActive].id}` : undefined}
            aria-autocomplete="list"
          />
          <Kbd>esc</Kbd>
        </div>
        <ul ref={listRef} id="palette-list" role="listbox" className="scroll-thin max-h-[420px] overflow-y-auto py-2">
          {items.map((item, i) => {
            const header = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            const isActive = i === safeActive;
            const Icon = item.icon === "ask" ? MessageSquare : item.icon === "person" ? User : ArrowRight;
            return (
              <li key={item.id} role="presentation">
                {header && (
                  <p className="px-5 pb-1.5 pt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500" role="presentation">
                    {header}
                  </p>
                )}
                <div
                  id={`palette-${item.id}`}
                  role="option"
                  aria-selected={isActive}
                  data-index={i}
                  onMouseMove={() => setActive(i)}
                  onClick={() => item.run()}
                  className={cn(
                    "mx-2 flex cursor-pointer items-center gap-3 rounded-[4px] px-3 py-2.5",
                    isActive ? "bg-ink text-paper" : "text-ink",
                  )}
                >
                  <Icon className={cn("size-4 shrink-0", isActive ? "text-paper" : "text-neutral-500")} aria-hidden />
                  <span className="truncate text-[14.5px] font-medium">{item.label}</span>
                  {item.hint && (
                    <span className={cn("ml-auto truncate pl-4 text-[12.5px]", isActive ? "text-neutral-300" : "text-neutral-500")}>
                      {item.hint}
                    </span>
                  )}
                  {isActive && !item.hint && <CornerDownLeft className="ml-auto size-3.5 shrink-0" aria-hidden />}
                </div>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center gap-4 border-t border-neutral-200 px-5 py-2.5 text-[12px] text-neutral-500">
          <span className="flex items-center gap-1.5">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> navigate
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd>↵</Kbd> select
          </span>
          <span className="ml-auto">{platform.name} answers from your live plan data</span>
        </div>
      </motion.div>
    </div>
  );
}
