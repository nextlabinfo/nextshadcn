import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getShipments } from "@/server/logistics-actions";

import { Logistics } from "./_components/logistics";

// Import this stylesheet in any page or component that renders country flag classes.
import "@/styles/flag-icons/flags.css";

export const metadata: Metadata = {
  title: "Open Source Logistics Dashboard with shadcn/ui",
  description:
    "Explore an open source logistics dashboard with shipment tracking, delivery status, route maps, cargo details, and transport information.",
  alternates: {
    canonical: "/dashboard/logistics",
  },
};

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/auth/v2/login");

  const shipments = await getShipments();

  return <Logistics shipments={shipments} />;
}
