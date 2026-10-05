import type { Metadata } from "next";

import { getCalendarEvents } from "@/server/feature-actions";

import { CalendarClient } from "./_components/calendar-client";

export const metadata: Metadata = {
  title: "Open Source Calendar with shadcn/ui",
  description: "Explore an open source calendar interface for organizing events, schedules, and daily activities.",
  alternates: {
    canonical: "/dashboard/calendar",
  },
};

export default async function Page() {
  const events = await getCalendarEvents();

  return <CalendarClient initialEvents={events} />;
}
