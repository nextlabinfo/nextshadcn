import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getCrmActivities, getCrmKpis, getCrmLeads, getCrmOpportunities } from "@/server/crm-actions";

import { KpiCards } from "./_components/kpi-cards";
import { OpportunitiesSection } from "./_components/opportunities-section";
import { PipelineActivity } from "./_components/pipeline-activity";
import { TaskReminders } from "./_components/task-reminders";

export const metadata: Metadata = {
  title: "Open Source CRM Dashboard with shadcn/ui",
  description:
    "Explore an open source CRM dashboard with pipeline activity, opportunities, sales performance, and task reminders.",
  alternates: {
    canonical: "/dashboard/crm",
  },
};

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/auth/v2/login");

  const [kpis, opportunities, activities, leads] = await Promise.all([
    getCrmKpis(),
    getCrmOpportunities(),
    getCrmActivities(),
    getCrmLeads(),
  ]);

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <KpiCards kpis={kpis} />
      <PipelineActivity leads={leads} activities={activities} />
      <TaskReminders activities={activities} />
      <OpportunitiesSection data={opportunities} />
    </div>
  );
}
