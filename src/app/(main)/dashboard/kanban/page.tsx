import type { Metadata } from "next";

import { getKanbanBoard } from "@/server/feature-actions";

import { KanbanClient } from "./_components/kanban-client";

export const metadata: Metadata = {
  title: "Open Source Kanban Board with shadcn/ui",
  description:
    "Explore an open source Kanban board for organizing work, tracking progress, and managing tasks visually.",
  alternates: {
    canonical: "/dashboard/kanban",
  },
};

export default async function Page() {
  const board = await getKanbanBoard();

  return (
    <div data-content-padding="false">
      <KanbanClient initialBoard={board} />
    </div>
  );
}
