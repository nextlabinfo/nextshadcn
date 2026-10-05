import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fmtCurrency, fmtPct, fmtSignedPct } from "@/lib/finance/format";
import type { FinanceKpis } from "@/lib/finance/types";

const TONE_TEXT: Record<string, string> = {
  pos: "text-xs text-green-600 dark:text-green-400",
  neg: "text-destructive text-xs",
};

function Kpi({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "pos" | "neg" | "neutral";
}) {
  return (
    <Card className="gap-2">
      <CardHeader className="pb-0">
        <CardTitle className="font-normal text-muted-foreground text-xs">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-0.5">
        <div className="text-2xl tabular-nums leading-none tracking-tight">{value}</div>
        {sub ? <p className={TONE_TEXT[tone ?? ""] ?? "text-muted-foreground text-xs"}>{sub}</p> : null}
      </CardContent>
    </Card>
  );
}

export function KpiOverview({ kpis }: { kpis: FinanceKpis }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
      <Kpi
        label="Revenue"
        value={fmtCurrency(kpis.revenue, { compact: true })}
        sub={
          kpis.revenueGrowthPct !== null ? `${fmtSignedPct(kpis.revenueGrowthPct)} vs prior period` : "no prior period"
        }
        tone={kpis.revenueGrowthPct !== null && kpis.revenueGrowthPct >= 0 ? "pos" : "neg"}
      />
      <Kpi
        label="Net income"
        value={fmtCurrency(kpis.netIncome, { compact: true })}
        sub={`${fmtPct(kpis.operatingMarginPct)} operating margin`}
        tone={kpis.netIncome >= 0 ? "pos" : "neg"}
      />
      <Kpi label="Gross margin" value={fmtPct(kpis.grossMarginPct)} sub="gross profit / revenue" />
      <Kpi label="EBITDA margin" value={fmtPct(kpis.ebitdaMarginPct)} sub="EBITDA / revenue" />
      <Kpi label="Cash balance" value={fmtCurrency(kpis.cashBalance, { compact: true })} sub="period end" />
      <Kpi
        label="Free cash flow"
        value={fmtCurrency(kpis.freeCashFlow, { compact: true })}
        sub="operating − capex"
        tone={kpis.freeCashFlow >= 0 ? "pos" : "neg"}
      />
      <Kpi
        label="Working capital"
        value={fmtCurrency(kpis.workingCapital, { compact: true })}
        sub={`current ratio ${kpis.currentRatio.toFixed(2)}`}
      />
      <Kpi label="Quick ratio" value={kpis.quickRatio.toFixed(2)} sub="(cash + AR) / current liab." />
      <Kpi label="DSO" value={`${Math.round(kpis.dso)} days`} sub="days sales outstanding" />
      <Kpi label="DPO" value={`${Math.round(kpis.dpo)} days`} sub="days payable outstanding" />
    </div>
  );
}
