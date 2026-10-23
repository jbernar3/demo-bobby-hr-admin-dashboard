"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUp, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { actionById } from "@/data/actions";
import { advisor, platform } from "@/data/company";
import { answerFor, ASK_QUESTIONS, FALLBACK_TEXT, matchQuestion } from "@/data/askKeel";
import { cn } from "@/lib/format";
import { approve, demoToast, toast, useDemoState } from "@/lib/store";
import type { AnswerBlock } from "@/lib/types";
import { Avatar, Button, useDialogBehavior, WorkingDot } from "../ui";
import { useUI } from "./ui-context";

interface Message {
  id: number;
  role: "user" | "keel";
  text?: string;
  blocks?: AnswerBlock[];
  fallback?: boolean;
}

/** Character "cost" of non-text blocks while streaming, so they appear in sequence. */
const BLOCK_COST = 30;

function blockCost(b: AnswerBlock) {
  return b.type === "text" ? b.text.length : BLOCK_COST;
}

export function AskPanel() {
  const { askOpen, closeAsk, queuedQuestion, clearQueued } = useUI();
  const state = useDemoState();
  const router = useRouter();
  const reduce = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [streamId, setStreamId] = useState<number | null>(null);
  const [shown, setShown] = useState(0);
  const seq = useRef(0);
  useDialogBehavior(askOpen, closeAsk, panelRef, inputRef);

  const doneRef = useRef(state.done);
  useEffect(() => {
    doneRef.current = state.done;
  }, [state.done]);

  const streaming = thinking || streamId !== null;

  const ask = (text: string) => {
    const q = text.trim();
    if (!q || streaming) return;
    const matched = matchQuestion(q);
    const userMsg: Message = { id: ++seq.current, role: "user", text: q };
    const keelId = ++seq.current;
    const blocks: AnswerBlock[] = matched ? answerFor(matched, doneRef.current) : [{ type: "text", text: FALLBACK_TEXT }];
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setThinking(true);
    window.setTimeout(
      () => {
        setThinking(false);
        setMessages((m) => [...m, { id: keelId, role: "keel", blocks, fallback: !matched }]);
        // With reduced motion the answer appears at once instead of streaming.
        if (!reduce) {
          setShown(0);
          setStreamId(keelId);
        }
      },
      reduce ? 50 : 520,
    );
  };

  // Consume questions queued from the ⌘K palette or other buttons.
  const askRef = useRef(ask);
  useEffect(() => {
    askRef.current = ask;
  });
  useEffect(() => {
    if (!askOpen || !queuedQuestion) return;
    const t = window.setTimeout(() => {
      askRef.current(queuedQuestion.text);
      clearQueued();
    }, 180);
    return () => window.clearTimeout(t);
  }, [askOpen, queuedQuestion, clearQueued]);

  // Simulated token streaming.
  useEffect(() => {
    if (streamId === null) return;
    const msg = messages.find((m) => m.id === streamId);
    const total = (msg?.blocks ?? []).reduce((s, b) => s + blockCost(b), 0);
    const timer = window.setInterval(() => {
      setShown((n) => {
        const next = n + 3 + Math.floor(Math.random() * 4);
        if (next >= total) {
          window.clearInterval(timer);
          setStreamId(null);
          return total;
        }
        return next;
      });
    }, 16);
    return () => window.clearInterval(timer);
  }, [streamId, messages]);

  // Keep the newest content in view while Keel is typing; stop once the answer is complete.
  useEffect(() => {
    const el = scrollRef.current;
    if (el && (thinking || streamId !== null)) el.scrollTop = el.scrollHeight;
  }, [messages, shown, thinking, streamId]);

  const runAction = (b: Extract<AnswerBlock, { type: "action" }>) => {
    if (b.actionId) {
      const a = actionById[b.actionId];
      approve(b.actionId);
      toast(a?.toast ?? "Done.");
    } else if (b.href) {
      closeAsk();
      router.push(b.href);
    } else {
      demoToast(b.demo);
    }
  };

  const showSuggestions = !streaming && (messages.length === 0 || messages[messages.length - 1]?.role === "keel");

  return (
    <AnimatePresence>
      {askOpen && (
        <div className="fixed inset-0 z-50">
          <motion.div
            className="absolute inset-0 bg-ink/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={closeAsk}
            aria-hidden
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Ask ${platform.name}`}
            className="absolute inset-y-0 right-0 flex w-full max-w-[480px] flex-col border-l border-ink bg-paper"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
          >
            <header className="surface-dark flex items-center gap-3 bg-ink px-6 py-4 text-paper">
              <span className="text-[22px] font-black tracking-[-0.05em]">Ask {platform.name}</span>
              <span className="num ml-1 flex items-center gap-2 text-[11.5px] text-neutral-400">
                <WorkingDot dark />
                {streaming ? "working" : "ready"}
              </span>
              <button
                type="button"
                onClick={closeAsk}
                aria-label={`Close Ask ${platform.name}`}
                className="ml-auto inline-flex size-8 items-center justify-center rounded-[4px] text-neutral-400 hover:text-paper"
              >
                <X className="size-5" />
              </button>
            </header>

            <div ref={scrollRef} className="scroll-thin flex-1 overflow-y-auto px-6 py-6" aria-live="polite">
              {messages.length === 0 && (
                <div className="mb-8">
                  <p className="text-[28px] font-black leading-[1.05] tracking-[-0.03em]">
                    I&apos;ve read every invoice, notice, and deadline. Ask me anything.
                  </p>
                  <p className="mt-3 text-[14px] text-neutral-600">
                    Answers come from your live plan data. Anything I can&apos;t answer goes to {advisor.name}, your licensed advisor.
                  </p>
                </div>
              )}

              <ol className="space-y-6">
                {messages.map((m) => (
                  <li key={m.id}>
                    {m.role === "user" ? (
                      <div className="flex justify-end">
                        <p className="max-w-[85%] rounded-[6px] bg-neutral-100 px-4 py-2.5 text-[14.5px] font-medium">{m.text}</p>
                      </div>
                    ) : (
                      <KeelMessage
                        blocks={m.blocks ?? []}
                        limit={m.id === streamId ? shown : Infinity}
                        fallback={m.fallback}
                        done={state.done}
                        onAction={runAction}
                      />
                    )}
                  </li>
                ))}
                {thinking && (
                  <li className="flex items-center gap-2 text-[13px] text-neutral-500" aria-label={`${platform.name} is typing`}>
                    <span className="flex gap-1" aria-hidden>
                      {[0, 1, 2].map((i) => (
                        <span key={i} className="size-1.5 animate-pulse-dot rounded-full bg-ink" style={{ animationDelay: `${i * 0.16}s` }} />
                      ))}
                    </span>
                    <span className="num">reading plan data…</span>
                  </li>
                )}
              </ol>

              {showSuggestions && (
                <div className={cn(messages.length > 0 && "mt-8 border-t border-neutral-200 pt-5")}>
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                    {messages.length ? "Ask another" : "Suggested"}
                  </p>
                  <ul className={cn(messages.length ? "flex flex-wrap gap-1.5" : "space-y-1.5")}>
                    {ASK_QUESTIONS.map((q) => (
                      <li key={q.id}>
                        <button
                          type="button"
                          onClick={() => ask(q.question)}
                          className={cn(
                            "rounded-[4px] border border-neutral-200 text-left font-medium transition-colors duration-150 hover:border-ink",
                            messages.length ? "px-2.5 py-1.5 text-[12.5px]" : "w-full px-3.5 py-2.5 text-[14px]",
                          )}
                        >
                          {q.question}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <form
              className="border-t border-neutral-200 p-4"
              onSubmit={(e) => {
                e.preventDefault();
                ask(input);
              }}
            >
              <div className="flex items-center gap-2 rounded-[4px] border border-neutral-300 pl-3.5 pr-1.5 focus-within:border-ink">
                <label htmlFor="ask-input" className="sr-only">
                  Ask {platform.name} a question
                </label>
                <input
                  id="ask-input"
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about costs, deadlines, people…"
                  className="h-11 flex-1 bg-transparent text-[14.5px] outline-none placeholder:text-neutral-400"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || streaming}
                  aria-label="Send question"
                  className="inline-flex size-8 items-center justify-center rounded-[3px] bg-ink text-paper disabled:opacity-30"
                >
                  <ArrowUp className="size-4" />
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function KeelMessage({
  blocks,
  limit,
  fallback,
  done,
  onAction,
}: {
  blocks: AnswerBlock[];
  limit: number;
  fallback?: boolean;
  done: Record<string, unknown>;
  onAction: (b: Extract<AnswerBlock, { type: "action" }>) => void;
}) {
  let budget = limit;
  const rendered: React.ReactNode[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (budget <= 0) break;
    const cost = blockCost(b);
    const partial = budget < cost;
    budget -= cost;
    if (b.type === "text") {
      const text = partial ? b.text.slice(0, Math.max(0, cost + budget)) : b.text;
      rendered.push(
        <p key={i} className="whitespace-pre-line text-[14.5px] leading-relaxed">
          {text}
          {partial && <span className="ml-0.5 inline-block h-[1em] w-[7px] translate-y-[2px] animate-blink bg-ink" aria-hidden />}
        </p>,
      );
      continue;
    }
    if (partial) break;
    if (b.type === "table") {
      // Right-align only columns whose cells all look numeric.
      const numeric = b.columns.map((_, ci) => ci > 0 && b.rows.every((r) => /^[−+$\d]/.test(r[ci] ?? "")));
      rendered.push(
        <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18 }} className="overflow-hidden rounded-[6px] border border-neutral-200">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                {b.columns.map((c, ci) => (
                  <th key={c} scope="col" className={cn("px-3 py-2 text-left font-semibold text-neutral-600", numeric[ci] && "text-right")}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((r, ri) => (
                <tr key={ri} className="border-b border-neutral-100 last:border-0">
                  {r.map((cell, ci) => (
                    <td key={ci} className={cn("px-3 py-2 align-top", numeric[ci] && "num whitespace-nowrap text-right")}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>,
      );
      continue;
    }
    if (b.type === "stat") {
      rendered.push(
        <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18 }} className="surface-dark rounded-[6px] bg-ink px-5 py-4 text-paper">
          <p className="num text-[30px] font-bold leading-none tracking-[-0.03em]">{b.value}</p>
          <p className="mt-2 text-[12.5px] text-neutral-400">{b.label}</p>
        </motion.div>,
      );
    } else if (b.type === "action") {
      const isDone = !!(b.actionId && done[b.actionId]);
      rendered.push(
        <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18 }}>
          <Button variant={isDone ? "secondary" : "primary"} disabled={isDone} onClick={() => onAction(b)}>
            {isDone ? (
              <>
                <Check className="size-4" aria-hidden /> Done
              </>
            ) : (
              b.label
            )}
          </Button>
        </motion.div>,
      );
    }
  }
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-[4px] bg-ink text-[13px] font-black text-paper" aria-hidden>
        B
      </span>
      <div className="min-w-0 flex-1 space-y-3">
        {rendered}
        {fallback && limit === Infinity && (
          <div className="flex items-center gap-3 rounded-[6px] border border-neutral-200 px-3.5 py-3">
            <Avatar initials={advisor.initials} size={30} />
            <div className="min-w-0 text-[13px]">
              <p className="font-semibold">{advisor.name}</p>
              <p className="text-neutral-500">
                {advisor.title} · {advisor.availability}
              </p>
            </div>
            <Button size="sm" className="ml-auto" onClick={() => demoToast("Messaging Marco")}>
              Send to Marco
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
