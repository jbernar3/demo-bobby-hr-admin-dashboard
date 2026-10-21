"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import Link from "next/link";
import {
  type ButtonHTMLAttributes,
  type ReactNode,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
} from "react";
import { cn } from "@/lib/format";

// ── Button ─────────────────────────────────────────────────────

type ButtonVariant = "primary" | "secondary" | "ghost" | "inverse" | "inverse-outline";

const buttonBase =
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[4px] font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 select-none";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-ink text-paper hover:bg-neutral-800 border border-ink",
  secondary: "bg-paper text-ink border border-neutral-300 hover:border-ink",
  ghost: "text-neutral-600 hover:text-ink hover:bg-neutral-100 border border-transparent",
  inverse: "bg-paper text-ink border border-paper hover:bg-neutral-200",
  "inverse-outline": "bg-transparent text-paper border border-neutral-600 hover:border-paper",
};

const buttonSizes = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-9 px-3.5 text-sm",
  lg: "h-11 px-5 text-[15px]",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: keyof typeof buttonSizes;
}

export function Button({ variant = "secondary", size = "md", className, type = "button", ...rest }: ButtonProps) {
  return <button type={type} className={cn(buttonBase, buttonVariants[variant], buttonSizes[size], className)} {...rest} />;
}

export function ButtonLink({
  href,
  variant = "secondary",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: keyof typeof buttonSizes;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={cn(buttonBase, buttonVariants[variant], buttonSizes[size], className)}>
      {children}
    </Link>
  );
}

// ── Badges & status ────────────────────────────────────────────

type BadgeTone = "outline" | "solid" | "muted" | "signal" | "inverse";

const badgeTones: Record<BadgeTone, string> = {
  outline: "border border-neutral-300 text-neutral-700 bg-paper",
  solid: "bg-ink text-paper border border-ink",
  muted: "bg-neutral-100 text-neutral-600 border border-neutral-100",
  signal: "bg-signal-ink text-paper border border-signal-ink",
  inverse: "bg-paper text-ink border border-paper",
};

export function Badge({
  tone = "outline",
  children,
  className,
  mono,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
  mono?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center gap-1 whitespace-nowrap rounded-[3px] px-1.5 text-[11.5px] font-semibold leading-none",
        mono && "num font-medium",
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Status pill with a leading shape: ● solid = done, ○ ring = pending, ■ red = urgent. */
export function Status({
  kind,
  children,
}: {
  kind: "done" | "pending" | "urgent" | "info" | "neutral";
  children: ReactNode;
}) {
  const dot = {
    done: "bg-ink",
    pending: "border-[1.5px] border-ink bg-paper",
    urgent: "bg-signal",
    info: "border-[1.5px] border-dashed border-neutral-500",
    neutral: "bg-neutral-300",
  }[kind];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap text-[12.5px] font-medium",
        kind === "urgent" ? "text-signal-ink" : kind === "neutral" ? "text-neutral-500" : "text-ink",
      )}
    >
      <span aria-hidden className={cn("inline-block size-2 shrink-0 rounded-full", dot)} />
      {children}
    </span>
  );
}

export function Kbd({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return (
    <kbd
      className={cn(
        "num inline-flex h-5 min-w-5 items-center justify-center rounded-[3px] border px-1 text-[11px] font-medium",
        dark ? "border-neutral-700 text-neutral-400" : "border-neutral-300 text-neutral-500",
      )}
    >
      {children}
    </kbd>
  );
}

export function Avatar({
  initials,
  size = 32,
  dark,
  className,
}: {
  initials: string;
  size?: number;
  dark?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-bold tracking-tight",
        dark ? "bg-paper text-ink" : "bg-ink text-paper",
        className,
      )}
    >
      {initials}
    </span>
  );
}

// ── Layout helpers ─────────────────────────────────────────────

export function PageHeader({
  eyebrow,
  title,
  sub,
  right,
}: {
  eyebrow?: string;
  title: ReactNode;
  sub?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <header className="mb-10 flex flex-wrap items-end justify-between gap-6">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-500">{eyebrow}</p>
        )}
        <h1 className="text-[44px] font-black leading-[0.95] tracking-[-0.04em] md:text-[56px]">{title}</h1>
        {sub && <p className="mt-4 max-w-2xl text-[17px] leading-snug text-neutral-600">{sub}</p>}
      </div>
      {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
    </header>
  );
}

export function SectionTitle({
  children,
  right,
  id,
  count,
}: {
  children: ReactNode;
  right?: ReactNode;
  id?: string;
  count?: number;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4 border-b border-ink pb-2.5">
      <h2 id={id} className="flex items-baseline gap-2 text-[13px] font-bold uppercase tracking-[0.12em]">
        {children}
        {count !== undefined && <span className="num text-neutral-500">{count}</span>}
      </h2>
      {right}
    </div>
  );
}

