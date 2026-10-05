-- ============================================================
-- 003_finance_analyst_seed.sql
-- Realistic seed data for the Finance Analyst module.
-- Idempotent-ish: guarded by a sentinel so it only seeds once.
-- Re-running is safe (it no-ops if data already present).
-- ============================================================

DO $seed$
DECLARE
  v_exists BOOLEAN;
  v_sub UUID;
  d_eng UUID; d_sales UUID; d_ga UUID; d_ops UUID;
  p RECORD;
  v_entry UUID;
  g NUMERIC;
  v_diff NUMERIC;
  v_year INTEGER := 2026;
BEGIN
  SELECT EXISTS (SELECT 1 FROM fin_account WHERE code = '4000') INTO v_exists;
  IF v_exists THEN
    RAISE NOTICE 'Finance seed already applied — skipping.';
    RETURN;
  END IF;

  -- ---------- Subsidiary ----------
  INSERT INTO fin_subsidiary (name, currency) VALUES ('NEXT Ventures (Consolidated)', 'USD')
    RETURNING id INTO v_sub;

  -- ---------- Departments ----------
  INSERT INTO fin_department (name) VALUES ('Engineering') RETURNING id INTO d_eng;
  INSERT INTO fin_department (name) VALUES ('Sales & Marketing') RETURNING id INTO d_sales;
  INSERT INTO fin_department (name) VALUES ('General & Admin') RETURNING id INTO d_ga;
  INSERT INTO fin_department (name) VALUES ('Operations') RETURNING id INTO d_ops;

  -- ---------- Accounting periods (FY2026) ----------
  -- Jan–Sep closed, Oct open (current), Nov–Dec open/future.
  INSERT INTO fin_period (name, fiscal_year, period_number, start_date, end_date, status) VALUES
    ('Jan 2026', v_year, 1,  '2026-01-01','2026-01-31','closed'),
    ('Feb 2026', v_year, 2,  '2026-02-01','2026-02-28','closed'),
    ('Mar 2026', v_year, 3,  '2026-03-01','2026-03-31','closed'),
    ('Apr 2026', v_year, 4,  '2026-04-01','2026-04-30','closed'),
    ('May 2026', v_year, 5,  '2026-05-01','2026-05-31','closed'),
    ('Jun 2026', v_year, 6,  '2026-06-01','2026-06-30','closed'),
    ('Jul 2026', v_year, 7,  '2026-07-01','2026-07-31','closed'),
    ('Aug 2026', v_year, 8,  '2026-08-01','2026-08-31','closed'),
    ('Sep 2026', v_year, 9,  '2026-09-01','2026-09-30','closed'),
    ('Oct 2026', v_year, 10, '2026-10-01','2026-10-31','open'),
    ('Nov 2026', v_year, 11, '2026-11-01','2026-11-30','open'),
    ('Dec 2026', v_year, 12, '2026-12-01','2026-12-31','open');

  -- ---------- Chart of accounts ----------
  INSERT INTO fin_account (code, name, account_type, subtype, normal_balance, is_cash) VALUES
    ('1000','Cash & cash equivalents','asset','current_asset','debit', true),
    ('1100','Accounts receivable','asset','current_asset','debit', false),
    ('1200','Inventory','asset','current_asset','debit', false),
    ('1300','Property, plant & equipment','asset','ppe','debit', false),
    ('1500','Accumulated depreciation','asset','ppe','credit', false),
    ('2000','Accounts payable','liability','current_liability','credit', false),
    ('2100','Accrued liabilities','liability','current_liability','credit', false),
    ('2200','Deferred revenue','liability','current_liability','credit', false),
    ('2500','Long-term debt','liability','long_term_liability','credit', false),
    ('3000','Common stock','equity','equity','credit', false),
    ('3100','Retained earnings','equity','equity','credit', false),
    ('4000','Product revenue','revenue','revenue','credit', false),
    ('4100','Services revenue','revenue','revenue','credit', false),
    ('5000','Cost of goods sold','cogs','cogs','debit', false),
    ('6000','Salaries & wages','expense','opex','debit', false),
    ('6100','Marketing','expense','opex','debit', false),
    ('6200','Rent & facilities','expense','opex','debit', false),
    ('6300','Software & subscriptions','expense','opex','debit', false),
    ('6400','Depreciation expense','expense','opex','debit', false),
    ('7000','Interest income','other_income','other','credit', false),
    ('7500','Interest expense','other_expense','other','debit', false);

  -- ---------- Opening balances (as of 2026-01-01) ----------
  INSERT INTO fin_journal_entry (entry_no, entry_date, period_id, subsidiary_id, memo, source, status, created_by)
  VALUES ('OB-2026', '2026-01-01',
          (SELECT id FROM fin_period WHERE period_number=1 AND fiscal_year=v_year),
          v_sub, 'Opening balances', 'system', 'posted', 'system')
  RETURNING id INTO v_entry;

  INSERT INTO fin_journal_line (entry_id, account_id, debit, credit, line_no) VALUES
    (v_entry,(SELECT id FROM fin_account WHERE code='1000'), 1500000, 0, 1),
    (v_entry,(SELECT id FROM fin_account WHERE code='1200'),  300000, 0, 2),
    (v_entry,(SELECT id FROM fin_account WHERE code='1300'),  900000, 0, 3),
    (v_entry,(SELECT id FROM fin_account WHERE code='2500'), 0,  600000, 4),
    (v_entry,(SELECT id FROM fin_account WHERE code='3000'), 0, 1000000, 5),
    (v_entry,(SELECT id FROM fin_account WHERE code='3100'), 0, 1100000, 6);

  -- ---------- Monthly summarized activity (periods 1..10) ----------
  FOR p IN
    SELECT id, period_number, end_date
    FROM fin_period
    WHERE fiscal_year = v_year AND period_number <= 10
    ORDER BY period_number
  LOOP
    g := 1 + 0.015 * (p.period_number - 1);  -- gentle growth

    INSERT INTO fin_journal_entry (entry_no, entry_date, period_id, subsidiary_id, memo, source, status, created_by)
    VALUES ('JE-'||v_year||'-'||lpad(p.period_number::text,2,'0'), p.end_date, p.id, v_sub,
            'Summarized monthly operations', 'system', 'posted', 'system')
    RETURNING id INTO v_entry;

    -- Revenue (credits)
    INSERT INTO fin_journal_line (entry_id, account_id, department_id, debit, credit, line_no) VALUES
      (v_entry,(SELECT id FROM fin_account WHERE code='4000'), d_sales, 0, round(520000*g,2), 1),
      (v_entry,(SELECT id FROM fin_account WHERE code='4100'), d_sales, 0, round(185000*g,2), 2),
      (v_entry,(SELECT id FROM fin_account WHERE code='7000'), d_ga,    0, round(2100*g,2),  3);
    -- Costs & expenses (debits)
    INSERT INTO fin_journal_line (entry_id, account_id, department_id, debit, credit, line_no) VALUES
      (v_entry,(SELECT id FROM fin_account WHERE code='5000'), d_ops,   round(243000*g,2), 0, 4),
      (v_entry,(SELECT id FROM fin_account WHERE code='6000'), d_eng,   round(205000*g,2), 0, 5),
      (v_entry,(SELECT id FROM fin_account WHERE code='6100'), d_sales, round(61000*g,2),  0, 6),
      (v_entry,(SELECT id FROM fin_account WHERE code='6200'), d_ga,    round(22000,2),    0, 7),
      (v_entry,(SELECT id FROM fin_account WHERE code='6300'), d_eng,   round(17500*g,2),  0, 8),
      (v_entry,(SELECT id FROM fin_account WHERE code='6400'), d_ga,    round(12000,2),    0, 9),
      (v_entry,(SELECT id FROM fin_account WHERE code='7500'), d_ga,    round(3400,2),     0, 10);
    -- Balance sheet offsets (partial)
    INSERT INTO fin_journal_line (entry_id, account_id, debit, credit, line_no) VALUES
      (v_entry,(SELECT id FROM fin_account WHERE code='1100'), round(0.18*(520000+185000)*g,2), 0, 11), -- AR build
      (v_entry,(SELECT id FROM fin_account WHERE code='1200'), 0, round(0.35*243000*g,2), 12),           -- inventory relief
      (v_entry,(SELECT id FROM fin_account WHERE code='2000'), 0, round(0.45*(61000*g+22000+17500*g),2), 13), -- AP
      (v_entry,(SELECT id FROM fin_account WHERE code='2100'), 0, round(0.30*205000*g,2), 14),           -- accrued payroll
      (v_entry,(SELECT id FROM fin_account WHERE code='1500'), 0, round(12000,2), 15);                   -- accum depreciation

    -- Cash plug to force the entry to balance.
    SELECT COALESCE(SUM(debit),0) - COALESCE(SUM(credit),0) INTO v_diff
      FROM fin_journal_line WHERE entry_id = v_entry;
    IF v_diff > 0 THEN
      INSERT INTO fin_journal_line (entry_id, account_id, debit, credit, line_no)
      VALUES (v_entry,(SELECT id FROM fin_account WHERE code='1000'), 0, v_diff, 99);
    ELSE
      INSERT INTO fin_journal_line (entry_id, account_id, debit, credit, line_no)
      VALUES (v_entry,(SELECT id FROM fin_account WHERE code='1000'), -v_diff, 0, 99);
    END IF;
  END LOOP;

  -- ---------- Budget lines (P&L accounts, periods 1..12) ----------
  -- Budget set close to actual with intentional spread to create variances.
  INSERT INTO fin_budget_line (fiscal_year, period_number, account_id, amount, scenario)
  SELECT v_year, m.n, a.id,
         CASE a.code
           WHEN '4000' THEN round(520000 * (1+0.02*(m.n-1)), 2)
           WHEN '4100' THEN round(185000 * (1+0.02*(m.n-1)), 2)
           WHEN '5000' THEN round(238000 * (1+0.012*(m.n-1)), 2)
           WHEN '6000' THEN round(200000 * (1+0.01*(m.n-1)), 2)
           WHEN '6100' THEN round(55000, 2)
           WHEN '6200' THEN round(22000, 2)
           WHEN '6300' THEN round(16000 * (1+0.01*(m.n-1)), 2)
           WHEN '6400' THEN round(12000, 2)
           WHEN '7000' THEN round(2000, 2)
           WHEN '7500' THEN round(3500, 2)
           ELSE 0
         END,
         'budget'
  FROM fin_account a
  CROSS JOIN (SELECT generate_series(1,12) AS n) m
  WHERE a.account_type IN ('revenue','cogs','expense','other_income','other_expense');

  -- ---------- AR invoices (aging spread, relative to 2026-10-04) ----------
  INSERT INTO fin_ar_invoice (invoice_no, customer_name, invoice_date, due_date, amount, amount_paid, status, subsidiary_id) VALUES
    ('INV-1042','Aurora Retail Group','2026-09-20','2026-10-20', 48250.00, 0, 'open', v_sub),
    ('INV-1043','Brightline Media','2026-09-25','2026-10-25', 21900.00, 0, 'open', v_sub),
    ('INV-1039','Cobalt Systems','2026-09-05','2026-10-05', 65400.00, 20000.00, 'partial', v_sub),
    ('INV-1030','Delta Logistics','2026-08-15','2026-09-14', 33750.00, 0, 'open', v_sub),       -- 31-60
    ('INV-1028','Evergreen Foods','2026-08-02','2026-09-01', 54120.00, 0, 'open', v_sub),       -- 31-60
    ('INV-1019','Foxtrot Labs','2026-07-10','2026-08-09', 28900.00, 0, 'open', v_sub),          -- 61-90
    ('INV-1012','Granite Holdings','2026-06-18','2026-07-18', 41200.00, 0, 'open', v_sub),      -- >90
    ('INV-1007','Horizon Partners','2026-05-30','2026-06-29', 18600.00, 0, 'open', v_sub),      -- >90
    ('INV-1050','Ionic Health','2026-09-28','2026-10-28', 37450.00, 37450.00, 'paid', v_sub),
    ('INV-1051','Juniper Design','2026-09-30','2026-10-30', 15200.00, 0, 'open', v_sub);

  -- ---------- AP bills ----------
  INSERT INTO fin_ap_bill (bill_no, vendor_name, bill_date, due_date, amount, amount_paid, status, subsidiary_id) VALUES
    ('BILL-5521','Cloud Infra Co','2026-09-22','2026-10-22', 38400.00, 0, 'open', v_sub),
    ('BILL-5522','Talent Staffing LLC','2026-09-18','2026-10-18', 52100.00, 0, 'open', v_sub),
    ('BILL-5510','Office Realty Trust','2026-08-20','2026-09-19', 22000.00, 0, 'open', v_sub),  -- 31-60
    ('BILL-5498','Hardware Supply Inc','2026-07-25','2026-08-24', 16750.00, 0, 'open', v_sub),  -- 61-90
    ('BILL-5471','Legal Advisors PC','2026-06-12','2026-07-12', 29300.00, 0, 'open', v_sub),    -- >90
    ('BILL-5530','Utilities Group','2026-09-29','2026-10-29', 7450.00, 7450.00, 'paid', v_sub),
    ('BILL-5531','Marketing Agency X','2026-09-27','2026-10-27', 24600.00, 10000.00, 'partial', v_sub);

  -- ---------- Close tasks for current period (Oct 2026, 5-day close) ----------
  INSERT INTO fin_close_task (period_id, title, close_level, day_offset, owner, status, due_date)
  SELECT (SELECT id FROM fin_period WHERE period_number=10 AND fiscal_year=v_year),
         t.title, t.lvl, t.doff, t.owner, t.status, t.due
  FROM (VALUES
    ('Post cash receipts & disbursements', 1, 1, 'A. Rahman', 'complete',    DATE '2026-11-02'),
    ('Post payroll journal',               1, 1, 'A. Rahman', 'complete',    DATE '2026-11-02'),
    ('Record depreciation & amortization', 1, 1, 'S. Patel',  'complete',    DATE '2026-11-02'),
    ('Book routine AP accruals',           1, 1, 'S. Patel',  'in_progress', DATE '2026-11-02'),
    ('Bank reconciliation',                2, 2, 'M. Chen',   'in_progress', DATE '2026-11-03'),
    ('Revenue recognition review',         2, 2, 'M. Chen',   'not_started', DATE '2026-11-03'),
    ('AR & AP subledger reconciliation',   2, 2, 'L. Gomez',  'not_started', DATE '2026-11-03'),
    ('Balance sheet reconciliations',      3, 3, 'L. Gomez',  'not_started', DATE '2026-11-04'),
    ('Intercompany reconciliation',        3, 3, 'M. Chen',   'blocked',     DATE '2026-11-04'),
    ('Tax provision',                      4, 4, 'External',  'not_started', DATE '2026-11-05'),
    ('Draft financial statements',         4, 4, 'A. Rahman', 'not_started', DATE '2026-11-05'),
    ('Management review & hard close',      5, 5, 'CFO',       'not_started', DATE '2026-11-06')
  ) AS t(title, lvl, doff, owner, status, due);

  -- ---------- Reconciliations for current period ----------
  INSERT INTO fin_reconciliation (period_id, account_id, rec_type, gl_balance, subledger_balance, status, prepared_by)
  VALUES
    ((SELECT id FROM fin_period WHERE period_number=10 AND fiscal_year=v_year),
     (SELECT id FROM fin_account WHERE code='1100'), 'gl_to_subledger', 212870.00, 219320.00, 'review', 'L. Gomez'),
    ((SELECT id FROM fin_period WHERE period_number=10 AND fiscal_year=v_year),
     (SELECT id FROM fin_account WHERE code='1000'), 'bank', 1980000.00, 1975500.00, 'open', 'M. Chen');

  INSERT INTO fin_reconciliation_item (reconciliation_id, description, amount, item_date, classification)
  SELECT r.id, x.descr, x.amt, x.d, x.cls
  FROM fin_reconciliation r
  JOIN (VALUES
    ('gl_to_subledger','Unapplied customer payment', -6450.00, DATE '2026-09-28','timing'),
    ('bank','Outstanding check #2041', 4500.00, DATE '2026-09-30','timing')
  ) AS x(rtype, descr, amt, d, cls) ON x.rtype = r.rec_type
  WHERE r.period_id = (SELECT id FROM fin_period WHERE period_number=10 AND fiscal_year=v_year);

  RAISE NOTICE 'Finance seed applied successfully.';
END
$seed$;
