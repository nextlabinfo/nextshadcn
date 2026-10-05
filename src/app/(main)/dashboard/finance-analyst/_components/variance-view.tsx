import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtCurrency, fmtSignedPct } from "@/lib/finance/format";
import type { BudgetVsActual, VarianceLine } from "@/lib/finance/types";

function Rows({ lines }: { lines: VarianceLine[] }) {
  return (
    <>
      {lines.map((l) => (
        <TableRow key={l.code}>
          <TableCell>{l.name}</TableCell>
          <TableCell className="text-right tabular-nums">{fmtCurrency(l.actual)}</TableCell>
          <TableCell className="text-right text-muted-foreground tabular-nums">{fmtCurrency(l.budget)}</TableCell>
          <TableCell
            className={`text-right tabular-nums ${l.favorable ? "text-green-600 dark:text-green-400" : "text-destructive"}`}
          >
            {fmtCurrency(l.varianceAmount)}
          </TableCell>
          <TableCell
            className={`text-right tabular-nums ${l.favorable ? "text-green-600 dark:text-green-400" : "text-destructive"}`}
          >
            {fmtSignedPct(l.variancePct)}
          </TableCell>
          <TableCell className="text-center">
            {l.material ? (
              <Badge
                variant="outline"
                className={
                  l.favorable
                    ? "border-green-500/40 text-green-600 dark:text-green-400"
                    : "border-destructive/40 text-destructive"
                }
              >
                {l.favorable ? "FAV" : "FLAG"}
              </Badge>
            ) : (
              <span className="text-muted-foreground text-xs">—</span>
            )}
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function VarianceView({ data }: { data: BudgetVsActual }) {
  const t = data.totals;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">Budget vs actual — {data.periodName}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account</TableHead>
              <TableHead className="text-right">Actual</TableHead>
              <TableHead className="text-right">Budget</TableHead>
              <TableHead className="text-right">Variance $</TableHead>
              <TableHead className="text-right">Variance %</TableHead>
              <TableHead className="text-center">Material</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium" colSpan={6}>
                Revenue
              </TableCell>
            </TableRow>
            <Rows lines={data.revenue} />
            <TableRow>
              <TableCell className="font-medium" colSpan={6}>
                Expenses
              </TableCell>
            </TableRow>
            <Rows lines={data.expenses} />
            <TableRow className="border-t-2">
              <TableCell className="font-semibold">Net income</TableCell>
              <TableCell className="text-right font-semibold tabular-nums">{fmtCurrency(t.actualNetIncome)}</TableCell>
              <TableCell className="text-right font-semibold text-muted-foreground tabular-nums">
                {fmtCurrency(t.budgetNetIncome)}
              </TableCell>
              <TableCell
                className={`text-right font-semibold tabular-nums ${t.netVariance >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive"}`}
              >
                {fmtCurrency(t.netVariance)}
              </TableCell>
              <TableCell />
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
        <p className="mt-3 text-muted-foreground text-xs">
          Material = variance exceeds 5% or $50,000 (finance-analyst default). FLAG = unfavorable &amp; material.
        </p>
      </CardContent>
    </Card>
  );
}
