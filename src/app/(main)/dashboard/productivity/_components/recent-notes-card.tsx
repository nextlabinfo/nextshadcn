import { format, isToday, isYesterday } from "date-fns";
import { FileText } from "lucide-react";

import type { ProdNote } from "@/lib/dashboards/types";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatNoteDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d");
}

export function RecentNotesCard({ notes }: { notes: ProdNote[] }) {
  return (
    <Card className="shadow-xs">
      <CardHeader>
        <CardTitle>Recent Notes</CardTitle>
        <CardAction>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            View all
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {notes.length === 0 ? (
          <p className="text-muted-foreground text-sm">No notes yet.</p>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="flex items-start gap-4">
              <FileText className="size-5 text-muted-foreground" />
              <div className="min-w-0">
                <div className="truncate font-medium text-sm leading-none">{note.title}</div>
                <div className="text-muted-foreground text-xs">{formatNoteDate(note.createdAt)}</div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
