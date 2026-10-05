import type { Metadata } from "next";

import { getRoles } from "@/server/feature-actions";

import { RolesClient } from "./_components/roles-client";

export const metadata: Metadata = {
  title: "Open Source Roles and Permissions UI with shadcn/ui",
  description: "Explore an open source roles and permissions interface for reviewing access levels and managing roles.",
  alternates: {
    canonical: "/dashboard/roles",
  },
};

export default async function Page() {
  const roles = await getRoles();
  return <RolesClient roles={roles} />;
}
