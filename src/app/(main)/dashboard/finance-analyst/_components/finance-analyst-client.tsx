"use client";

import Link from "next/link";

import { Download, Upload } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fmtCurrency, fmtPct, fmtSignedPct, toCsv } from "@/lib/finance/format";
import type {
  AgingReport,
  BalanceSheet,
  BudgetVsActual,
  CashFlowStatement,
  CloseTask,
  FinanceKpis,
  FinPeriod,
  IncomeStatement,
  Reconciliation,
} from "@/lib/finance/types";

import { AgingView } from "./aging-view";
import { BalanceSheetView } from "./balance-sheet-view";
import { CashFlowView } from "./cash-flow-view";
import { CloseControlsView } from "./close-controls-view";
import { IncomeStatementView } from "./income-statement-view";
import { KpiOverview } from "./kpi-overview";
import { PeriodSelector } from "./period-selector";
import { VarianceView } from "./variance-view";

interface Props {
  periods: FinPeriod[];
  currentPeriodId: string;
  isPreliminary: boolean;
  kpis: FinanceKpis | null;
  income: IncomeStatement | null;
  balanceSheet: BalanceSheet | null;
  cashFlow: CashFlowStatement | null;
  variance: BudgetVsActual | null;
  arAging: AgingReport;
  apAging: AgingReport;
  closeTasks: CloseTask[];
  reconciliations: Reconciliation[];
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function FinanceAnalystClient(props: Props) {
  const { income, balanceSheet, cashFlow, variance, kpis } = props;

  function exportStatements() {
    const rows: (string | number | null)[][] = [];
    if (income) {
      rows.push(["Income statement", income.periodName, ""]);
      for (const l of [...income.revenue, ...income.cogs, ...income.opex, ...income.otherItems]) {
        rows.push(["P&L", l.name, l.amount]);
      }
      rows.push(["P&L", "Net income", income.totals.netIncome]);
    }
    if (balanceSheet) {
      for (const l of [...balanceSheet.assets, ...balanceSheet.liabilities, ...balanceSheet.equity]) {
        rows.push(["Balance sheet", l.name, l.amount]);
      }
    }
    if (cashFlow) {
      for (const l of [...cashFlow.operating, ...cashFlow.investing, ...cashFlow.financing]) {
        rows.push(["Cash flow", l.name, l.amount]);
      }
      rows.push(["Cash flow", "Net change in cash", cashFlow.totals.netChange]);
    }
    downloadCsv(
      `financial-statements-${income?.periodName ?? "export"}.csv`,
      toCsv(["Statement", "Line item", "Amount"], rows),
    );
  }

  // Short analyst headline (finance-analyst narrative pattern).
  let headline = "No data for this period yet.";
  if (income && kpis) {
    const dir = kpis.revenueGrowthPct !== null ? fmtSignedPct(kpis.revenueGrowthPct) : "n/a";
    headline = `${income.periodName}: revenue ${fmtCurrency(income.totals.revenue, { compact: true })} (${dir} MoM), net income ${fmtCurrency(income.totals.netIncome, { compact: true })} at ${fmtPct(income.totals.netMarginPct)} margin.`;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl">Finance Analyst</h1>
            {props.isPreliminary ? (
              <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-300">Preliminary · period open</Badge>
            ) : (
              <Badge variant="outline">Final · period closed</Badge>
            )}
          </div>
          <p className="max-w-3xl text-foreground text-md">{headline}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PeriodSelector periods={props.periods} current={props.currentPeriodId} />
          <Button asChild size="sm" variant="outline">
            <Link href="/dashboard/finance-analyst/import">
              <Upload data-icon="inline-start" />
              Import data
            </Link>
          </Button>
          <Button size="sm" variant="outline" onClick={exportStatements}>
            <Download data-icon="inline-start" />
            Export CSV
          </Button>
        </div>
      </div>

      {props.isPreliminary ? (
        <Card className="border-amber-500">
          <CardContent className="py-3 text-foreground text-md">
            This period is still open. Figures are preliminary and may change as close tasks (accruals, revenue
            recognition, reconciliations) are completed. See the Close tab for outstanding items.
          </CardContent>
        </Card>
      ) : null}

      <Tabs defaultValue="overview" className="flex flex-col gap-4">
        <TabsList variant="line" className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="income">Income statement</TabsTrigger>
          <TabsTrigger value="balance">Balance sheet</TabsTrigger>
          <TabsTrigger value="cashflow">Cash flow</TabsTrigger>
          <TabsTrigger value="variance">Budget vs actual</TabsTrigger>
          <TabsTrigger value="ar">AR aging</TabsTrigger>
          <TabsTrigger value="ap">AP aging</TabsTrigger>
          <TabsTrigger value="close">Close &amp; controls</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex flex-col gap-4">
          {kpis ? <KpiOverview kpis={kpis} /> : <Empty />}
          {income ? <IncomeStatementView data={income} /> : null}
        </TabsContent>
        <TabsContent value="income">{income ? <IncomeStatementView data={income} /> : <Empty />}</TabsContent>
        <TabsContent value="balance">{balanceSheet ? <BalanceSheetView data={balanceSheet} /> : <Empty />}</TabsContent>
        <TabsContent value="cashflow">{cashFlow ? <CashFlowView data={cashFlow} /> : <Empty />}</TabsContent>
        <TabsContent value="variance">{variance ? <VarianceView data={variance} /> : <Empty />}</TabsContent>
        <TabsContent value="ar">
          <AgingView report={props.arAging} kind="AR" />
        </TabsContent>
        <TabsContent value="ap">
          <AgingView report={props.apAging} kind="AP" />
        </TabsContent>
        <TabsContent value="close">
          <CloseControlsView tasks={props.closeTasks} reconciliations={props.reconciliations} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Empty() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">No data</CardTitle>
      </CardHeader>
      <CardContent className="text-foreground text-sm">
        No finance data found for this period. Run the migrations and seed, or import data to get started.
      </CardContent>
    </Card>
  );
}
