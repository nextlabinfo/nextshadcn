"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { Pool } from "pg";

import { auth } from "@/lib/auth";
import { agingBucket, isMaterial } from "@/lib/finance/format";
import type {
  AgingReport,
  BalanceSheet,
  BudgetVsActual,
  CashFlowStatement,
  CloseTask,
  FinanceKpis,
  FinPeriod,
  ImportEntity,
  ImportResult,
  IncomeStatement,
  Reconciliation,
  StatementLine,
  VarianceLine,
} from "@/lib/finance/types";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ============================================================
// Helpers
// ============================================================

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}

const num = (v: unknown): number => {
  const n = typeof v === "number" ? v : Number.parseFloat(String(v ?? 0));
  return Number.isFinite(n) ? n : 0;
};

const pct = (part: number, whole: number): number => (whole !== 0 ? (part / whole) * 100 : 0);

// pg returns date columns as JS Date objects; convert to YYYY-MM-DD without timezone drift
const toIsoDate = (v: unknown): string => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10));

function mapPeriod(row: Record<string, unknown>): FinPeriod {
  return {
    id: row.id as string,
    name: row.name as string,
    fiscalYear: Number(row.fiscal_year),
    periodNumber: Number(row.period_number),
    startDate: toIsoDate(row.start_date),
    endDate: toIsoDate(row.end_date),
    status: row.status as FinPeriod["status"],
  };
}

// ============================================================
// Periods
// ============================================================

export async function getPeriods(): Promise<FinPeriod[]> {
  await requireSession();
  const res = await pool.query(
    `SELECT id, name, fiscal_year, period_number, start_date, end_date, status
     FROM fin_period ORDER BY fiscal_year DESC, period_number DESC`,
  );
  return res.rows.map(mapPeriod);
}

async function resolvePeriod(periodId?: string): Promise<FinPeriod | null> {
  if (periodId) {
    const r = await pool.query(
      `SELECT id, name, fiscal_year, period_number, start_date, end_date, status FROM fin_period WHERE id = $1`,
      [periodId],
    );
    return r.rowCount ? mapPeriod(r.rows[0]) : null;
  }
  // Default: the period containing today, else the latest period with any activity.
  const r = await pool.query(
    `SELECT id, name, fiscal_year, period_number, start_date, end_date, status
     FROM fin_period
     ORDER BY (CASE WHEN current_date BETWEEN start_date AND end_date THEN 0 ELSE 1 END),
              fiscal_year DESC, period_number DESC
     LIMIT 1`,
  );
  return r.rowCount ? mapPeriod(r.rows[0]) : null;
}

async function priorPeriod(p: FinPeriod): Promise<FinPeriod | null> {
  const r = await pool.query(
    `SELECT id, name, fiscal_year, period_number, start_date, end_date, status
     FROM fin_period WHERE fiscal_year = $1 AND period_number = $2`,
    [p.fiscalYear, p.periodNumber - 1],
  );
  return r.rowCount ? mapPeriod(r.rows[0]) : null;
}

// Natural per-account activity for a single period (P&L or balance accounts).
async function periodNatural(periodId: string, types: string[]): Promise<StatementLine[]> {
  const res = await pool.query(
    `SELECT a.code, a.name,
            CASE WHEN a.normal_balance = 'credit'
                 THEN COALESCE(SUM(l.credit - l.debit), 0)
                 ELSE COALESCE(SUM(l.debit - l.credit), 0) END AS amount
     FROM fin_account a
     LEFT JOIN (
       SELECT jl.account_id, jl.debit, jl.credit
       FROM fin_journal_line jl
       JOIN fin_journal_entry je ON je.id = jl.entry_id
       WHERE je.status = 'posted' AND je.period_id = $1
     ) l ON l.account_id = a.id
     WHERE a.account_type = ANY($2)
     GROUP BY a.id
     ORDER BY a.code`,
    [periodId, types],
  );
  return res.rows.map((r) => ({ code: r.code as string, name: r.name as string, amount: num(r.amount) }));
}

