import { format } from "date-fns";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AcademyEvent } from "@/lib/dashboards/types";

function formatTimeRange(event: AcademyEvent) {
  const start = new Date(event.startAt);
  if (!event.endAt) return format(start, "hh:mm a");
  return `${format(start, "hh:mm a")} - ${format(new Date(event.endAt), "hh:mm a")}`;
}

export function UpcomingEvents({ events }: { events: AcademyEvent[] }) {
  const upcomingEvents = events.filter((event) => event.kind !== "class");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Upcoming Events</CardTitle>
        <CardAction className="flex items-center gap-1 text-muted-foreground text-xs">
          View Calendar <ArrowRight className="size-4" />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {upcomingEvents.map((event) => {
          const eventDate = new Date(event.startAt);

          return (
            <div key={event.id} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="size-11 shrink-0 overflow-hidden rounded-sm border">
                  <div className="grid h-1/3 place-items-center border-b bg-muted font-medium text-[10px] uppercase leading-none">
                    {format(eventDate, "MMM")}
                  </div>
                  <div className="grid h-2/3 place-items-center text-lg leading-none">{format(eventDate, "d")}</div>
                </div>

                <div className="flex min-w-0 flex-col gap-1">
                  <div className="truncate font-medium text-sm leading-none">{event.title}</div>
                  <div className="text-muted-foreground text-xs leading-none">{formatTimeRange(event)}</div>
                </div>
              </div>
              <Badge variant="outline" className="shrink-0 rounded-md px-2.5 py-1 font-medium text-[10px] capitalize">
                {event.kind}
              </Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
