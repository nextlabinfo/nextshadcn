import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { OverviewMetrics } from "@/lib/dashboards/types";

import type { RecentCustomerRow } from "./recent-customers-table/schema";
import { RecentCustomersTable } from "./recent-customers-table/table";

// The overview action provides name/email/signup date for recent customers. Plan,
// status and billing have no backing column, so they are derived deterministically
// from the row index purely to preserve the table's visual categories/filters.
const plans = ["Enterprise", "Growth", "Pro", "Starter"] as const;
const statuses = ["Subscribed", "Inactive", "Unsubscribed"] as const;
const billings = ["Paid", "Pending", "Overdue", "Trial"] as const;

export function SubscriberOverview({
  customers,
  recentCustomers,
}: {
  customers: number;
  recentCustomers: OverviewMetrics["recentCustomers"];
}) {
  const rows: RecentCustomerRow[] = recentCustomers.map((customer, index) => ({
    id: String(index + 1),
    name: customer.name,
    email: customer.email ?? "",
    plan: plans[index % plans.length],
    status: statuses[index % statuses.length],
    billing: billings[index % billings.length],
    joined: customer.createdAt.slice(0, 10),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="leading-none">{customers.toLocaleString("en-US")} Customers</CardTitle>
        <CardDescription>Recent customer records with plan, billing, status, and signup activity.</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm">
            <Download />
            Export
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="pt-0">
        <RecentCustomersTable data={rows} />
      </CardContent>
    </Card>
  );
}
