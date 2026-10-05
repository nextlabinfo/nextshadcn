"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PfTransaction } from "@/lib/dashboards/types";
import { formatCurrency } from "@/lib/utils";

const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  weekday: "long",
});

const formatWeekday = (value: number) => weekdayFormatter.format(new Date(value));

const formatTooltipCurrency = (value: number | string) => formatCurrency(Number(value), { noDecimals: true });

const chartConfig = {
  expense: {
    color: "var(--chart-4)",
    label: "Expense",
  },
  income: {
    color: "var(--chart-2)",
    label: "Income",
  },
} satisfies ChartConfig;

function buildChartData(transactions: PfTransaction[]) {
  const byDay = new Map<string, { expense: number; income: number }>();

  for (const txn of transactions) {
    const key = txn.txnDate;
    if (!key) {
      continue;
    }
    const bucket = byDay.get(key) ?? { expense: 0, income: 0 };
    if (txn.direction === "credit") {
      bucket.income += txn.amount;
    } else {
      bucket.expense += txn.amount;
    }
    byDay.set(key, bucket);
  }

  return [...byDay.entries()]
    .map(([date, value]) => ({
      date,
      expense: value.expense,
      income: value.income > 0 ? value.income : undefined,
      timestamp: Date.parse(`${date}T00:00:00Z`),
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
}

export function TransactionsOverviewCard({ transactions }: { transactions: PfTransaction[] }) {
  const chartData = buildChartData(transactions);
  const timestamps = chartData.map((item) => item.timestamp);
  const chartDomain = timestamps.length > 0 ? [Math.min(...timestamps), Math.max(...timestamps)] : [0, 1];
  const weekdayTicks = timestamps;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">Spending Overview</CardTitle>
        <CardAction>
          <Select defaultValue="weekly">
            <SelectTrigger className="w-28" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig} className="h-50 w-full">
          <LineChart accessibilityLayer data={chartData} margin={{ bottom: 0, left: 0, right: 0, top: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="timestamp"
              domain={chartDomain}
              scale="time"
              tickFormatter={formatWeekday}
              tickLine={false}
              tickMargin={10}
              ticks={weekdayTicks}
              tick={{ fontSize: 12 }}
              type="number"
            />
            <YAxis hide axisLine={false} tickLine={false} tickMargin={10} tick={{ fontSize: 12 }} />
            <ChartTooltip
              cursor={false}
              content={({ active, payload, label }) => (
                <ChartTooltipContent
                  active={active}
                  hideLabel
                  label={label}
                  payload={payload?.map((item) => ({
                    ...item,
                    value: typeof item.value === "number" ? formatTooltipCurrency(item.value) : item.value,
                  }))}
                />
              )}
            />
            <Line
              connectNulls
              dataKey="income"
              dot={false}
              stroke="var(--color-income)"
              strokeDasharray="5 5"
              strokeLinecap="round"
              strokeWidth={1}
              type="linear"
            />
            <Line
              dataKey="expense"
              dot={false}
              stroke="var(--color-expense)"
              strokeLinecap="round"
              strokeWidth={3}
              type="linear"
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
