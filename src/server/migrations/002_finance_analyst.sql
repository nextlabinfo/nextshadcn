-- ============================================================
-- 002_finance_analyst.sql
-- NetSuite-style Finance Analyst feature tables
-- Chart of accounts, periods, journal entries, budgets,
-- AR/AP subledgers, close tasks, reconciliations.
-- All tables prefixed `fin_` to avoid collisions.
-- ============================================================

-- ---------- Accounting periods ----------
CREATE TABLE IF NOT EXISTS fin_period (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                      -- e.g. "Jan 2026"
  fiscal_year INTEGER NOT NULL,
  period_number INTEGER NOT NULL,          -- 1-12
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','locked')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (fiscal_year, period_number)
);

-- ---------- Subsidiaries (multi-entity support) ----------
CREATE TABLE IF NOT EXISTS fin_subsidiary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  is_elimination BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------- Chart of accounts ----------
-- account_type drives statement classification.
CREATE TABLE IF NOT EXISTS fin_account (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,               -- e.g. "4000"
  name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN (
    'asset','liability','equity','revenue','cogs','expense','other_income','other_expense'
  )),
  -- finer grouping for statement subtotals
  subtype TEXT,                            -- e.g. 'current_asset','ppe','current_liability','opex'
  normal_balance TEXT NOT NULL DEFAULT 'debit' CHECK (normal_balance IN ('debit','credit')),
  is_cash BOOLEAN DEFAULT false,           -- flagged cash/bank accounts
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------- Departments / classes (dimensions) ----------
CREATE TABLE IF NOT EXISTS fin_department (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------- Journal entries (header) ----------
CREATE TABLE IF NOT EXISTS fin_journal_entry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_no TEXT,                           -- human reference
  entry_date DATE NOT NULL,
  period_id UUID REFERENCES fin_period(id) ON DELETE SET NULL,
  subsidiary_id UUID REFERENCES fin_subsidiary(id) ON DELETE SET NULL,
  memo TEXT,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','import','system','accrual','recurring')),
  status TEXT NOT NULL DEFAULT 'posted' CHECK (status IN ('draft','pending','posted','void')),
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ---------- Journal entry lines ----------
CREATE TABLE IF NOT EXISTS fin_journal_line (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES fin_journal_entry(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES fin_account(id),
  department_id UUID REFERENCES fin_department(id) ON DELETE SET NULL,
  debit NUMERIC(18,2) NOT NULL DEFAULT 0,
  credit NUMERIC(18,2) NOT NULL DEFAULT 0,
  memo TEXT,
  line_no INTEGER DEFAULT 0,
  CHECK (debit >= 0 AND credit >= 0)
);

CREATE INDEX IF NOT EXISTS idx_fin_line_entry ON fin_journal_line(entry_id);
CREATE INDEX IF NOT EXISTS idx_fin_line_account ON fin_journal_line(account_id);
CREATE INDEX IF NOT EXISTS idx_fin_entry_period ON fin_journal_entry(period_id);
CREATE INDEX IF NOT EXISTS idx_fin_entry_date ON fin_journal_entry(entry_date);

-- ---------- Budget ----------
CREATE TABLE IF NOT EXISTS fin_budget_line (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fiscal_year INTEGER NOT NULL,
  period_number INTEGER NOT NULL,          -- 1-12
  account_id UUID NOT NULL REFERENCES fin_account(id) ON DELETE CASCADE,
  department_id UUID REFERENCES fin_department(id) ON DELETE SET NULL,
  amount NUMERIC(18,2) NOT NULL DEFAULT 0, -- signed in natural statement terms
  scenario TEXT NOT NULL DEFAULT 'budget' CHECK (scenario IN ('budget','forecast','plan')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (fiscal_year, period_number, account_id, department_id, scenario)
);

-- ---------- AR invoices (customer subledger) ----------
CREATE TABLE IF NOT EXISTS fin_ar_invoice (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  amount NUMERIC(18,2) NOT NULL,
  amount_paid NUMERIC(18,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','paid','partial','void')),
  subsidiary_id UUID REFERENCES fin_subsidiary(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fin_ar_due ON fin_ar_invoice(due_date);

-- ---------- AP bills (vendor subledger) ----------
CREATE TABLE IF NOT EXISTS fin_ap_bill (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_no TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  bill_date DATE NOT NULL,
  due_date DATE NOT NULL,
  amount NUMERIC(18,2) NOT NULL,
  amount_paid NUMERIC(18,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','paid','partial','void')),
  subsidiary_id UUID REFERENCES fin_subsidiary(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fin_ap_due ON fin_ap_bill(due_date);

-- ---------- Close tasks ----------
CREATE TABLE IF NOT EXISTS fin_close_task (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID REFERENCES fin_period(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  close_level INTEGER NOT NULL DEFAULT 1 CHECK (close_level BETWEEN 1 AND 5),
  day_offset INTEGER NOT NULL DEFAULT 1,   -- T+n
  owner TEXT,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','blocked','complete')),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ---------- Reconciliations ----------
CREATE TABLE IF NOT EXISTS fin_reconciliation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID REFERENCES fin_period(id) ON DELETE CASCADE,
  account_id UUID REFERENCES fin_account(id) ON DELETE SET NULL,
  rec_type TEXT NOT NULL DEFAULT 'gl_to_subledger' CHECK (rec_type IN (
    'gl_to_subledger','bank','intercompany','roll_forward'
  )),
  gl_balance NUMERIC(18,2) NOT NULL DEFAULT 0,
  subledger_balance NUMERIC(18,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','reconciled','review')),
  prepared_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fin_reconciliation_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reconciliation_id UUID NOT NULL REFERENCES fin_reconciliation(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  item_date DATE,
  classification TEXT NOT NULL DEFAULT 'timing' CHECK (classification IN (
    'timing','adjustment','investigation'
  )),
  created_at TIMESTAMPTZ DEFAULT now()
);
