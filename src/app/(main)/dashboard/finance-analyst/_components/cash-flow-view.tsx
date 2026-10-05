import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtCurrency } from "@/lib/finance/format";
import type { CashFlowStatement, StatementLine } from "@/lib/finance/types";

function Group({ title, items, total }: { title: string; items: StatementLine[]; total: number }) {
  return (
    <>
      <TableRow>
        <TableCell className="font-medium" colSpan={2}>
          {title}
        </TableCell>
      </TableRow>
      {items.length === 0 ? (
        <TableRow>
          <TableCell className="pl-6 text-muted-foreground" colSpan={2}>
            No activity
          </TableCell>
        </TableRow>
      ) : (
        items.map((l) => (
          <TableRow key={l.code}>
            <TableCell className="pl-6 text-muted-foreground">{l.name}</TableCell>
            <TableCell className="text-right tabular-nums">{fmtCurrency(l.amount, { cents: true })}</TableCell>
          </TableRow>
        ))
      )}
      <TableRow className="border-t">
        <TableCell className="font-semibold">Net cash from {title.toLowerCase()}</TableCell>
        <TableCell className="text-right font-semibold tabular-nums">{fmtCurrency(total, { cents: true })}</TableCell>
      </TableRow>
    </>
  );
}

export function CashFlowView({ data }: { data: CashFlowStatement }) {
  const t = data.totals;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">Cash flow (indirect) — {data.periodName}</CardTitle>
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
            <Group title="Operating activities" items={data.operating} total={t.operating} />
            <Group title="Investing activities" items={data.investing} total={t.investing} />
            <Group title="Financing activities" items={data.financing} total={t.financing} />
            <TableRow className="border-t-2">
              <TableCell className="font-semibold">Net change in cash</TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {fmtCurrency(t.netChange, { cents: true })}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="text-muted-foreground">Beginning cash</TableCell>
              <TableCell className="text-right tabular-nums">{fmtCurrency(t.beginningCash, { cents: true })}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Ending cash</TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {fmtCurrency(t.endingCash, { cents: true })}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