// Natural cumulative balances through a date (inclusive).
async function cumulativeNatural(endDate: string, types: string[]): Promise<StatementLine[]> {
  const res = await pool.query(
    `SELECT a.code, a.name,
            CASE WHEN a.normal_balance = 'credit'
                 THEN COALESCE(SUM(l.credit - l.debit), 0)
                 ELSE COALESCE(SUM(l.debit - l.credit), 0) END AS amount
     FROM fin_account a
     LEFT JOIN (
       SELECT jl.account_id, jl.debit, jl.credit
       FROM fin_journal_line jl
       JOIN fin_journal_entry je ON je.id = jl.entry_id
       WHERE je.status = 'posted' AND je.entry_date <= $1
     ) l ON l.account_id = a.id
     WHERE a.account_type = ANY($2)
     GROUP BY a.id
     ORDER BY a.code`,
    [endDate, types],
  );
  return res.rows.map((r) => ({ code: r.code as string, name: r.name as string, amount: num(r.amount) }));
}

function netIncomeFrom(lines: StatementLine[], byType: Record<string, string>): number {
  let ni = 0;
  for (const l of lines) {
    const t = byType[l.code];
    if (t === "revenue" || t === "other_income") ni += l.amount;
    else if (t === "cogs" || t === "expense" || t === "other_expense") ni -= l.amount;
  }
  return ni;
}

async function accountTypeMap(): Promise<Record<string, string>> {
  const res = await pool.query(`SELECT code, account_type FROM fin_account`);
  const m: Record<string, string> = {};
  for (const r of res.rows) m[r.code as string] = r.account_type as string;
  return m;
}

// ============================================================
// Income statement
// ============================================================

export async function getIncomeStatement(periodId?: string): Promise<IncomeStatement | null> {
  await requireSession();
  const p = await resolvePeriod(periodId);
  if (!p) return null;

  const lines = await periodNatural(p.id, ["revenue", "cogs", "expense", "other_income", "other_expense"]);
  const types = await accountTypeMap();

  const revenue = lines.filter((l) => types[l.code] === "revenue" && l.amount !== 0);
  const cogs = lines.filter((l) => types[l.code] === "cogs" && l.amount !== 0);
  const opex = lines.filter((l) => types[l.code] === "expense" && l.amount !== 0);
  const otherItems = lines.filter(
    (l) => (types[l.code] === "other_income" || types[l.code] === "other_expense") && l.amount !== 0,
  );

  const totRevenue = revenue.reduce((s, l) => s + l.amount, 0);
  const totCogs = cogs.reduce((s, l) => s + l.amount, 0);
  const grossProfit = totRevenue - totCogs;
  const totOpex = opex.reduce((s, l) => s + l.amount, 0);
  const operatingIncome = grossProfit - totOpex;
  const otherNet = otherItems.reduce((s, l) => s + (types[l.code] === "other_income" ? l.amount : -l.amount), 0);
  const deprec = opex.find((l) => l.code === "6400")?.amount ?? 0;
  const ebitda = operatingIncome + deprec;
  const netIncome = operatingIncome + otherNet;

  const prev = await priorPeriod(p);
  let prior: IncomeStatement["prior"] = null;
  if (prev) {
    const pl = await periodNatural(prev.id, ["revenue", "cogs", "expense", "other_income", "other_expense"]);
    const pr = pl.filter((l) => types[l.code] === "revenue").reduce((s, l) => s + l.amount, 0);
    const pc = pl.filter((l) => types[l.code] === "cogs").reduce((s, l) => s + l.amount, 0);
    const po = pl.filter((l) => types[l.code] === "expense").reduce((s, l) => s + l.amount, 0);
    const pgp = pr - pc;
    prior = {
      revenue: pr,
      grossProfit: pgp,
      operatingIncome: pgp - po,
      netIncome: netIncomeFrom(pl, types),
    };
  }

  return {
    periodName: p.name,
    status: p.status,
    priorPeriodName: prev?.name ?? null,
    revenue,
    cogs,
    opex,
    otherItems: otherItems.map((l) => ({
      ...l,
      amount: types[l.code] === "other_expense" ? -l.amount : l.amount,
    })),
    totals: {
      revenue: totRevenue,
      cogs: totCogs,
      grossProfit,
      grossMarginPct: pct(grossProfit, totRevenue),
      opex: totOpex,
      operatingIncome,
      operatingMarginPct: pct(operatingIncome, totRevenue),
      otherNet,
      ebitda,
      ebitdaMarginPct: pct(ebitda, totRevenue),
      netIncome,
      netMarginPct: pct(netIncome, totRevenue),
    },
    prior,
  };
}

