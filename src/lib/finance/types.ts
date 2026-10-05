// Shared finance-analyst types used by both server actions and client components.

export interface FinPeriod {
  id: string;
  name: string;
  fiscalYear: number;
  periodNumber: number;
  startDate: string;
  endDate: string;
  status: "open" | "closed" | "locked";
}

export interface StatementLine {
  code: string;
  name: string;
  amount: number;
}

export interface IncomeStatement {
  periodName: string;
  status: FinPeriod["status"];
  priorPeriodName: string | null;
  revenue: StatementLine[];
  cogs: StatementLine[];
  opex: StatementLine[];
  otherItems: StatementLine[];
  totals: {
    revenue: number;
    cogs: number;
    grossProfit: number;
    grossMarginPct: number;
    opex: number;
    operatingIncome: number;
    operatingMarginPct: number;
    otherNet: number;
    ebitda: number;
    ebitdaMarginPct: number;
    netIncome: number;
    netMarginPct: number;
  };
  prior: {
    revenue: number;
    grossProfit: number;
    operatingIncome: number;
    netIncome: number;
  } | null;
}

export interface BalanceSheet {
  periodName: string;
  status: FinPeriod["status"];
  assets: StatementLine[];
  liabilities: StatementLine[];
  equity: StatementLine[];
  totals: {
    assets: number;
    liabilities: number;
    equity: number; // includes current-year net income
    netIncomeYtd: number;
    liabilitiesAndEquity: number;
    isBalanced: boolean;
  };
}

export interface CashFlowStatement {
  periodName: string;
  status: FinPeriod["status"];
  operating: StatementLine[];
  investing: StatementLine[];
  financing: StatementLine[];
  totals: {
    operating: number;
    investing: number;
    financing: number;
    netChange: number;
    beginningCash: number;
    endingCash: number;
    freeCashFlow: number;
  };
}

export interface VarianceLine {
  code: string;
  name: string;
  actual: number;
  budget: number;
  varianceAmount: number; // actual - budget
  variancePct: number; // vs budget
  favorable: boolean;
  material: boolean;
}

export interface BudgetVsActual {
  periodName: string;
  status: FinPeriod["status"];
  revenue: VarianceLine[];
  expenses: VarianceLine[];
  totals: {
    actualRevenue: number;
    budgetRevenue: number;
    actualExpense: number;
    budgetExpense: number;
    actualNetIncome: number;
    budgetNetIncome: number;
    netVariance: number;
  };
}

export interface AgingBucket {
  label: string;
  amount: number;
  count: number;
}

export interface AgingRow {
  id: string;
  reference: string;
  party: string;
  date: string;
  dueDate: string;
  outstanding: number;
  daysPastDue: number;
  bucket: string;
}

export interface AgingReport {
  asOf: string;
  totalOutstanding: number;
  buckets: AgingBucket[];
  rows: AgingRow[];
  dso?: number; // AR only
  dpo?: number; // AP only
}

export interface FinanceKpis {
  periodName: string;
  revenue: number;
  revenueGrowthPct: number | null;
  grossMarginPct: number;
  operatingMarginPct: number;
  ebitdaMarginPct: number;
  netIncome: number;
  currentRatio: number;
  quickRatio: number;
  workingCapital: number;
  cashBalance: number;
  freeCashFlow: number;
  dso: number;
  dpo: number;
}

export interface CloseTask {
  id: string;
  title: string;
  closeLevel: number;
  dayOffset: number;
  owner: string | null;
  status: "not_started" | "in_progress" | "blocked" | "complete";
  dueDate: string | null;
}

export interface Reconciliation {
  id: string;
  accountName: string | null;
  recType: string;
  glBalance: number;
  subledgerBalance: number;
  difference: number;
  status: "open" | "reconciled" | "review";
  preparedBy: string | null;
  items: { id: string; description: string; amount: number; classification: string; itemDate: string | null }[];
}

export type ImportEntity = "ar_invoice" | "ap_bill" | "budget";

export interface ImportResult {
  entity: ImportEntity;
  inserted: number;
  skipped: number;
  errors: string[];
}
