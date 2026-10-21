"use client";

import { Menu, MessageSquare, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { advisor } from "@/data/company";
import { DEMO_TODAY, fmtLong } from "@/lib/dates";
import { demoToast } from "@/lib/store";
import { Button, Kbd } from "../ui";
import { useUI } from "./ui-context";

export function TopBar() {
  const { setPaletteOpen, openAsk, setNavOpen } = useUI();
  return (
    <div className="sticky top-0 z-30 border-b border-neutral-200 bg-paper/95 backdrop-blur-sm">
      <div className="flex h-16 items-center gap-3 px-4 md:px-8 xl:px-12">
        <button
          type="button"
          onClick={() => setNavOpen(true)}
          className="inline-flex size-9 items-center justify-center rounded-[4px] border border-neutral-300 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </button>
        <Link href="/" className="mr-2 hidden text-[22px] font-black tracking-[-0.06em] sm:inline lg:hidden">
          Keel
        </Link>

        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="group flex h-10 min-w-0 flex-1 items-center gap-3 rounded-[4px] border border-neutral-300 px-3.5 text-left text-[14px] text-neutral-500 transition-colors duration-150 hover:border-ink md:max-w-[520px]"
          aria-label="Ask Keel or search (Command K)"
          aria-haspopup="dialog"
        >
          <Search className="size-4 shrink-0 text-ink" aria-hidden />
          <span className="flex-1 truncate">Ask Keel or search…</span>
          <span className="hidden items-center gap-1 sm:flex">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </span>
        </button>

        <div className="ml-auto flex shrink-0 items-center gap-4">
          <span className="num hidden text-[12.5px] text-neutral-500 xl:inline">{fmtLong(DEMO_TODAY)}</span>
          <AdvisorBadge />
          <Button variant="primary" onClick={() => openAsk()} aria-label="Open Ask Keel panel">
            <MessageSquare className="size-4" aria-hidden />
            <span className="hidden sm:inline">Ask Keel</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

function AdvisorBadge() {
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const open = pinned || hovered;

  useEffect(() => {
    if (!pinned) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setPinned(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPinned(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [pinned]);

  return (
    <div
      ref={ref}
      className="relative hidden md:block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        onClick={() => setPinned((v) => !v)}
        aria-expanded={open}
        aria-controls="advisor-popover"
        className="flex items-center gap-2 rounded-[4px] text-[12.5px] text-neutral-600 hover:text-ink"
      >
        <span className="relative inline-flex size-6 items-center justify-center rounded-full border border-ink text-[10px] font-bold">
          {advisor.initials}
          <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full border border-paper bg-ink" aria-hidden />
        </span>
        <span className="hidden xl:inline">
          {advisor.name.split(" ")[0]} · {advisor.availability.toLowerCase()}
        </span>
      </button>
      {open && (
        <div
          id="advisor-popover"
          role="tooltip"
          className="absolute right-0 top-full z-40 w-[280px] pt-2"
        >
          <div className="rounded-[6px] border border-ink bg-paper p-4 text-left shadow-[4px_4px_0_0_#000]">
            <p className="text-[14px] font-bold tracking-[-0.01em]">{advisor.name}</p>
            <p className="text-[12px] text-neutral-500">{advisor.title}</p>
            <div className="mt-4 flex gap-2">
              <Button variant="primary" size="sm" className="flex-1" onClick={() => demoToast("Messaging Marco")}>
                Message
              </Button>
              <Button size="sm" className="flex-1" onClick={() => demoToast("Booking time with Marco")}>
                Book time
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
