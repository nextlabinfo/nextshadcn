import { ArrowUpRight } from "lucide-react";

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ShopProduct } from "@/lib/dashboards/types";

const categoryColors = ["var(--chart-3)", "var(--chart-2)", "var(--chart-1)", "var(--chart-4)", "var(--chart-5)"];

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function TopProducts({ products }: { products: ShopProduct[] }) {
  const productSales = products.map((product) => ({
    name: product.name,
    category: product.category ?? "Uncategorized",
    sales: product.price * product.unitsSold,
  }));
  const totalSales = productSales.reduce((sum, product) => sum + product.sales, 0);

  const categoryTotals = new Map<string, number>();
  for (const product of productSales) {
    categoryTotals.set(product.category, (categoryTotals.get(product.category) ?? 0) + product.sales);
  }
  const categories = Array.from(categoryTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, sales], index) => ({
      name,
      share: totalSales > 0 ? Math.round((sales / totalSales) * 100) : 0,
      color: categoryColors[index % categoryColors.length],
    }));

  const topProducts = productSales.slice(0, 3).map((product) => ({
    name: product.name,
    category: product.category,
    share: totalSales > 0 ? `${Math.round((product.sales / totalSales) * 100)}%` : "0%",
    sales: currencyFormatter.format(product.sales),
  }));
  const topSalesTotal = productSales.slice(0, 3).reduce((sum, product) => sum + product.sales, 0);
  const topSharePct = totalSales > 0 ? Math.round((topSalesTotal / totalSales) * 100) : 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-normal text-muted-foreground text-sm">Top Products</CardTitle>
        <CardDescription className="text-foreground text-xl tabular-nums leading-none tracking-tight">
          {topSharePct}% of sales
        </CardDescription>
        <CardAction>
          <ArrowUpRight className="size-4" />
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div aria-label="Sales by category" className="flex h-2 gap-1 overflow-hidden bg-muted" role="img">
            {categories.map((category) => (
              <div
                aria-hidden="true"
                key={category.name}
                className="rounded-md"
                style={{
                  backgroundColor: category.color,
                  width: `${category.share}%`,
                }}
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-4">
            {categories.map((category) => (
              <div className="flex items-center gap-1" key={category.name}>
                <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: category.color }} />
                <span className="text-muted-foreground text-xs">{category.name}</span>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-3">
          <div className="text-muted-foreground text-xs">Products</div>
          <div className="text-muted-foreground text-xs">Share</div>
          <div className="text-muted-foreground text-xs">Sales</div>

          {topProducts.map((product) => (
            <div className="contents text-sm" key={product.name}>
              <div className="min-w-0">
                <div className="truncate font-medium">{product.name}</div>
                <div className="text-muted-foreground text-xs">{product.category}</div>
              </div>
              <div className="self-center text-muted-foreground tabular-nums">{product.share}</div>
              <div className="self-center font-medium tabular-nums">{product.sales}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