// ============================================================
// Balance sheet
// ============================================================

export async function getBalanceSheet(periodId?: string): Promise<BalanceSheet | null> {
  await requireSession();
  const p = await resolvePeriod(periodId);
  if (!p) return null;

  const types = await accountTypeMap();
  const balances = await cumulativeNatural(p.endDate, ["asset", "liability", "equity"]);
  const plCum = await cumulativeNatural(p.endDate, ["revenue", "cogs", "expense", "other_income", "other_expense"]);
  const netIncomeYtd = netIncomeFrom(plCum, types);

  const assets = balances.filter((l) => types[l.code] === "asset" && l.amount !== 0);
  const liabilities = balances.filter((l) => types[l.code] === "liability" && l.amount !== 0);
  const equityBase = balances.filter((l) => types[l.code] === "equity" && l.amount !== 0);
  const equity = [...equityBase, { code: "NI", name: "Net income (current year)", amount: netIncomeYtd }];

  const totAssets = assets.reduce((s, l) => s + l.amount, 0);
  const totLiab = liabilities.reduce((s, l) => s + l.amount, 0);
  const totEquity = equity.reduce((s, l) => s + l.amount, 0);

  return {
    periodName: p.name,
    status: p.status,
    assets,
    liabilities,
    equity,
    totals: {
      assets: totAssets,
      liabilities: totLiab,
      equity: totEquity,
      netIncomeYtd,
      liabilitiesAndEquity: totLiab + totEquity,
      isBalanced: Math.abs(totAssets - (totLiab + totEquity)) < 1,
    },
  };
}

// ============================================================
// Cash flow (indirect)
// ============================================================

export async function getCashFlow(periodId?: string): Promise<CashFlowStatement | null> {
  await requireSession();
  const p = await resolvePeriod(periodId);
  if (!p) return null;

  const types = await accountTypeMap();

  // Raw (debit-positive) period delta per account code.
  const rawRes = await pool.query(
    `SELECT a.code, COALESCE(SUM(l.debit - l.credit), 0) AS raw
     FROM fin_account a
     LEFT JOIN (
       SELECT jl.account_id, jl.debit, jl.credit
       FROM fin_journal_line jl
       JOIN fin_journal_entry je ON je.id = jl.entry_id
       WHERE je.status = 'posted' AND je.period_id = $1
     ) l ON l.account_id = a.id
     GROUP BY a.code`,
    [p.id],
  );
  const raw: Record<string, number> = {};
  for (const r of rawRes.rows) raw[r.code as string] = num(r.raw);

  const plLines = await periodNatural(p.id, ["revenue", "cogs", "expense", "other_income", "other_expense"]);
  const netIncome = netIncomeFrom(plLines, types);
  const deprec = raw["6400"] ?? 0;

  const operating: StatementLine[] = [
    { code: "NI", name: "Net income", amount: netIncome },
    { code: "DEP", name: "Depreciation & amortization", amount: deprec },
    { code: "AR", name: "Change in accounts receivable", amount: -(raw["1100"] ?? 0) },
    { code: "INV", name: "Change in inventory", amount: -(raw["1200"] ?? 0) },
    { code: "AP", name: "Change in accounts payable", amount: -(raw["2000"] ?? 0) },
    { code: "ACC", name: "Change in accrued liabilities", amount: -(raw["2100"] ?? 0) },
    { code: "DEF", name: "Change in deferred revenue", amount: -(raw["2200"] ?? 0) },
  ].filter((l) => l.amount !== 0);

  const capex = -(raw["1300"] ?? 0);
  const investing: StatementLine[] = [{ code: "CAPEX", name: "Capital expenditures", amount: capex }].filter(
    (l) => l.amount !== 0,
  );

  const financing: StatementLine[] = [
    { code: "DEBT", name: "Change in long-term debt", amount: -(raw["2500"] ?? 0) },
    { code: "EQ", name: "Equity issuance", amount: -(raw["3000"] ?? 0) },
  ].filter((l) => l.amount !== 0);

  const totOp = operating.reduce((s, l) => s + l.amount, 0);
  const totInv = investing.reduce((s, l) => s + l.amount, 0);
  const totFin = financing.reduce((s, l) => s + l.amount, 0);
  const netChange = totOp + totInv + totFin;

  const beginRes = await pool.query(
    `SELECT COALESCE(SUM(jl.debit - jl.credit), 0) AS bal
     FROM fin_journal_line jl
     JOIN fin_journal_entry je ON je.id = jl.entry_id
     JOIN fin_account a ON a.id = jl.account_id
     WHERE je.status = 'posted' AND a.is_cash = true AND je.entry_date < $1`,
    [p.startDate],
  );
  const beginningCash = num(beginRes.rows[0]?.bal);

  return {
    periodName: p.name,
    status: p.status,
    operating,
    investing,
    financing,
    totals: {
      operating: totOp,
      investing: totInv,
      financing: totFin,
      netChange,
      beginningCash,
      endingCash: beginningCash + netChange,
      freeCashFlow: totOp + totInv,
    },
  };
}

