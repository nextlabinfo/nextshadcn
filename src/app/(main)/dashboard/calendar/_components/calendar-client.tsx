"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { useCalendarController } from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import interactionPlugin from "@fullcalendar/react/interaction";
import listPlugin from "@fullcalendar/react/list";
import multiMonthPlugin from "@fullcalendar/react/multimonth";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import { differenceInCalendarDays, endOfMonth, format, startOfMonth } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, XIcon } from "lucide-react";
import { toast } from "sonner";

import { EventCalendarViews } from "@/components/calendar/event-calendar-views";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  type CalendarEvent,
  createCalendarEvent,
  deleteCalendarEvent,
  updateCalendarEvent,
} from "@/server/feature-actions";

const views = [
  { key: "dayGridMonth", label: "Month" },
  { key: "timeGridWeek", label: "Week" },
  { key: "timeGridDay", label: "Day" },
];

const calendars = [
  { key: "all", label: "All calendars" },
  { key: "work", label: "Work" },
  { key: "personal", label: "Personal" },
  { key: "team", label: "Team" },
  { key: "focus", label: "Focus time" },
];

const colorOptions = [
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "red", label: "Red" },
  { value: "purple", label: "Purple" },
  { value: "orange", label: "Orange" },
];

const plugins = [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin, multiMonthPlugin];

function toFcEvent(event: CalendarEvent) {
  return {
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end ?? undefined,
    allDay: event.allDay,
    backgroundColor: event.color,
    borderColor: event.color,
  };
}

interface EventFormState {
  title: string;
  description: string;
  color: string;
  start: string;
  end: string;
  allDay: boolean;
}

function toDatetimeLocal(iso: string | undefined): string {
  if (!iso) return "";
  // ISO string to datetime-local format (yyyy-MM-ddTHH:mm)
  return iso.slice(0, 16);
}

function toIso(datetimeLocal: string): string {
  if (!datetimeLocal) return "";
  return new Date(datetimeLocal).toISOString();
}

interface CalendarClientProps {
  initialEvents: CalendarEvent[];
}

