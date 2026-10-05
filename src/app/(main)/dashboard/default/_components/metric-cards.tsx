import { DollarSign, Eye, ShoppingCart, TrendingDown, TrendingUp, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { OverviewMetrics } from "@/lib/dashboards/types";

export function MetricCards({ metrics }: { metrics: OverviewMetrics }) {
  const revenueUp = metrics.revenueDeltaPct >= 0;
  const revenue = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(metrics.revenue);
  const deltaLabel = `${revenueUp ? "+" : ""}${metrics.revenueDeltaPct.toFixed(1)}%`;

  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs xl:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <DollarSign className="size-4" />
            </div>
          </CardTitle>
          <CardDescription>Total Revenue</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">{revenue}</div>
            <Badge variant={revenueUp ? "default" : "destructive"}>
              {revenueUp ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              {deltaLabel}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">Last 30 days vs previous 30 days</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <ShoppingCart className="size-4" />
            </div>
          </CardTitle>
          <CardDescription>Orders</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">
              {metrics.orders.toLocaleString("en-US")}
            </div>
          </div>
          <p className="text-muted-foreground text-sm">Total orders placed</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <Users className="size-4" />
            </div>
          </CardTitle>
          <CardDescription>Customers</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">
              {metrics.customers.toLocaleString("en-US")}
            </div>
          </div>
          <p className="text-muted-foreground text-sm">Total registered customers</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <Eye className="size-4" />
            </div>
          </CardTitle>
          <CardDescription>Visitors</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">
              {metrics.visitors.toLocaleString("en-US")}
            </div>
          </div>
          <p className="text-muted-foreground text-sm">Visitors in the last 30 days</p>
        </CardContent>
      </Card>
    </div>
  );
}