export function Panel({
  children,
  className,
  dark,
  as: Tag = "section",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  dark?: boolean;
  as?: "section" | "div" | "article" | "aside";
  "aria-labelledby"?: string;
  "aria-label"?: string;
}) {
  return (
    <Tag
      className={cn(
        "rounded-[6px] border",
        dark ? "surface-dark border-ink bg-ink text-paper" : "border-neutral-200 bg-paper",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** Small label/value pair. */
export function Meta({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-neutral-500">{label}</dt>
      <dd className="mt-1 text-[14px]">{children}</dd>
    </div>
  );
}

// ── Motion ─────────────────────────────────────────────────────

export function Reveal({
  children,
  index = 0,
  className,
  as = "div",
}: {
  children: ReactNode;
  index?: number;
  className?: string;
  as?: "div" | "li" | "section";
}) {
  const Comp = as === "li" ? motion.li : as === "section" ? motion.section : motion.div;
  // Same initial props on server and client; MotionConfig handles reduced motion.
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index, 10) * 0.035, ease: [0.2, 0, 0, 1] }}
    >
      {children}
    </Comp>
  );
}

const counted = new Set<string>();

/**
 * Counts up from 0 on first appearance (once per key per session).
 * The final value is server-rendered; the animation rewrites text before paint.
 */
export function CountUp({
  value,
  format,
  id,
  duration = 650,
  className,
}: {
  value: number;
  format: (n: number) => string;
  id: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const formatRef = useRef(format);
  const valueRef = useRef(value);

  useLayoutEffect(() => {
    formatRef.current = format;
    valueRef.current = value;
  });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce || counted.has(id)) {
      el.textContent = formatRef.current(valueRef.current);
      return;
    }
    counted.add(id);
    let raf = 0;
    const start = performance.now();
    const target = valueRef.current;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = formatRef.current(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    el.textContent = formatRef.current(0);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      el.textContent = formatRef.current(valueRef.current);
    };
  }, [id, duration, reduce]);

  // Later value changes (e.g. after an approval) update immediately.
  useEffect(() => {
    if (ref.current && counted.has(id)) ref.current.textContent = format(value);
  }, [value, format, id]);

  return (
    <span ref={ref} className={cn("num", className)}>
      {format(value)}
    </span>
  );
}

// ── Drawer (right-side dialog) ─────────────────────────────────

export function Drawer({
  open,
  onClose,
  title,
  children,
  width = 560,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  width?: number;
  footer?: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const labelId = useId();
  useDialogBehavior(open, onClose, panelRef);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            className="absolute inset-0 bg-ink/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelId}
            tabIndex={-1}
            style={{ maxWidth: width }}
            className="absolute inset-y-0 right-0 flex w-full flex-col border-l border-ink bg-paper outline-none"
            initial={{ x: 32, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 32, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-neutral-200 px-7 py-5">
              <div id={labelId} className="min-w-0 flex-1">
                {title}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close panel"
                className="-mr-2 inline-flex size-9 items-center justify-center rounded-[4px] text-neutral-500 hover:bg-neutral-100 hover:text-ink"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="scroll-thin flex-1 overflow-y-auto px-7 py-6">{children}</div>
            {footer && <div className="border-t border-neutral-200 px-7 py-4">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/** Escape to close, focus moves into the dialog, Tab stays inside, focus returns on close. */
export function useDialogBehavior(
  open: boolean,
  onClose: () => void,
  panelRef: React.RefObject<HTMLElement | null>,
  initialFocusRef?: React.RefObject<HTMLElement | null>,
) {
  const onCloseRef = useRef(onClose);
  useLayoutEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusTimer = window.setTimeout(() => {
      (initialFocusRef?.current ?? panelRef.current)?.focus();
    }, 10);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, [open, panelRef, initialFocusRef]);
}

// ── Segmented control ──────────────────────────────────────────

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode }[];
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-[4px] border border-neutral-300 p-0.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-[3px] px-3 text-[13px] font-semibold transition-colors duration-150",
              active ? "bg-ink text-paper" : "text-neutral-600 hover:text-ink",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Pulsing "Keel is working" dot. */
export function WorkingDot({ dark, className }: { dark?: boolean; className?: string }) {
  return (
    <span aria-hidden className={cn("relative inline-flex size-2", className)}>
      <span className={cn("absolute inset-0 animate-pulse-dot rounded-full", dark ? "bg-paper" : "bg-ink")} />
    </span>
  );
}
