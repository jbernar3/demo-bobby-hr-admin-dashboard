"use client";

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";

interface UIState {
  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
  askOpen: boolean;
  /** Open the Ask Bobby panel, optionally asking a question right away. */
  openAsk: (question?: string) => void;
  closeAsk: () => void;
  /** A question queued by the palette or a button, consumed by the panel. */
  queuedQuestion: { text: string; nonce: number } | null;
  clearQueued: () => void;
  navOpen: boolean;
  setNavOpen: (open: boolean) => void;
}

const UIContext = createContext<UIState | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [queuedQuestion, setQueued] = useState<UIState["queuedQuestion"]>(null);

  const openAsk = useCallback((question?: string) => {
    setPaletteOpen(false);
    setAskOpen(true);
    if (question) setQueued({ text: question, nonce: Date.now() });
  }, []);
  const closeAsk = useCallback(() => setAskOpen(false), []);
  const clearQueued = useCallback(() => setQueued(null), []);

  const value = useMemo(
    () => ({
      paletteOpen,
      setPaletteOpen,
      askOpen,
      openAsk,
      closeAsk,
      queuedQuestion,
      clearQueued,
      navOpen,
      setNavOpen,
    }),
    [paletteOpen, askOpen, openAsk, closeAsk, queuedQuestion, clearQueued, navOpen],
  );
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used inside UIProvider");
  return ctx;
}
