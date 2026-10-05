import type { Metadata } from "next";

import { getUsers } from "@/server/feature-actions";

import { UsersClient } from "./_components/users-client";

export const metadata: Metadata = {
  title: "Open Source User Management Dashboard with shadcn/ui",
  description: "Explore an open source user management dashboard for browsing, filtering, and managing user accounts.",
  alternates: {
    canonical: "/dashboard/users",
  },
};

export default async function Page() {
  const users = await getUsers();
  return <UsersClient users={users} />;
}
