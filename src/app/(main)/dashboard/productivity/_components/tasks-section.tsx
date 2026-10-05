"use client";

import * as React from "react";

import { format } from "date-fns";
import { Calendar1, Plus } from "lucide-react";

import type { AppTask } from "@/server/feature-actions";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function formatDue(dueDate: string | null) {
  if (!dueDate) return "No due date";
  const parsed = new Date(dueDate);
  if (Number.isNaN(parsed.getTime())) return "No due date";
  return format(parsed, "MMM d");
}

export function TasksSection({ tasks }: { tasks: AppTask[] }) {
  const [items, setItems] = React.useState(tasks);

  React.useEffect(() => {
    setItems(tasks);
  }, [tasks]);

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl tracking-tight">Tasks</h2>
        <div className="flex items-center gap-2">
          <Select defaultValue="today">
            <SelectTrigger className="w-30">
              <SelectValue placeholder="Today" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="tomorrow">Tomorrow</SelectItem>
                <SelectItem value="this-week">This Week</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button>
            <Plus data-icon="inline-start" />
            New Task
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-background shadow-xs">
        {items.length === 0 ? (
          <div className="grid place-items-center p-8 text-muted-foreground text-sm">No tasks yet.</div>
        ) : (
          <div className="divide-y">
            {items.map((task) => (
              <div key={task.id} className="flex items-center gap-2 p-4">
                <Checkbox
                  checked={task.status === "done"}
                  aria-label={task.title}
                  onCheckedChange={(checked) => {
                    setItems((current) =>
                      current.map((item) =>
                        item.id === task.id ? { ...item, status: checked === true ? "done" : "todo" } : item,
                      ),
                    );
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:gap-4">
                      <span className="truncate text-sm">{task.title}</span>
                      <Badge variant="outline" className="px-3 py-1 font-normal">
                        {task.label ?? task.priority}
                      </Badge>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-muted-foreground text-sm">
                      <span>{formatDue(task.dueDate)}</span>
                      <Calendar1 className="size-4" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
