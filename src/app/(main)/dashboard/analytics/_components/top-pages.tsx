import { Ellipsis } from "lucide-react";

import type { AnalyticsPage } from "@/lib/dashboards/types";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`;
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return `${Math.round(value)}`;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs.toString().padStart(2, "0")}s`;
}

export function TopPages({ pages }: { pages: AnalyticsPage[] }) {
  return (
    <Card className="h-full gap-2">
      <CardHeader>
        <CardTitle className="font-normal">Page Performance</CardTitle>
        <CardAction>
          <Ellipsis className="size-4" />
        </CardAction>
      </CardHeader>

      <CardContent className="px-0">
        <Table className="[&_td:first-child]:pl-4 [&_td:last-child]:pr-4 [&_th:first-child]:pl-4 [&_th:last-child]:pr-4">
          <TableHeader className="[&_tr]:border-border/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-8" />
              <TableHead className="h-8 w-24 text-right font-normal">Views</TableHead>
              <TableHead className="h-8 w-24 text-right font-normal">Avg Time</TableHead>
              <TableHead className="h-8 w-20 text-right font-normal">Bounce</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="[&_tr]:border-border/50">
            {pages.map((page) => (
              <TableRow className="hover:bg-transparent" key={page.path}>
                <TableCell className="max-w-0 truncate py-4 font-medium">{page.path}</TableCell>
                <TableCell className="text-right tabular-nums">{formatCompact(page.views)}</TableCell>
                <TableCell className="text-right text-muted-foreground tabular-nums">
                  {formatDuration(page.avgTimeSec)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground tabular-nums">
                  {page.bounceRate.toFixed(0)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
