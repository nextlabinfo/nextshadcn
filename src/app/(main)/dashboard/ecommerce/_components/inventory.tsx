"use client";

import { ArrowUpRight, PackageCheck, PackageX, TriangleAlert } from "lucide-react";
import { Label, Pie, PieChart } from "recharts";

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import { Separator } from "@/components/ui/separator";
import type { ShopProduct } from "@/lib/dashboards/types";

const LOW_STOCK_THRESHOLD = 10;
const gaugeSegmentCount = 32;

const chartConfig = {
  "in-stock": {
    label: "In stock",
    color: "var(--chart-2)",
  },
  "low-stock": {
    label: "Low stock",
    color: "var(--chart-1)",
  },
  "out-of-stock": {
    label: "Out of stock",
    color: "var(--destructive)",
  },
} satisfies ChartConfig;

export function Inventory({ products }: { products: ShopProduct[] }) {
  const outOfStock = products.filter((product) => product.stock <= 0).length;
  const lowStock = products.filter(
    (product) => product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD,
  ).length;
  const inStock = products.filter((product) => product.stock > LOW_STOCK_THRESHOLD).length;
  const totalUnits = products.length;
  const availablePercent = totalUnits > 0 ? Math.round((inStock / totalUnits) * 100) : 0;
  const inStockSegments = totalUnits > 0 ? Math.round((inStock / totalUnits) * gaugeSegmentCount) : 0;
  const lowStockSegments = totalUnits > 0 ? Math.round((lowStock / totalUnits) * gaugeSegmentCount) : 0;

  const getGaugeSegmentStatus = (index: number) => {
    if (index < inStockSegments) {
      return "in-stock";
    }

    if (index < inStockSegments + lowStockSegments) {
      return "low-stock";
    }

    return "out-of-stock";
  };

  const gaugeSegments = Array.from({ length: gaugeSegmentCount }, (_, index) => {
    const status = getGaugeSegmentStatus(index);
    return {
      fill: `var(--color-${status})`,
      id: `segment-${index + 1}`,
      status,
      value: 1,
    };
  });

  const inventorySummary = [
    { icon: PackageCheck, label: "In stock", value: inStock },
    { icon: TriangleAlert, label: "Low stock", value: lowStock },
    { icon: PackageX, label: "Out", value: outOfStock },
  ] as const;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-normal text-muted-foreground text-sm">Inventory</CardTitle>
        <CardDescription className="text-foreground text-xl tabular-nums leading-none tracking-tight">
          {availablePercent}% available
        </CardDescription>
        <CardAction>
          <ArrowUpRight className="size-4" />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ChartContainer config={chartConfig} className="mx-auto h-30 w-full">
          <PieChart>
            <Pie
              cx="50%"
              cy="100%"
              cornerRadius={6}
              data={gaugeSegments}
              dataKey="value"
              endAngle={0}
              innerRadius={80}
              outerRadius={110}
              paddingAngle={2}
              startAngle={180}
              stroke="var(--card)"
              strokeWidth={1}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text textAnchor="middle" x={viewBox.cx} y={viewBox.cy}>
                        <tspan
                          className="fill-foreground font-medium text-2xl tabular-nums"
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 22}
                        >
                          {availablePercent}%
                        </tspan>
                        <tspan className="fill-muted-foreground text-xs" x={viewBox.cx} y={(viewBox.cy || 0) + 38}>
                          Available
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
        <Separator />

        <div className="grid grid-cols-3 divide-x">
          {inventorySummary.map((item, _index) => (
            <div key={item.label} className="flex flex-col items-center gap-3 text-center">
              <div className="grid size-9 place-items-center rounded-full bg-muted">
                <item.icon className="size-4 text-muted-foreground" />
              </div>
              <div>
                <div className="text-muted-foreground text-xs leading-none">{item.label}</div>
                <div className="font-medium text-sm tabular-nums">{item.value.toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
