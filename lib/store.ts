"use client";

import { useCallback, useSyncExternalStore } from "react";
import { platform } from "@/data/company";

// Client-only demo state: which proposals Dana approved or dismissed.
// Persisted to localStorage when available; every access is wrapped so it can never break rendering.

export interface DoneEntry {
  at: string; // simulated clock label, e.g. "9:14 AM"
  seq: number;
}

export interface DemoState {
  done: Record<string, DoneEntry>;
  dismissed: Record<string, true>;
  seq: number;
}

const KEY = "keel-demo-state-v1";
const INITIAL: DemoState = { done: {}, dismissed: {}, seq: 0 };

let state: DemoState = INITIAL;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<DemoState>;
    state = {
      done: parsed.done ?? {},
      dismissed: parsed.dismissed ?? {},
      seq: typeof parsed.seq === "number" ? parsed.seq : 0,
    };
  } catch {
    state = INITIAL;
  }
}

function commit(next: DemoState) {
  state = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable (private mode, blocked). State still works in memory.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  // Loading may have changed the snapshot; let subscribers re-read.
  listener();
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => state;
const getServerSnapshot = () => INITIAL;

/** Simulated wall clock: the demo morning starts at 9:12 AM and advances a few minutes per approval. */
function clockLabel(seq: number) {
  const minutes = 9 * 60 + 12 + seq * 3;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const h12 = h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

export function approve(id: string) {
  if (state.done[id]) return;
  const seq = state.seq + 1;
  commit({
    ...state,
    seq,
    done: { ...state.done, [id]: { at: clockLabel(seq), seq } },
  });
}

export function dismiss(id: string) {
  commit({ ...state, dismissed: { ...state.dismissed, [id]: true } });
}

export function restore(id: string) {
  const rest = { ...state.dismissed };
  delete rest[id];
  commit({ ...state, dismissed: rest });
}

export function resetDemo() {
  commit(INITIAL);
}

export function useDemoState() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useDemo() {
  const s = useDemoState();
  const isDone = useCallback((id?: string) => !!id && !!s.done[id], [s]);
  return { state: s, isDone, approve, dismiss, restore, reset: resetDemo };
}

// ── Toasts ─────────────────────────────────────────────────────

export interface Toast {
  id: number;
  message: string;
  tone: "default" | "demo";
}

let toasts: Toast[] = [];
let toastSeq = 0;
const toastListeners = new Set<() => void>();
const emitToasts = () => toastListeners.forEach((l) => l());

export function toast(message: string, tone: Toast["tone"] = "default") {
  toastSeq += 1;
  toasts = [...toasts.slice(-2), { id: toastSeq, message, tone }];
  emitToasts();
}

export function demoToast(what = "This") {
  toast(`${what} is a demo. In production, ${platform.name} would handle it end to end.`, "demo");
}

export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emitToasts();
}

const EMPTY: Toast[] = [];

export function useToasts() {
  return useSyncExternalStore(
    (l) => {
      toastListeners.add(l);
      return () => {
        toastListeners.delete(l);
      };
    },
    () => toasts,
    () => EMPTY,
  );
}
