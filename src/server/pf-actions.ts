"use server";

import { dateStr, num, pool, requireSession } from "@/lib/db";
import type { PfAccount, PfCategorySlice, PfOverview, PfTransaction, PfWallet } from "@/lib/dashboards/types";

export async function getPfAccounts(): Promise<PfAccount[]> {
  await requireSession();
  const res = await pool.query(`SELECT * FROM pf_account ORDER BY balance DESC`);
  return res.rows.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    institution: r.institution,
    balance: num(r.balance),
  }));
}

export async function getPfWallets(): Promise<PfWallet[]> {
  await requireSession();
  const res = await pool.query(`SELECT * FROM pf_wallet ORDER BY balance DESC`);
  return res.rows.map((r) => ({
    id: r.id,
    name: r.name,
    balance: num(r.balance),
    color: r.color ?? "blue",
    last4: r.last4,
    brand: r.brand,
  }));
}

export async function getPfTransactions(limit = 10): Promise<PfTransaction[]> {
  await requireSession();
  const res = await pool.query(
    `SELECT t.*, c.name AS category_name
     FROM pf_transaction t
     LEFT JOIN pf_category c ON c.id = t.category_id
     WHERE t.status = 'posted'
     ORDER BY t.txn_date DESC, t.created_at DESC
     LIMIT $1`,
    [limit],
  );
  return res.rows.map(mapTxn);
}

export async function getUpcomingTransactions(): Promise<PfTransaction[]> {
  await requireSession();
  const res = await pool.query(
    `SELECT t.*, c.name AS category_name
     FROM pf_transaction t
     LEFT JOIN pf_category c ON c.id = t.category_id
     WHERE t.status IN ('scheduled','pending')
     ORDER BY t.txn_date ASC`,
  );
  return res.rows.map(mapTxn);
}

export async function getPfCategoryBreakdown(): Promise<PfCategorySlice[]> {
  await requireSession();
  const res = await pool.query(`
    SELECT c.name, c.kind, c.color, COALESCE(SUM(t.amount),0) AS total
    FROM pf_category c
    LEFT JOIN pf_transaction t
      ON t.category_id = c.id AND t.status = 'posted'
      AND t.txn_date >= date_trunc('month', current_date)
    GROUP BY c.id
    HAVING COALESCE(SUM(t.amount),0) > 0
    ORDER BY total DESC`);
  return res.rows.map((r) => ({
    name: r.name,
    kind: r.kind,
    total: num(r.total),
    color: r.color ?? "blue",
  }));
}

export async function getPfOverview(): Promise<PfOverview> {
  await requireSession();
  const acc = await pool.query(`SELECT COALESCE(SUM(balance),0) AS net FROM pf_account`);
  const cash = await pool.query(`SELECT COALESCE(SUM(balance),0) AS cash FROM pf_account WHERE type IN ('checking','cash')`);
  const flow = await pool.query(`
    SELECT
      COALESCE(SUM(amount) FILTER (WHERE direction='debit'),0) AS spend,
      COALESCE(SUM(amount) FILTER (WHERE direction='credit'),0) AS income
    FROM pf_transaction
    WHERE status='posted' AND txn_date >= date_trunc('month', current_date)`);
  const net = num(acc.rows[0].net);
  const spend = num(flow.rows[0].spend);
  const income = num(flow.rows[0].income);
  return {
    netWorth: net,
    availableCash: num(cash.rows[0].cash),
    monthlySpend: spend,
    monthlyIncome: income,
    savingsRatePct: income > 0 ? ((income - spend) / income) * 100 : 0,
  };
}

function mapTxn(r: Record<string, unknown>): PfTransaction {
  return {
    id: r.id as string,
    description: r.description as string,
    merchant: (r.merchant as string | null) ?? null,
    amount: num(r.amount),
    direction: r.direction as string,
    status: r.status as string,
    txnDate: dateStr(r.txn_date) ?? "",
    categoryName: (r.category_name as string | null) ?? null,
  };
}
