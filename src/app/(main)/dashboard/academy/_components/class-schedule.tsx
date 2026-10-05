import { format } from "date-fns";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AcademyEvent } from "@/lib/dashboards/types";

type ClassState = "in-progress" | "upcoming" | "done";

const stateStyles: Record<ClassState, { accent: string; badge: string; label: string }> = {
  "in-progress": {
    accent: "bg-green-600 dark:bg-green-400",
    badge:
      "border-green-600/50 bg-green-50 text-green-600 dark:border-green-800/50 dark:bg-green-500/10 dark:text-green-400",
    label: "In Progress",
  },
  upcoming: {
    accent: "bg-yellow-500 dark:bg-yellow-400",
    badge:
      "border-yellow-600/50 bg-yellow-50 text-yellow-700 dark:border-yellow-800/50 dark:bg-yellow-500/10 dark:text-yellow-300",
    label: "Upcoming",
  },
  done: {
    accent: "bg-destructive",
    badge: "border-destructive/50 bg-destructive/10 text-destructive dark:border-destructive/50 dark:bg-destructive/20",
    label: "Done",
  },
};

function getState(event: AcademyEvent, now: number): ClassState {
  const start = new Date(event.startAt).getTime();
  const end = event.endAt ? new Date(event.endAt).getTime() : start;

  if (now < start) return "upcoming";
  if (now > end) return "done";
  return "in-progress";
}

export function ClassSchedule({ events }: { events: AcademyEvent[] }) {
  const now = Date.now();
  const classes = events.filter((event) => event.kind === "class");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Class Schedule</CardTitle>
        <CardAction className="flex items-center gap-1 text-muted-foreground text-xs">
          View Full Schedule <ArrowRight className="size-4" />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-0">
        <div className="flex flex-col divide-y divide-border">
          {classes.map((event) => {
            const state = getState(event, now);
            const styles = stateStyles[state];
            const start = new Date(event.startAt);
            const timeRange = event.endAt
              ? `${format(start, "HH:mm")} - ${format(new Date(event.endAt), "HH:mm")}`
              : format(start, "HH:mm");

            return (
              <div
                key={event.id}
                className="grid grid-cols-1 gap-3 bg-card py-3 transition-colors hover:bg-muted/30 sm:grid-cols-[10rem_1fr_auto] sm:items-center"
              >
                <div className="flex gap-2">
                  <div className={`w-1 shrink-0 rounded-md ${styles.accent}`} />
                  <div className="text-nowrap text-xs">
                    <div className="font-medium text-foreground">{timeRange}</div>
                    <div className="text-muted-foreground">{format(start, "EEEE, d MMMM")}</div>
                  </div>
                </div>

                <div className="flex min-w-0 flex-col gap-1">
                  <div className="truncate font-medium text-foreground text-sm leading-none">{event.title}</div>
                  <div className="truncate text-muted-foreground text-xs leading-none">
                    {event.location ?? "Location TBD"}
                  </div>
                </div>

                <Badge
                  variant="secondary"
                  className={`shrink-0 rounded-md px-2.5 py-1 font-medium text-[10px] ${styles.badge}`}
                >
                  {styles.label}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
