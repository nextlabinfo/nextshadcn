"use client";

import * as React from "react";
import { useTransition } from "react";

import { useRouter } from "next/navigation";

import { cn } from "cn";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CheckCircle,
  Circle,
  CircleOff,
  HelpCircle,
  MoreHorizontal,
  Pencil,
  Plus,
  Timer,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type AppTask, createTask, deleteTask, updateTask } from "@/server/feature-actions";

interface TasksClientProps {
  tasks: AppTask[];
}

type TaskFormState = {
  title: string;
  description: string;
  status: string;
  priority: string;
  label: string;
  dueDate: string;
};

const DEFAULT_FORM: TaskFormState = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  label: "feature",
  dueDate: "",
};

const statusOptions = [
  { value: "backlog", label: "Backlog", icon: HelpCircle },
  { value: "todo", label: "Todo", icon: Circle },
  { value: "in progress", label: "In Progress", icon: Timer },
  { value: "done", label: "Done", icon: CheckCircle },
  { value: "canceled", label: "Canceled", icon: CircleOff },
];

const priorityOptions = [
  { value: "low", label: "Low", icon: ArrowDown },
  { value: "medium", label: "Medium", icon: ArrowRight },
  { value: "high", label: "High", icon: ArrowUp },
];

const labelOptions = [
  { value: "bug", label: "Bug" },
  { value: "feature", label: "Feature" },
  { value: "documentation", label: "Documentation" },
];

const statusStyles: Record<string, string> = {
  backlog: "border-muted-foreground/20 bg-muted text-muted-foreground",
  todo: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  "in progress": "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  done: "border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-300",
  canceled: "border-muted-foreground/20 bg-muted text-muted-foreground",
};

function TaskFormFields({ form, onChange }: { form: TaskFormState; onChange: (next: Partial<TaskFormState>) => void }) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="task-title">Title</Label>
        <Input
          id="task-title"
          placeholder="Task title"
          value={form.title}
          onChange={(e) => onChange({ title: e.target.value })}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="task-description">Description</Label>
        <Input
          id="task-description"
          placeholder="Optional description"
          value={form.description}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="task-status">Status</Label>
          <Select value={form.status} onValueChange={(v) => onChange({ status: v })}>
            <SelectTrigger id="task-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="task-priority">Priority</Label>
          <Select value={form.priority} onValueChange={(v) => onChange({ priority: v })}>
            <SelectTrigger id="task-priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {priorityOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="task-label">Label</Label>
          <Select value={form.label} onValueChange={(v) => onChange({ label: v })}>
            <SelectTrigger id="task-label">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {labelOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="task-due-date">Due Date</Label>
          <Input
            id="task-due-date"
            type="date"
            value={form.dueDate}
            onChange={(e) => onChange({ dueDate: e.target.value })}
          />
        </div>
      </div>
    </>
  );
}

export function TasksClient({ tasks }: TasksClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [createOpen, setCreateOpen] = React.useState(false);
  const [createForm, setCreateForm] = React.useState<TaskFormState>(DEFAULT_FORM);

  const [editTarget, setEditTarget] = React.useState<AppTask | null>(null);
  const [editForm, setEditForm] = React.useState<TaskFormState>(DEFAULT_FORM);

  const [deleteTarget, setDeleteTarget] = React.useState<AppTask | null>(null);

  function openEdit(task: AppTask) {
    setEditTarget(task);
    setEditForm({
      title: task.title,
      description: task.description ?? "",
      status: task.status,
      priority: task.priority,
      label: task.label ?? "",
      dueDate: task.dueDate ?? "",
    });
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await createTask(createForm);
        toast.success("Task created.");
        setCreateForm(DEFAULT_FORM);
        setCreateOpen(false);
        router.refresh();
      } catch {
        toast.error("Failed to create task. Please try again.");
      }
    });
  }

  function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    startTransition(async () => {
      try {
        await updateTask(editTarget.id, editForm);
        toast.success("Task updated.");
        setEditTarget(null);
        router.refresh();
      } catch {
        toast.error("Failed to update task. Please try again.");
      }
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      try {
        await deleteTask(deleteTarget.id);
        toast.success("Task deleted.");
        setDeleteTarget(null);
        router.refresh();
      } catch {
        toast.error("Failed to delete task. Please try again.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl tracking-tight">Welcome back!</h2>
          <p className="text-muted-foreground">Here&apos;s a list of your tasks for this month!</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Task</DialogTitle>
              <DialogDescription>Create a new task to track your work.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <TaskFormFields form={createForm} onChange={(next) => setCreateForm((f) => ({ ...f, ...next }))} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending || !createForm.title}>
                  {isPending ? "Creating..." : "Create Task"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/70 bg-background">
        <Table className="**:data-[slot=table-cell]:px-4 **:data-[slot=table-head]:px-4">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-11 font-medium text-muted-foreground">Task</TableHead>
              <TableHead className="h-11 font-medium text-muted-foreground">Title</TableHead>
              <TableHead className="h-11 font-medium text-muted-foreground">Status</TableHead>
              <TableHead className="h-11 font-medium text-muted-foreground">Priority</TableHead>
              <TableHead className="h-11 font-medium text-muted-foreground" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No tasks found.
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => {
                const status = statusOptions.find((s) => s.value === task.status);
                const priority = priorityOptions.find((p) => p.value === task.priority);
                const label = labelOptions.find((l) => l.value === task.label);
                const StatusIcon = status?.icon;
                const PriorityIcon = priority?.icon;

                return (
                  <TableRow key={task.id} className="border-border/60 hover:bg-muted/20">
                    <TableCell className="py-3 align-middle">
                      <div className="w-20 font-mono text-muted-foreground text-sm">{task.id.slice(0, 8)}</div>
                    </TableCell>
                    <TableCell className="py-3 align-middle">
                      <div className="flex min-w-0 items-center gap-2">
                        {label && (
                          <Badge className="rounded-sm bg-transparent" variant="outline">
                            {label.label}
                          </Badge>
                        )}
                        <span className="max-w-lg truncate font-medium text-sm">{task.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 align-middle">
                      {status && (
                        <Badge
                          className={cn("gap-1.5 rounded-sm border font-medium", statusStyles[status.value])}
                          variant="outline"
                        >
                          {StatusIcon && <StatusIcon className="size-4" />}
                          {status.label}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-3 align-middle">
                      {priority && (
                        <div className="flex items-center gap-2 text-sm">
                          {PriorityIcon && <PriorityIcon className="size-4 text-muted-foreground" />}
                          {priority.label}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-3 text-right align-middle">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground data-[state=open]:bg-muted"
                          >
                            <MoreHorizontal />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onSelect={() => openEdit(task)}>
                            <Pencil className="mr-2 size-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onSelect={() => setDeleteTarget(task)}>
                            <Trash2 className="mr-2 size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit dialog */}
      <Dialog
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update the details for this task.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="flex flex-col gap-4">
            <TaskFormFields form={editForm} onChange={(next) => setEditForm((f) => ({ ...f, ...next }))} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditTarget(null)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || !editForm.title}>
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
