import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { PfCategorySlice } from "@/lib/dashboards/types";
import { formatCurrency } from "@/lib/utils";

const barClasses = ["bg-chart-3", "bg-chart-3/75", "bg-chart-3/50"];

export function IncomeBreakdown({ slices }: { slices: PfCategorySlice[] }) {
  const sources = slices.slice(0, 3);
  const total = sources.reduce((sum, item) => sum + item.total, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">Income sources</CardTitle>
      </CardHeader>

      <CardContent className="grid grid-cols-1 gap-1 md:grid-cols-3">
        {sources.map((source, index) => {
          const percentage = total > 0 ? Math.round((source.total / total) * 100) : 0;

          return (
            <section className="isolate flex gap-[0.5px]" key={source.name}>
              <Separator
                orientation="vertical"
                className="mb-1 h-auto self-auto border-muted-foreground/50 border-l border-dashed bg-transparent"
              />
              <div className="flex min-h-24 flex-1 flex-col justify-between">
                <div className="flex min-w-0 flex-col gap-1 px-1">
                  <p className="wrap-break-word text-muted-foreground text-xs leading-none">
                    {source.name} · {percentage}%
                  </p>
                  <div className="text-lg leading-none tracking-tight">{formatCurrency(source.total)}</div>
                </div>
                <div className={`-ml-0.5 h-5 rounded-sm ${barClasses[index] ?? "bg-chart-3/50"}`} />
              </div>
            </section>
          );
        })}
      </CardContent>
    </Card>
  );
}