// ============================================================
// Budget vs actual (variance)
// ============================================================

export async function getBudgetVsActual(periodId?: string): Promise<BudgetVsActual | null> {
  await requireSession();
  const p = await resolvePeriod(periodId);
  if (!p) return null;

  const types = await accountTypeMap();
  const actuals = await periodNatural(p.id, ["revenue", "cogs", "expense", "other_income", "other_expense"]);

  const budRes = await pool.query(
    `SELECT a.code, a.name, COALESCE(SUM(b.amount), 0) AS budget
     FROM fin_account a
     LEFT JOIN fin_budget_line b
       ON b.account_id = a.id AND b.fiscal_year = $1 AND b.period_number = $2 AND b.scenario = 'budget'
     WHERE a.account_type IN ('revenue','cogs','expense','other_income','other_expense')
     GROUP BY a.id`,
    [p.fiscalYear, p.periodNumber],
  );
  const budget: Record<string, number> = {};
  const nameByCode: Record<string, string> = {};
  for (const r of budRes.rows) {
    budget[r.code as string] = num(r.budget);
    nameByCode[r.code as string] = r.name as string;
  }
  const actualByCode: Record<string, number> = {};
  for (const l of actuals) actualByCode[l.code] = l.amount;

  const codes = new Set([...Object.keys(budget), ...actuals.map((l) => l.code)]);
  const revenue: VarianceLine[] = [];
  const expenses: VarianceLine[] = [];

  for (const code of codes) {
    const t = types[code];
    const actual = actualByCode[code] ?? 0;
    const bud = budget[code] ?? 0;
    if (actual === 0 && bud === 0) continue;
    const varianceAmount = actual - bud;
    const isRevenue = t === "revenue" || t === "other_income";
    const favorable = isRevenue ? varianceAmount >= 0 : varianceAmount <= 0;
    const line: VarianceLine = {
      code,
      name: nameByCode[code] ?? code,
      actual,
      budget: bud,
      varianceAmount,
      variancePct: pct(varianceAmount, bud),
      favorable,
      material: isMaterial(varianceAmount, bud),
    };
    if (isRevenue) revenue.push(line);
    else expenses.push(line);
  }

  revenue.sort((a, b) => a.code.localeCompare(b.code));
  expenses.sort((a, b) => a.code.localeCompare(b.code));

  const actualRevenue = revenue.reduce((s, l) => s + l.actual, 0);
  const budgetRevenue = revenue.reduce((s, l) => s + l.budget, 0);
  const actualExpense = expenses.reduce((s, l) => s + l.actual, 0);
  const budgetExpense = expenses.reduce((s, l) => s + l.budget, 0);

  return {
    periodName: p.name,
    status: p.status,
    revenue,
    expenses,
    totals: {
      actualRevenue,
      budgetRevenue,
      actualExpense,
      budgetExpense,
      actualNetIncome: actualRevenue - actualExpense,
      budgetNetIncome: budgetRevenue - budgetExpense,
      netVariance: actualRevenue - actualExpense - (budgetRevenue - budgetExpense),
    },
  };
}

