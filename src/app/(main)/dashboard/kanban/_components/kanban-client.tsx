"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { CollisionPriority } from "@dnd-kit/abstract";
import { move } from "@dnd-kit/helpers";
import {
  DragDropProvider,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  useDroppable,
} from "@dnd-kit/react";
import { isSortable, useSortable } from "@dnd-kit/react/sortable";
import { cn } from "cn";
import { CalendarDays, GripVertical, MoreVertical, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  type AppTask,
  createKanbanTask,
  deleteTask,
  type KanbanBoardData,
  moveKanbanTask,
} from "@/server/feature-actions";

type BoardState = Record<string, AppTask[]>;

type TaskDragData = {
  type: "task";
  task: AppTask;
  columnId: string;
};

function isTaskDragData(value: unknown): value is TaskDragData {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    (value as Record<string, unknown>).type === "task" &&
    "task" in value &&
    "columnId" in value
  );
}

const priorityConfig: Record<string, { label: string; className: string }> = {
  high: {
    label: "High",
    className: "bg-red-500/10 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  },
  medium: {
    label: "Medium",
    className: "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  },
  low: {
    label: "Low",
    className: "bg-slate-500/10 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300",
  },
};

function AppTaskCard({
  task,
  isOverlay = false,
  onDelete,
}: {
  task: AppTask;
  columnId: string;
  isOverlay?: boolean;
  onDelete?: (id: string) => void;
}) {
  const priority = task.priority.toLowerCase();
  const config = priorityConfig[priority] ?? priorityConfig.medium;

  return (
    <article
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-card p-4 text-card-foreground shadow-xs",
        isOverlay && "w-68 rotate-1 shadow-lg",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0·flex-1·space-y-1.5">
          <h3 className="min-w-0 truncate font-medium text-sm leading-none">{task.title}</h3>
          {task.description ? (
            <p className="line-clamp-2 text-muted-foreground text-sm leading-5">{task.description}</p>
          ) : null}
        </div>
        {!isOverlay && onDelete ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                className="-mr-1 shrink-0 text-muted-foreground"
                aria-label="Task actions"
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(task.id)}>
                <Trash2 className="size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-2">
        <Badge variant="secondary" className={cn("rounded-md border-transparent px-2 font-medium", config.className)}>
          {config.label}
        </Badge>
        {task.dueDate ? (
          <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <CalendarDays className="size-3" />
            {task.dueDate}
          </span>
        ) : null}
      </div>
    </article>
  );
}

function SortableAppTaskCard({
  task,
  columnId,
  index,
  onDelete,
}: {
  task: AppTask;
  columnId: string;
  index: number;
  onDelete: (id: string) => void;
}) {
  const { isDragging, ref } = useSortable({
    id: task.id,
    index,
    type: "task",
    accept: "task",
    group: columnId,
    data: { type: "task", task, columnId },
  });

  return (
    <div ref={ref} className={cn("touch-none", isDragging && "opacity-30")}>
      <AppTaskCard task={task} columnId={columnId} onDelete={onDelete} />
    </div>
  );
}

function AppKanbanColumn({
  column,
  index,
  tasks,
  onAddTask,
  onDelete,
}: {
  column: { id: string; title: string };
  index: number;
  tasks: AppTask[];
  onAddTask: (columnId: string) => void;
  onDelete: (id: string) => void;
}) {
  const columnSortable = useSortable({
    id: `column:${column.id}`,
    index,
    type: "column",
    accept: "column",
    group: "columns",
    data: { type: "column", columnId: column.id },
  });
  const taskDropTarget = useDroppable({
    id: column.id,
    type: "task-container",
    accept: "task",
    collisionPriority: CollisionPriority.Low,
    data: { type: "task-container", columnId: column.id },
  });

  return (
    <section
      ref={columnSortable.ref}
      className={cn(
        "flex min-h-0 flex-col rounded-t-xl border bg-muted/50 transition-colors",
        (columnSortable.isDropTarget || taskDropTarget.isDropTarget) && "bg-muted/70",
        columnSortable.isDragging && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-0.5">
            <Button
              ref={columnSortable.handleRef}
              variant="ghost"
              size="icon-xs"
              className="-ml-2 cursor-grab text-foreground/70 active:cursor-grabbing"
              aria-label={`Drag ${column.title} column`}
            >
              <GripVertical />
            </Button>
            <h2 className="truncate font-medium text-base leading-none">{column.title}</h2>
          </div>
          <p className="text-muted-foreground text-sm tabular-nums leading-none">
            {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
          </p>
        </div>
        <div className="-mr-2 flex items-center gap-0.5 text-muted-foreground">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Add task to ${column.title}`}
            onClick={() => onAddTask(column.id)}
          >
            <Plus />
          </Button>
        </div>
      </div>

      <div
        ref={taskDropTarget.ref}
        className="scrollbar-thin flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 pb-3 [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1"
      >
        {tasks.map((task, taskIndex) => (
          <SortableAppTaskCard key={task.id} task={task} columnId={column.id} index={taskIndex} onDelete={onDelete} />
        ))}
      </div>
    </section>
  );
}

interface AddTaskForm {
  title: string;
  description: string;
  priority: string;
  dueDate: string;
}

interface KanbanClientProps {
  initialBoard: KanbanBoardData;
}

export function KanbanClient({ initialBoard }: KanbanClientProps) {
  const router = useRouter();
  const [board, setBoard] = React.useState<BoardState>(initialBoard.tasks);
  const [columnOrder, setColumnOrder] = React.useState<string[]>(initialBoard.columns.map((c) => c.id));
  const [isPending, startTransition] = React.useTransition();
  const boardBeforeDrag = React.useRef<BoardState>(initialBoard.tasks);

  const [addDialogOpen, setAddDialogOpen] = React.useState(false);
  const [addDialogColumn, setAddDialogColumn] = React.useState<string>("");
  const [form, setForm] = React.useState<AddTaskForm>({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
  });

  const orderedColumns = columnOrder.flatMap((id) => initialBoard.columns.find((c) => c.id === id) ?? []);

  function handleDragStart(event: DragStartEvent) {
    if (event.operation.source?.type === "task") {
      boardBeforeDrag.current = board;
    }
  }

  function handleDragOver(event: DragOverEvent) {
    if (event.operation.source?.type === "task") {
      setBoard((currentBoard) => move(currentBoard, event));
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { source } = event.operation;
    if (!source) return;

    if (event.canceled) {
      if (source.type === "task") {
        setBoard(boardBeforeDrag.current);
      }
      return;
    }

    if (source.type === "column") {
      setColumnOrder((currentOrder) => move(currentOrder, event));
      return;
    }

    if (source.type === "task" && isTaskDragData(source.data)) {
      const taskId = source.data.task.id;
      const originalColumn = source.data.columnId;
      const newColumn = Object.entries(board).find(([, tasks]) => tasks.some((t) => t.id === taskId))?.[0];

      if (newColumn && newColumn !== originalColumn) {
        startTransition(async () => {
          try {
            await moveKanbanTask(taskId, newColumn);
            router.refresh();
          } catch {
            toast.error("Failed to move task");
            setBoard(boardBeforeDrag.current);
          }
        });
      }
    }
  }

  function openAddDialog(columnId: string) {
    setAddDialogColumn(columnId);
    setForm({ title: "", description: "", priority: "medium", dueDate: "" });
    setAddDialogOpen(true);
  }

  function handleCreate() {
    if (!form.title.trim()) return;

    startTransition(async () => {
      try {
        const newTask = await createKanbanTask({
          title: form.title.trim(),
          description: form.description.trim(),
          priority: form.priority,
          kanbanColumn: addDialogColumn,
          dueDate: form.dueDate || undefined,
        });
        setBoard((prev) => ({
          ...prev,
          [addDialogColumn]: [...(prev[addDialogColumn] ?? []), newTask],
        }));
        setAddDialogOpen(false);
        toast.success("Task created");
        router.refresh();
      } catch {
        toast.error("Failed to create task");
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteTask(id);
        setBoard((prev) => {
          const next = { ...prev };
          for (const key of Object.keys(next)) {
            next[key] = next[key].filter((t) => t.id !== id);
          }
          return next;
        });
        toast.success("Task deleted");
        router.refresh();
      } catch {
        toast.error("Failed to delete task");
      }
    });
  }

  return (
    <>
      <div className="flex h-[calc(100dvh-var(--dashboard-header-height))] min-h-0 min-w-0 flex-col overflow-hidden">
        <DragDropProvider onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          <div className="scrollbar-thin min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-hidden bg-muted/25 px-4 pt-4 pb-0 [scrollbar-color:var(--border)_transparent] lg:px-5 lg:pt-5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:h-1">
            <div className="inline-grid h-full min-w-full grid-cols-[repeat(5,minmax(20rem,1fr))] gap-4">
              {orderedColumns.map((column, index) => (
                <AppKanbanColumn
                  key={column.id}
                  column={column}
                  index={index}
                  tasks={board[column.id] ?? []}
                  onAddTask={openAddDialog}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
          <DragOverlay dropAnimation={null}>
            {(source) => {
              if (source.type !== "task" || !isTaskDragData(source.data)) return null;
              const columnId =
                isSortable(source) && typeof source.group === "string" ? source.group : source.data.columnId;
              return <AppTaskCard task={source.data.task} columnId={columnId} isOverlay />;
            }}
          </DragOverlay>
        </DragDropProvider>
      </div>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Task</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="task-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Task title"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Optional description"
                rows={3}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-priority">Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}>
                <SelectTrigger id="task-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-due">Due Date</Label>
              <Input
                id="task-due"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!form.title.trim() || isPending}>
              {isPending ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
