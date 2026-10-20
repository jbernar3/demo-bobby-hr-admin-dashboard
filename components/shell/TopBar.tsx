"use client";

import { Menu, MessageSquare, Search } from "lucide-react";
import Link from "next/link";
import { advisor } from "@/data/company";
import { DEMO_TODAY, fmtLong } from "@/lib/dates";
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
          Bobby
        </Link>

        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="group flex h-10 min-w-0 flex-1 items-center gap-3 rounded-[4px] border border-neutral-300 px-3.5 text-left text-[14px] text-neutral-500 transition-colors duration-150 hover:border-ink md:max-w-[520px]"
          aria-label="Ask Bobby or search (Command K)"
          aria-haspopup="dialog"
        >
          <Search className="size-4 shrink-0 text-ink" aria-hidden />
          <span className="flex-1 truncate">Ask Bobby or search…</span>
          <span className="hidden items-center gap-1 sm:flex">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </span>
        </button>

        <div className="ml-auto flex shrink-0 items-center gap-4">
          <span className="num hidden text-[12.5px] text-neutral-500 xl:inline">{fmtLong(DEMO_TODAY)}</span>
          <span className="hidden items-center gap-2 text-[12.5px] text-neutral-600 md:flex" title={advisor.title}>
            <span className="relative inline-flex size-6 items-center justify-center rounded-full border border-ink text-[10px] font-bold">
              {advisor.initials}
              <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full border border-paper bg-ink" aria-hidden />
            </span>
            <span className="hidden xl:inline">
              {advisor.name.split(" ")[0]} · {advisor.availability.toLowerCase()}
            </span>
          </span>
          <Button variant="primary" onClick={() => openAsk()} aria-label="Open Ask Bobby panel">
            <MessageSquare className="size-4" aria-hidden />
            <span className="hidden sm:inline">Ask Bobby</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