// ============================================================
// AR / AP aging
// ============================================================

async function trailingPerDay(group: string[], refDate: string): Promise<number> {
  // Sum natural activity for the account group over the ~90 days before refDate, / 90.
  const res = await pool.query(
    `SELECT COALESCE(SUM(
              CASE WHEN a.normal_balance = 'credit'
                   THEN (jl.credit - jl.debit)
                   ELSE (jl.debit - jl.credit) END
            ), 0) AS total
     FROM fin_journal_line jl
     JOIN fin_journal_entry je ON je.id = jl.entry_id
     JOIN fin_account a ON a.id = jl.account_id
     WHERE je.status = 'posted'
       AND a.account_type = ANY($1)
       AND je.entry_date > ($2::date - INTERVAL '90 days')
       AND je.entry_date <= $2::date`,
    [group, refDate],
  );
  return num(res.rows[0]?.total) / 90;
}

async function buildAging(table: "ar" | "ap", asOf: string): Promise<AgingReport> {
  const isAr = table === "ar";
  const tableName = isAr ? "fin_ar_invoice" : "fin_ap_bill";
  const refCol = isAr ? "invoice_no" : "bill_no";
  const partyCol = isAr ? "customer_name" : "vendor_name";
  const dateCol = isAr ? "invoice_date" : "bill_date";

  const res = await pool.query(
    `SELECT id, ${refCol} AS reference, ${partyCol} AS party, ${dateCol} AS doc_date, due_date,
            (amount - amount_paid) AS outstanding,
            ($1::date - due_date) AS days_past_due
     FROM ${tableName}
     WHERE status IN ('open','partial') AND (amount - amount_paid) > 0
     ORDER BY due_date ASC`,
    [asOf],
  );

  const buckets: Record<string, { amount: number; count: number }> = {
    Current: { amount: 0, count: 0 },
    "1–30": { amount: 0, count: 0 },
    "31–60": { amount: 0, count: 0 },
    "61–90": { amount: 0, count: 0 },
    "90+": { amount: 0, count: 0 },
  };

  const rows = res.rows.map((r) => {
    const dpd = Number(r.days_past_due);
    const bucket = agingBucket(dpd);
    const outstanding = num(r.outstanding);
    buckets[bucket].amount += outstanding;
    buckets[bucket].count += 1;
    return {
      id: r.id as string,
      reference: r.reference as string,
      party: r.party as string,
      date: String(r.doc_date).slice(0, 10),
      dueDate: String(r.due_date).slice(0, 10),
      outstanding,
      daysPastDue: dpd,
      bucket,
    };
  });

  const totalOutstanding = rows.reduce((s, r) => s + r.outstanding, 0);

  const report: AgingReport = {
    asOf,
    totalOutstanding,
    buckets: Object.entries(buckets).map(([label, v]) => ({ label, amount: v.amount, count: v.count })),
    rows,
  };

  if (isAr) {
    const revPerDay = await trailingPerDay(["revenue"], asOf);
    report.dso = revPerDay > 0 ? totalOutstanding / revPerDay : 0;
  } else {
    const cogsPerDay = await trailingPerDay(["cogs"], asOf);
    report.dpo = cogsPerDay > 0 ? totalOutstanding / cogsPerDay : 0;
  }
  return report;
}

export async function getArAging(asOf?: string): Promise<AgingReport> {
  await requireSession();
  const date = asOf ?? new Date().toISOString().slice(0, 10);
  return buildAging("ar", date);
}

export async function getApAging(asOf?: string): Promise<AgingReport> {
  await requireSession();
  const date = asOf ?? new Date().toISOString().slice(0, 10);
  return buildAging("ap", date);
}

// ============================================================
// KPIs
// ============================================================

