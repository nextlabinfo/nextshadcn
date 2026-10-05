import { headers } from "next/headers";
import { redirect } from "next/navigation";

import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import {
  getApAging,
  getArAging,
  getBalanceSheet,
  getBudgetVsActual,
  getCashFlow,
  getCloseTasks,
  getFinanceKpis,
  getIncomeStatement,
  getPeriods,
  getReconciliations,
} from "@/server/finance-actions";

import { FinanceAnalystClient } from "./_components/finance-analyst-client";

export const metadata: Metadata = {
  title: "Finance Analyst",
  description:
    "Director of Financial Analysis workspace: financial statements, budget vs actual variance, AR/AP aging, cash flow, and month-end close.",
  alternates: { canonical: "/dashboard/finance-analyst" },
};

export default async function Page({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  // Guard first so a logged-out visit redirects cleanly instead of letting the
  // data calls throw "Unauthorized" (layout + page render in parallel).
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/auth/v2/login");

  const sp = await searchParams;
  const periods = await getPeriods();

  if (periods.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl tracking-tight">Finance Analyst</h1>
        <p className="text-muted-foreground text-sm">
          No accounting periods found. Run <code>pnpm db:migrate</code> to create the finance tables and seed data.
        </p>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const defaultPeriod = periods.find((p) => p.startDate <= today && today <= p.endDate) ?? periods[0];
  const periodId = sp.period && periods.some((p) => p.id === sp.period) ? sp.period : defaultPeriod.id;
  const current = periods.find((p) => p.id === periodId) ?? defaultPeriod;

  const [kpis, income, balanceSheet, cashFlow, variance, arAging, apAging, closeTasks, reconciliations] =
    await Promise.all([
      getFinanceKpis(periodId),
      getIncomeStatement(periodId),
      getBalanceSheet(periodId),
      getCashFlow(periodId),
      getBudgetVsActual(periodId),
      getArAging(),
      getApAging(),
      getCloseTasks(periodId),
      getReconciliations(periodId),
    ]);

  return (
    <FinanceAnalystClient
      periods={periods}
      currentPeriodId={periodId}
      isPreliminary={current.status !== "closed"}
      kpis={kpis}
      income={income}
      balanceSheet={balanceSheet}
      cashFlow={cashFlow}
      variance={variance}
      arAging={arAging}
      apAging={apAging}
      closeTasks={closeTasks}
      reconciliations={reconciliations}
    />
  );
}
