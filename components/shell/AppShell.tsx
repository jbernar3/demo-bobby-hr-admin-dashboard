"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";
import { AskPanel } from "./AskPanel";
import { CommandPalette } from "./CommandPalette";
import { Sidebar } from "./Sidebar";
import { Toaster } from "./Toaster";
import { TopBar } from "./TopBar";
import { UIProvider } from "./ui-context";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <UIProvider>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-[4px] focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
        >
          Skip to content
        </a>
        <Sidebar />
        <div className="flex min-h-screen min-w-0 flex-col overflow-x-clip lg:pl-[244px]">
          <TopBar />
          <main id="main" className="w-full max-w-[1400px] flex-1 px-4 pb-16 pt-10 md:px-8 xl:px-12">
            {children}
          </main>
          <footer className="border-t border-neutral-200 px-4 py-5 md:px-8 xl:px-12">
            <p className="num text-[11.5px] text-neutral-500">
              Demo environment · fictitious data · not legal or tax advice.
            </p>
          </footer>
        </div>
        <CommandPalette />
        <AskPanel />
        <Toaster />
      </UIProvider>
    </MotionConfig>
  );
}