export async function getFinanceKpis(periodId?: string): Promise<FinanceKpis | null> {
  await requireSession();
  const is = await getIncomeStatement(periodId);
  const bs = await getBalanceSheet(periodId);
  const cf = await getCashFlow(periodId);
  const ar = await getArAging();
  const ap = await getApAging();
  if (!is || !bs || !cf) return null;

  const currentAssets = bs.assets
    .filter((l) => ["1000", "1100", "1200"].includes(l.code))
    .reduce((s, l) => s + l.amount, 0);
  const currentLiabilities = bs.liabilities
    .filter((l) => ["2000", "2100", "2200"].includes(l.code))
    .reduce((s, l) => s + l.amount, 0);
  const cash = bs.assets.find((l) => l.code === "1000")?.amount ?? 0;
  const arBal = bs.assets.find((l) => l.code === "1100")?.amount ?? 0;

  const revenueGrowthPct =
    is.prior && is.prior.revenue !== 0 ? ((is.totals.revenue - is.prior.revenue) / is.prior.revenue) * 100 : null;

  return {
    periodName: is.periodName,
    revenue: is.totals.revenue,
    revenueGrowthPct,
    grossMarginPct: is.totals.grossMarginPct,
    operatingMarginPct: is.totals.operatingMarginPct,
    ebitdaMarginPct: is.totals.ebitdaMarginPct,
    netIncome: is.totals.netIncome,
    currentRatio: currentLiabilities !== 0 ? currentAssets / currentLiabilities : 0,
    quickRatio: currentLiabilities !== 0 ? (cash + arBal) / currentLiabilities : 0,
    workingCapital: currentAssets - currentLiabilities,
    cashBalance: cash,
    freeCashFlow: cf.totals.freeCashFlow,
    dso: ar.dso ?? 0,
    dpo: ap.dpo ?? 0,
  };
}

// ============================================================
// Close tasks
// ============================================================

export async function getCloseTasks(periodId?: string): Promise<CloseTask[]> {
  await requireSession();
  const p = await resolvePeriod(periodId);
  if (!p) return [];
  const res = await pool.query(
    `SELECT id, title, close_level, day_offset, owner, status, due_date
     FROM fin_close_task WHERE period_id = $1
     ORDER BY close_level ASC, day_offset ASC, title ASC`,
    [p.id],
  );
  return res.rows.map((r) => ({
    id: r.id as string,
    title: r.title as string,
    closeLevel: Number(r.close_level),
    dayOffset: Number(r.day_offset),
    owner: (r.owner as string | null) ?? null,
    status: r.status as CloseTask["status"],
    dueDate: r.due_date ? String(r.due_date).slice(0, 10) : null,
  }));
}

export async function updateCloseTaskStatus(id: string, status: CloseTask["status"]): Promise<void> {
  await requireSession();
  const completedAt = status === "complete" ? "now()" : "NULL";
  await pool.query(
    `UPDATE fin_close_task SET status = $1, completed_at = ${completedAt}, updated_at = now() WHERE id = $2`,
    [status, id],
  );
  revalidatePath("/dashboard/finance-analyst");
}

// ============================================================
// Reconciliations
// ============================================================

export async function getReconciliations(periodId?: string): Promise<Reconciliation[]> {
  await requireSession();
  const p = await resolvePeriod(periodId);
  if (!p) return [];
  const res = await pool.query(
    `SELECT r.id, r.rec_type, r.gl_balance, r.subledger_balance, r.status, r.prepared_by,
            a.name AS account_name
     FROM fin_reconciliation r
     LEFT JOIN fin_account a ON a.id = r.account_id
     WHERE r.period_id = $1
     ORDER BY r.created_at ASC`,
    [p.id],
  );
  const recs: Reconciliation[] = [];
  for (const r of res.rows) {
    const items = await pool.query(
      `SELECT id, description, amount, classification, item_date FROM fin_reconciliation_item
       WHERE reconciliation_id = $1 ORDER BY created_at ASC`,
      [r.id],
    );
    recs.push({
      id: r.id as string,
      accountName: (r.account_name as string | null) ?? null,
      recType: r.rec_type as string,
      glBalance: num(r.gl_balance),
      subledgerBalance: num(r.subledger_balance),
      difference: num(r.gl_balance) - num(r.subledger_balance),
      status: r.status as Reconciliation["status"],
      preparedBy: (r.prepared_by as string | null) ?? null,
      items: items.rows.map((it) => ({
        id: it.id as string,
        description: it.description as string,
        amount: num(it.amount),
        classification: it.classification as string,
        itemDate: it.item_date ? String(it.item_date).slice(0, 10) : null,
      })),
    });
  }
  return recs;
}

