const whole = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const cents = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "$12,480" (or "$12,480.50" with cents) */
export function money(n: number, opts: { cents?: boolean; sign?: boolean } = {}): string {
  const abs = Math.abs(n);
  const body = opts.cents ? cents.format(abs) : whole.format(Math.round(abs));
  const sign = n < 0 ? "−" : opts.sign && n > 0 ? "+" : "";
  return `${sign}$${body}`;
}

/** "$72.2k" */
export function moneyK(n: number): string {
  if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return money(n);
}

export function num(n: number, digits = 0): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

export function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}
