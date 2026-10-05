import { ArrowDownRight, ArrowUpRight, Ellipsis } from "lucide-react";

import type { AnalyticsKpis } from "@/lib/dashboards/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

type KpiCard = {
  title: string;
  value: string;
  delta?: number;
  previous?: string;
};

export function AnalyticsKpiStrip({ kpis }: { kpis: AnalyticsKpis }) {
  const previousVisitors =
    kpis.visitorsDeltaPct !== -100 ? Math.round(kpis.visitors / (1 + kpis.visitorsDeltaPct / 100)) : 0;

  const cards: KpiCard[] = [
    {
      title: "Unique Visitors",
      value: formatCompact(kpis.visitors),
      delta: kpis.visitorsDeltaPct,
      previous: formatCompact(previousVisitors),
    },
    { title: "Sessions", value: formatCompact(kpis.sessions) },
    { title: "Pageviews", value: formatCompact(kpis.pageviews) },
    { title: "Bounce Rate", value: `${kpis.avgBounceRate.toFixed(1)}%` },
    { title: "Avg Duration", value: formatDuration(kpis.avgDurationSec) },
  ];

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-xs ring-1 ring-foreground/10">
      <div className="grid divide-y *:data-[slot=card]:rounded-none *:data-[slot=card]:ring-0 md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-5">
        {cards.map((card) => {
          const hasDelta = typeof card.delta === "number";
          const isUp = (card.delta ?? 0) >= 0;

          return (
            <Card key={card.title}>
              <CardHeader>
                <CardTitle className="font-normal text-sm">{card.title}</CardTitle>
                <CardAction>
                  <Ellipsis className="size-4" />
                </CardAction>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-2xl leading-none tracking-tight">{card.value}</div>
                  {hasDelta ? (
                    isUp ? (
                      <Badge className="bg-green-500/10 text-green-700 dark:bg-green-500/15 dark:text-green-300">
                        <ArrowUpRight />
                        {Math.abs(card.delta ?? 0).toFixed(1)}%
                      </Badge>
                    ) : (
                      <Badge className="bg-destructive/10 text-destructive">
                        <ArrowDownRight />
                        {Math.abs(card.delta ?? 0).toFixed(1)}%
                      </Badge>
                    )
                  ) : null}
                </div>

                {hasDelta ? (
                  <div className="flex items-center gap-2 text-muted-foreground text-xs">
                    <span>
                      from <span className="text-foreground">{card.previous}</span>
                    </span>
                    <span>•</span>
                    <span>last week</span>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
