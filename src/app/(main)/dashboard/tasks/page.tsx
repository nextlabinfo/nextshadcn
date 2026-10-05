import type { Metadata } from "next";

import { getTasks } from "@/server/feature-actions";

import { TasksClient } from "./_components/tasks-client";

export const metadata: Metadata = {
  title: "Open Source Task Manager with shadcn/ui",
  description:
    "Explore an open source task manager for searching, filtering, organizing, and tracking work in one place.",
  alternates: {
    canonical: "/dashboard/tasks",
  },
};

export default async function Page() {
  const tasks = await getTasks();
  return <TasksClient tasks={tasks} />;
}