export function CalendarClient({ initialEvents }: CalendarClientProps) {
  const router = useRouter();
  const controller = useCalendarController();
  const [events, setEvents] = React.useState<CalendarEvent[]>(initialEvents);
  const [isPending, startTransition] = React.useTransition();
  const [selectedCalendar, setSelectedCalendar] = React.useState(calendars[0].key);
  const [dateInfo, setDateInfo] = React.useState(() => {
    const now = new Date();
    return {
      title: format(now, "MMMM yyyy"),
      days: differenceInCalendarDays(endOfMonth(now), startOfMonth(now)) + 1,
      start: startOfMonth(now),
      end: endOfMonth(now),
    };
  });

  // Create dialog
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createForm, setCreateForm] = React.useState<EventFormState>({
    title: "",
    description: "",
    color: "blue",
    start: "",
    end: "",
    allDay: false,
  });

  // Edit/delete dialog
  const [editOpen, setEditOpen] = React.useState(false);
  const [editingEvent, setEditingEvent] = React.useState<CalendarEvent | null>(null);
  const [editForm, setEditForm] = React.useState<EventFormState>({
    title: "",
    description: "",
    color: "blue",
    start: "",
    end: "",
    allDay: false,
  });

  const fcEvents = React.useMemo(() => events.map(toFcEvent), [events]);

  function handleDateClick(arg: { dateStr: string; allDay: boolean }) {
    const dateStr = arg.dateStr.length === 10 ? `${arg.dateStr}T09:00` : arg.dateStr.slice(0, 16);
    setCreateForm({
      title: "",
      description: "",
      color: "blue",
      start: dateStr,
      end: dateStr,
      allDay: arg.allDay,
    });
    setCreateOpen(true);
  }

  function handleEventClick(arg: { event: { id: string } }) {
    const found = events.find((e) => e.id === arg.event.id);
    if (!found) return;
    setEditingEvent(found);
    setEditForm({
      title: found.title,
      description: found.description ?? "",
      color: found.color,
      start: toDatetimeLocal(found.start),
      end: toDatetimeLocal(found.end ?? undefined),
      allDay: found.allDay,
    });
    setEditOpen(true);
  }

  function handleCreate() {
    if (!createForm.title.trim()) return;

    startTransition(async () => {
      try {
        const created = await createCalendarEvent({
          title: createForm.title.trim(),
          description: createForm.description.trim(),
          start: toIso(createForm.start),
          end: toIso(createForm.end || createForm.start),
          allDay: createForm.allDay,
          color: createForm.color,
        });
        setEvents((prev) => [...prev, created]);
        setCreateOpen(false);
        toast.success("Event created");
        router.refresh();
      } catch {
        toast.error("Failed to create event");
      }
    });
  }

  function handleUpdate() {
    if (!editingEvent || !editForm.title.trim()) return;

    startTransition(async () => {
      try {
        const updated = await updateCalendarEvent(editingEvent.id, {
          title: editForm.title.trim(),
          description: editForm.description.trim(),
          start: toIso(editForm.start),
          end: toIso(editForm.end || editForm.start),
          allDay: editForm.allDay,
          color: editForm.color,
        });
        setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
        setEditOpen(false);
        toast.success("Event updated");
        router.refresh();
      } catch {
        toast.error("Failed to update event");
      }
    });
  }

  function handleDelete() {
    if (!editingEvent) return;

    startTransition(async () => {
      try {
        await deleteCalendarEvent(editingEvent.id);
        setEvents((prev) => prev.filter((e) => e.id !== editingEvent.id));
        setEditOpen(false);
        toast.success("Event deleted");
        router.refresh();
      } catch {
        toast.error("Failed to delete event");
      }
    });
  }

  const eventCount = React.useMemo(() => {
    return events.filter((e) => {
      const start = new Date(e.start);
      return start >= dateInfo.start && start < dateInfo.end;
    }).length;
  }, [events, dateInfo.start, dateInfo.end]);

  return (
    <>
      <div className="flex flex-col overflow-hidden rounded-md border">
        <div className="flex flex-col gap-4 border-b bg-sidebar p-4 text-sidebar-foreground lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 shrink-0 flex-col gap-1">
            <div className="font-medium text-lg leading-none">{dateInfo.title}</div>
            <p className="text-muted-foreground text-sm">
              {dateInfo.days} days - {eventCount} events
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={selectedCalendar} onValueChange={setSelectedCalendar}>
              <SelectTrigger className="w-full sm:w-44">
                <CalendarIcon />
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectGroup>
                  {calendars.map((calendar) => (
                    <SelectItem key={calendar.key} value={calendar.key}>
                      {calendar.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <ButtonGroup>
              <Button size="icon" variant="outline" onClick={() => controller.prev()}>
                <ChevronLeft />
              </Button>
              <Button variant="outline" onClick={() => controller.today()}>
                Today
              </Button>
              <Button size="icon" variant="outline" onClick={() => controller.next()}>
                <ChevronRight />
              </Button>
            </ButtonGroup>
            <Select
              value={controller.view?.type ?? views[0].key}
              onValueChange={(value) => {
                controller.changeView(value);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectGroup>
                  {views.map((v) => (
                    <SelectItem key={v.key} value={v.key}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus />
              Add event
            </Button>
          </div>
        </div>

        <EventCalendarViews
          controller={controller}
          initialView={views[0].key}
          plugins={[...plugins]}
          popoverCloseContent={() => <XIcon className="size-5 text-muted-foreground group-hover:text-foreground" />}
          events={fcEvents}
          nowIndicator
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          datesSet={(info) => {
            setDateInfo({
              title: info.view.title,
              days: differenceInCalendarDays(info.view.currentEnd, info.view.currentStart),
              start: info.view.currentStart,
              end: info.view.currentEnd,
            });
          }}
        />
      </div>

      {/* Create event dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Event</DialogTitle>
          </DialogHeader>
          <EventFormFields form={createForm} onChange={setCreateForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!createForm.title.trim() || isPending}>
              {isPending ? "Creating..." : "Create Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit/delete event dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          <EventFormFields form={editForm} onChange={setEditForm} />
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? "Deleting..." : "Delete"}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={!editForm.title.trim() || isPending}>
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function EventFormFields({
  form,
  onChange,
}: {
  form: EventFormState;
  onChange: React.Dispatch<React.SetStateAction<EventFormState>>;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="event-title">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="event-title"
          value={form.title}
          onChange={(e) => onChange((f) => ({ ...f, title: e.target.value }))}
          placeholder="Event title"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="event-description">Description</Label>
        <Textarea
          id="event-description"
          value={form.description}
          onChange={(e) => onChange((f) => ({ ...f, description: e.target.value }))}
          placeholder="Optional description"
          rows={2}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="event-color">Color</Label>
        <Select value={form.color} onValueChange={(v) => onChange((f) => ({ ...f, color: v }))}>
          <SelectTrigger id="event-color">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {colorOptions.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="event-start">Start</Label>
          <Input
            id="event-start"
            type="datetime-local"
            value={form.start}
            onChange={(e) => onChange((f) => ({ ...f, start: e.target.value }))}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="event-end">End</Label>
          <Input
            id="event-end"
            type="datetime-local"
            value={form.end}
            onChange={(e) => onChange((f) => ({ ...f, end: e.target.value }))}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          id="event-allday"
          type="checkbox"
          checked={form.allDay}
          onChange={(e) => onChange((f) => ({ ...f, allDay: e.target.checked }))}
          className="rounded border-border"
        />
        <Label htmlFor="event-allday" className="cursor-pointer font-normal">
          All day
        </Label>
      </div>
    </div>
  );
}
