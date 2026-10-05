import { redirect } from "next/navigation";

import type { Metadata } from "next";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getMyProfile } from "@/server/profile-actions";

import { ProfilePageClient } from "./_components/profile-page-client";

export const metadata: Metadata = {
  title: "Profile",
  description: "View and manage your profile information.",
};

export default async function Page() {
  const data = await getMyProfile();
  if (!data) redirect("/auth/v2/login");

  return (
    <div className="flex flex-col gap-4 py-4" data-content-padding="false">
      <Breadcrumb className="px-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <span>Dashboard</span>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Profile</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <ProfilePageClient initialProfile={data.profile} userId={data.userId} />
    </div>
  );
}
