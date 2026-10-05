import { headers } from "next/headers";
import { redirect } from "next/navigation";

import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { getInfraKpis, getInfraProjects } from "@/server/infra-actions";

import { InfrastructureHeader } from "./_components/infrastructure-header";
import { ProjectEnvironments } from "./_components/project-environments";

// Import this stylesheet in any page or component that renders country flag classes.
import "@/styles/flag-icons/flags.css";

export const metadata: Metadata = {
  title: "Open Source Infrastructure Dashboard with shadcn/ui",
  description:
    "Explore an open source infrastructure dashboard with environments, server health, uptime, and deployment status.",
  alternates: {
    canonical: "/dashboard/infrastructure",
  },
};

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/auth/v2/login");

  const [projects, kpis] = await Promise.all([getInfraProjects(), getInfraKpis()]);

  return (
    <div className="flex flex-col gap-4">
      <InfrastructureHeader kpis={kpis} projectCount={projects.length} />

      <div className="flex flex-col gap-4">
        {projects.map((project) => (
          <ProjectEnvironments key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}
