// Client-safe formatting + helpers for the finance-analyst module.

export function fmtCurrency(value: number, opts: { compact?: boolean; cents?: boolean } = {}): string {
  const { compact = false, cents = false } = opts;
  let maxFrac: number;
  let minFrac: number;
  if (compact) {
    maxFrac = 1;
    minFrac = 0;
  } else if (cents) {
    maxFrac = 2;
    minFrac = 2;
  } else {
    maxFrac = 0;
    minFrac = 0;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: maxFrac,
    minimumFractionDigits: minFrac,
  }).format(value);
}

export function fmtPct(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

export function fmtSignedPct(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

export function fmtNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

// Materiality: default 5% or $50k per the finance-analyst playbook.
export function isMaterial(varianceAmount: number, basis: number, pctThreshold = 5, dollarThreshold = 50000): boolean {
  const pct = basis !== 0 ? Math.abs(varianceAmount / basis) * 100 : Infinity;
  return Math.abs(varianceAmount) >= dollarThreshold || pct >= pctThreshold;
}

export const AGING_BUCKETS = ["Current", "1–30", "31–60", "61–90", "90+"] as const;

export function agingBucket(daysPastDue: number): string {
  if (daysPastDue <= 0) return "Current";
  if (daysPastDue <= 30) return "1–30";
  if (daysPastDue <= 60) return "31–60";
  if (daysPastDue <= 90) return "61–90";
  return "90+";
}

export const CLOSE_STATUS_LABEL: Record<string, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  blocked: "Blocked",
  complete: "Complete",
};

export function csvEscape(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(headers: string[], rows: (string | number | null)[][]): string {
  const head = headers.map(csvEscape).join(",");
  const body = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
  return `${head}\n${body}`;
}
