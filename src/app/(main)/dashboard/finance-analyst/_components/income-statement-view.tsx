import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtCurrency, fmtPct } from "@/lib/finance/format";
import type { IncomeStatement, StatementLine } from "@/lib/finance/types";

function Lines({ items, indent = true }: { items: StatementLine[]; indent?: boolean }) {
  return (
    <>
      {items.map((l) => (
        <TableRow key={l.code}>
          <TableCell className={indent ? "pl-6 text-muted-foreground" : "font-medium"}>{l.name}</TableCell>
          <TableCell className="text-right tabular-nums">{fmtCurrency(l.amount, { cents: true })}</TableCell>
        </TableRow>
      ))}
    </>
  );
}

function Subtotal({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <TableRow className={strong ? "border-t-2" : "border-t"}>
      <TableCell className={strong ? "font-semibold" : "font-medium"}>{label}</TableCell>
      <TableCell className={`text-right tabular-nums ${strong ? "font-semibold" : "font-medium"}`}>
        {fmtCurrency(value, { cents: true })}
      </TableCell>
    </TableRow>
  );
}

export function IncomeStatementView({ data }: { data: IncomeStatement }) {
  const t = data.totals;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">Income statement — {data.periodName}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Line item</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium" colSpan={2}>
                Revenue
              </TableCell>
            </TableRow>
            <Lines items={data.revenue} />
            <Subtotal label="Total revenue" value={t.revenue} />

            <TableRow>
              <TableCell className="font-medium" colSpan={2}>
                Cost of goods sold
              </TableCell>
            </TableRow>
            <Lines items={data.cogs} />
            <Subtotal label={`Gross profit (${fmtPct(t.grossMarginPct)})`} value={t.grossProfit} strong />

            <TableRow>
              <TableCell className="font-medium" colSpan={2}>
                Operating expenses
              </TableCell>
            </TableRow>
            <Lines items={data.opex} />
            <Subtotal label={`Operating income (${fmtPct(t.operatingMarginPct)})`} value={t.operatingIncome} strong />

            {data.otherItems.length > 0 ? (
              <>
                <TableRow>
                  <TableCell className="font-medium" colSpan={2}>
                    Other income / (expense)
                  </TableCell>
                </TableRow>
                <Lines items={data.otherItems} />
              </>
            ) : null}

            <Subtotal label={`EBITDA (${fmtPct(t.ebitdaMarginPct)})`} value={t.ebitda} />
            <Subtotal label={`Net income (${fmtPct(t.netMarginPct)})`} value={t.netIncome} strong />
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
