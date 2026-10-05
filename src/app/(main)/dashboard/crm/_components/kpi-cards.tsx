import { ArrowUpRight } from "lucide-react";

import { Card, CardAction, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import type { CrmKpis } from "@/lib/dashboards/types";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function KpiCards({ kpis }: { kpis: CrmKpis }) {
  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-3xl tracking-tight">Pipeline Overview</h2>
        <p className="text-muted-foreground text-sm">
          Keep tabs on lead quality, open opportunities, and conversion rates across the current sales cycle.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Lead Pipeline Value</CardDescription>
            <CardAction>
              <ArrowUpRight className="size-4" />
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-3xl leading-none tracking-tight">
                {currencyFormatter.format(kpis.pipelineValue)}
              </span>
            </div>
            <p className="text-sm">
              <span className="font-medium text-foreground">{currencyFormatter.format(kpis.wonValue)}</span>{" "}
              <span className="text-muted-foreground">won</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Win Rate</CardDescription>
            <CardAction>
              <ArrowUpRight className="size-4" />
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-3xl leading-none tracking-tight">{kpis.winRatePct.toFixed(1)}%</span>
            </div>
            <p className="text-sm">
              <span className="text-muted-foreground">of closed opportunities won</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Open Opportunities</CardDescription>
            <CardAction>
              <ArrowUpRight className="size-4" />
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-3xl leading-none tracking-tight">{kpis.openOpportunities}</span>
            </div>
            <p className="text-sm">
              <span className="text-muted-foreground">currently in the pipeline</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Total Leads</CardDescription>
            <CardAction>
              <ArrowUpRight className="size-4" />
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-3xl leading-none tracking-tight">{kpis.leadCount}</span>
            </div>
            <p className="text-sm">
              <span className="text-muted-foreground">captured across all sources</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
