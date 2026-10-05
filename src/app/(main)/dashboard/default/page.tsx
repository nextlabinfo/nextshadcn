import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getOverviewMetrics } from "@/server/overview-actions";

import { MetricCards } from "./_components/metric-cards";
import { PerformanceOverview } from "./_components/performance-overview";
import { SubscriberOverview } from "./_components/subscriber-overview";

export const metadata: Metadata = {
  title: "Open Source Business Dashboard with shadcn/ui",
  description:
    "Explore an open source admin dashboard with business metrics, customer activity, performance charts, and customer data.",
  alternates: {
    canonical: "/dashboard/default",
  },
};

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/auth/v2/login");

  const metrics = await getOverviewMetrics();

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <MetricCards metrics={metrics} />
      <PerformanceOverview data={metrics.newCustomersSeries} />
      <SubscriberOverview customers={metrics.customers} recentCustomers={metrics.recentCustomers} />
    </div>
  );
}
