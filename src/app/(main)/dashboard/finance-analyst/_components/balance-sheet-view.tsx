import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtCurrency } from "@/lib/finance/format";
import type { BalanceSheet, StatementLine } from "@/lib/finance/types";

function Section({ title, items, total }: { title: string; items: StatementLine[]; total: number }) {
  return (
    <>
      <TableRow>
        <TableCell className="font-medium" colSpan={2}>
          {title}
        </TableCell>
      </TableRow>
      {items.map((l) => (
        <TableRow key={l.code}>
          <TableCell className="pl-6 text-muted-foreground">{l.name}</TableCell>
          <TableCell className="text-right tabular-nums">{fmtCurrency(l.amount, { cents: true })}</TableCell>
        </TableRow>
      ))}
      <TableRow className="border-t">
        <TableCell className="font-semibold">Total {title.toLowerCase()}</TableCell>
        <TableCell className="text-right font-semibold tabular-nums">{fmtCurrency(total, { cents: true })}</TableCell>
      </TableRow>
    </>
  );
}

export function BalanceSheetView({ data }: { data: BalanceSheet }) {
  const t = data.totals;
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="font-normal">Balance sheet — as of {data.periodName}</CardTitle>
        <Badge
          className={
            t.isBalanced ? "bg-green-500/10 text-green-700 dark:text-green-300" : "bg-destructive/10 text-destructive"
          }
        >
          {t.isBalanced ? "In balance" : "Out of balance"}
        </Badge>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <Section title="Assets" items={data.assets} total={t.assets} />
            <Section title="Liabilities" items={data.liabilities} total={t.liabilities} />
            <Section title="Equity" items={data.equity} total={t.equity} />
            <TableRow className="border-t-2">
              <TableCell className="font-semibold">Total liabilities &amp; equity</TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {fmtCurrency(t.liabilitiesAndEquity, { cents: true })}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
