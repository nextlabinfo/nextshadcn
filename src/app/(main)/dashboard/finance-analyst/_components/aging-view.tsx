import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtCurrency } from "@/lib/finance/format";
import type { AgingReport } from "@/lib/finance/types";

const BUCKET_TONE: Record<string, string> = {
  Current: "text-foreground",
  "1–30": "text-foreground",
  "31–60": "text-amber-600 dark:text-amber-400",
  "61–90": "text-orange-600 dark:text-orange-400",
  "90+": "text-destructive",
};

export function AgingView({ report, kind }: { report: AgingReport; kind: "AR" | "AP" }) {
  const partyLabel = kind === "AR" ? "Customer" : "Vendor";
  const refLabel = kind === "AR" ? "Invoice" : "Bill";
  const metricLabel = kind === "AR" ? "DSO" : "DPO";
  const metricValue = kind === "AR" ? report.dso : report.dpo;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {report.buckets.map((b) => (
          <Card key={b.label} className="gap-1">
            <CardHeader className="pb-0">
              <CardTitle className="font-normal text-muted-foreground text-xs">{b.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-lg tabular-nums leading-none tracking-tight ${BUCKET_TONE[b.label] ?? ""}`}>
                {fmtCurrency(b.amount, { compact: true })}
              </div>
              <p className="text-muted-foreground text-xs">{b.count} open</p>
            </CardContent>
          </Card>
        ))}
        <Card className="gap-1">
          <CardHeader className="pb-0">
            <CardTitle className="font-normal text-muted-foreground text-xs">{metricLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg tabular-nums leading-none tracking-tight">{Math.round(metricValue ?? 0)} days</div>
            <p className="text-muted-foreground text-xs">
              total {fmtCurrency(report.totalOutstanding, { compact: true })}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-normal">
            {kind === "AR" ? "Accounts receivable" : "Accounts payable"} detail — as of {report.asOf}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{refLabel}</TableHead>
                <TableHead>{partyLabel}</TableHead>
                <TableHead>Due date</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead className="text-right">Days past due</TableHead>
                <TableHead>Bucket</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nothing outstanding.
                  </TableCell>
                </TableRow>
              ) : (
                report.rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.reference}</TableCell>
                    <TableCell>{r.party}</TableCell>
                    <TableCell className="text-muted-foreground">{r.dueDate}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmtCurrency(r.outstanding, { cents: true })}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{r.daysPastDue > 0 ? r.daysPastDue : 0}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={BUCKET_TONE[r.bucket] ?? ""}>
                        {r.bucket}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
