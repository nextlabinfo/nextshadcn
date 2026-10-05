import { format, parseISO } from "date-fns";
import { ChevronRight, Receipt, Zap } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import type { PfTransaction } from "@/lib/dashboards/types";
import { formatCurrency } from "@/lib/utils";

function formatTxnDate(value: string) {
  if (!value) {
    return "";
  }
  try {
    return format(parseISO(value), "MMMM dd, yyyy");
  } catch {
    return value;
  }
}

export function UpcomingTransactions({ transactions }: { transactions: PfTransaction[] }) {
  const total = transactions.reduce((sum, txn) => sum + txn.amount, 0);
  const today = new Date().toISOString().slice(0, 10);
  const autopayToday = transactions
    .filter((txn) => txn.txnDate === today)
    .reduce((sum, txn) => sum + txn.amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">Upcoming Bills & Payments</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="flex items-baseline text-3xl leading-none tracking-tight">
              <span className="font-normal">{formatCurrency(total, { noDecimals: true })}</span>
            </h2>
            <p className="text-muted-foreground text-sm leading-none">
              You have <span className="font-medium text-foreground">{transactions.length}</span> bills due this month
            </p>
          </div>
          <div className="flex w-max items-center gap-2 rounded-md border border-border bg-muted/70 px-2 py-1.5 text-sm">
            <Zap className="size-4 fill-primary text-primary" />
            <span className="text-muted-foreground">
              Autopay will process{" "}
              <span className="font-medium text-foreground">{formatCurrency(autopayToday)}</span> today
            </span>
          </div>
        </div>

        <ItemGroup>
          {transactions.map((transaction) => (
            <Item key={transaction.id} variant="outline" size="xs">
              <ItemMedia>
                <div className="grid size-9 place-items-center rounded-md border bg-background">
                  <Receipt className="size-4 text-muted-foreground" />
                </div>
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{transaction.merchant ?? transaction.description}</ItemTitle>
                <ItemDescription>{formatTxnDate(transaction.txnDate)}</ItemDescription>
              </ItemContent>
              <ItemActions>
                <ChevronRight className="size-5 text-muted-foreground" />
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      </CardContent>
    </Card>
  );
}