// ============================================================
// Import (CSV / XLSX rows → tables)
// ============================================================

const isValidDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

export async function importFinanceData(entity: ImportEntity, rows: Record<string, string>[]): Promise<ImportResult> {
  await requireSession();
  const result: ImportResult = { entity, inserted: 0, skipped: 0, errors: [] };
  const pushErr = (i: number, msg: string) => {
    result.skipped += 1;
    if (result.errors.length < 50) result.errors.push(`Row ${i + 1}: ${msg}`);
  };

  if (entity === "ar_invoice" || entity === "ap_bill") {
    const isAr = entity === "ar_invoice";
    const refKey = isAr ? "invoice_no" : "bill_no";
    const partyKey = isAr ? "customer_name" : "vendor_name";
    const dateKey = isAr ? "invoice_date" : "bill_date";
    const table = isAr ? "fin_ar_invoice" : "fin_ap_bill";

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const ref = (r[refKey] ?? "").trim();
      const party = (r[partyKey] ?? "").trim();
      const docDate = (r[dateKey] ?? "").trim();
      const dueDate = (r.due_date ?? "").trim();
      const amount = Number.parseFloat(r.amount ?? "");
      const amountPaid = Number.parseFloat(r.amount_paid ?? "0") || 0;
      const status = (r.status ?? "open").trim() || "open";

      if (!ref) {
        pushErr(i, `${refKey} is required`);
        continue;
      }
      if (!party) {
        pushErr(i, `${partyKey} is required`);
        continue;
      }
      if (!isValidDate(docDate)) {
        pushErr(i, `${dateKey} must be YYYY-MM-DD`);
        continue;
      }
      if (!isValidDate(dueDate)) {
        pushErr(i, `due_date must be YYYY-MM-DD`);
        continue;
      }
      if (!Number.isFinite(amount)) {
        pushErr(i, `amount must be a number`);
        continue;
      }
      if (!["open", "paid", "partial", "void"].includes(status)) {
        pushErr(i, `invalid status "${status}"`);
        continue;
      }

      await pool.query(
        `INSERT INTO ${table} (${refKey}, ${partyKey}, ${dateKey}, due_date, amount, amount_paid, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [ref, party, docDate, dueDate, amount, amountPaid, status],
      );
      result.inserted += 1;
    }
  } else if (entity === "budget") {
    const acctRes = await pool.query(`SELECT id, code FROM fin_account`);
    const acctByCode: Record<string, string> = {};
    for (const a of acctRes.rows) acctByCode[a.code as string] = a.id as string;

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const code = (r.account_code ?? "").trim();
      const fy = Number.parseInt(r.fiscal_year ?? "", 10);
      const pn = Number.parseInt(r.period_number ?? "", 10);
      const amount = Number.parseFloat(r.amount ?? "");
      const scenario = (r.scenario ?? "budget").trim() || "budget";

      if (!acctByCode[code]) {
        pushErr(i, `unknown account_code "${code}"`);
        continue;
      }
      if (!Number.isFinite(fy)) {
        pushErr(i, `fiscal_year must be a number`);
        continue;
      }
      if (!Number.isFinite(pn) || pn < 1 || pn > 12) {
        pushErr(i, `period_number must be 1-12`);
        continue;
      }
      if (!Number.isFinite(amount)) {
        pushErr(i, `amount must be a number`);
        continue;
      }
      if (!["budget", "forecast", "plan"].includes(scenario)) {
        pushErr(i, `invalid scenario "${scenario}"`);
        continue;
      }

      await pool.query(
        `INSERT INTO fin_budget_line (fiscal_year, period_number, account_id, amount, scenario)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (fiscal_year, period_number, account_id, department_id, scenario)
         DO UPDATE SET amount = EXCLUDED.amount`,
        [fy, pn, acctByCode[code], amount, scenario],
      );
      result.inserted += 1;
    }
  }

  revalidatePath("/dashboard/finance-analyst");
  return result;
}
