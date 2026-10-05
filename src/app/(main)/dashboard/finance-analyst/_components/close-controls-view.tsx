"use client";

import { useTransition } from "react";

import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CLOSE_STATUS_LABEL, fmtCurrency } from "@/lib/finance/format";
import type { CloseTask, Reconciliation } from "@/lib/finance/types";
import { updateCloseTaskStatus } from "@/server/finance-actions";

const STATUS_TONE: Record<string, string> = {
  complete: "bg-green-500/10 text-green-700 dark:text-green-300",
  in_progress: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  blocked: "bg-destructive/10 text-destructive",
  not_started: "bg-muted text-muted-foreground",
};

function recStatusKey(status: string): "complete" | "blocked" | "not_started" {
  if (status === "reconciled") return "complete";
  if (status === "review") return "blocked";
  return "not_started";
}

const REC_TYPE_LABEL: Record<string, string> = {
  gl_to_subledger: "GL to subledger",
  bank: "Bank",
  intercompany: "Intercompany",
  roll_forward: "Roll-forward",
};

function CloseTaskRow({ task }: { task: CloseTask }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onChange(status: string) {
    startTransition(async () => {
      await updateCloseTaskStatus(task.id, status as CloseTask["status"]);
      router.refresh();
    });
  }

  return (
    <TableRow className={isPending ? "opacity-60" : ""}>
      <TableCell>T+{task.dayOffset}</TableCell>
      <TableCell className="font-medium">{task.title}</TableCell>
      <TableCell className="text-muted-foreground">{task.owner ?? "—"}</TableCell>
      <TableCell className="text-muted-foreground">{task.dueDate ?? "—"}</TableCell>
      <TableCell>
        <Select value={task.status} onValueChange={onChange}>
          <SelectTrigger size="sm" className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(CLOSE_STATUS_LABEL).map(([v, label]) => (
              <SelectItem key={v} value={v}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
    </TableRow>
  );
}

export function CloseControlsView({
  tasks,
  reconciliations,
}: {
  tasks: CloseTask[];
  reconciliations: Reconciliation[];
}) {
  const complete = tasks.filter((t) => t.status === "complete").length;
  const progress = tasks.length ? Math.round((complete / tasks.length) * 100) : 0;
  const blocked = tasks.filter((t) => t.status === "blocked");

  const levels = Array.from(new Set(tasks.map((t) => t.closeLevel))).sort((a, b) => a - b);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="font-normal">Month-end close progress</CardTitle>
          <Badge variant="outline">
            {complete}/{tasks.length} tasks · {progress}%
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progress} />
          {blocked.length > 0 ? (
            <p className="text-destructive text-sm">
              FLAG: {blocked.length} blocked task{blocked.length > 1 ? "s" : ""} —{" "}
              {blocked.map((t) => t.title).join(", ")}
            </p>
          ) : null}
          {levels.map((lvl) => (
            <div key={lvl}>
              <p className="mb-1 font-medium text-muted-foreground text-xs">Level {lvl}</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Day</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead className="w-[160px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks
                    .filter((t) => t.closeLevel === lvl)
                    .map((t) => (
                      <CloseTaskRow key={t.id} task={t} />
                    ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-normal">Reconciliations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">GL balance</TableHead>
                <TableHead className="text-right">Subledger</TableHead>
                <TableHead className="text-right">Difference</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reconciliations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No reconciliations for this period.
                  </TableCell>
                </TableRow>
              ) : (
                reconciliations.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.accountName ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{REC_TYPE_LABEL[r.recType] ?? r.recType}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmtCurrency(r.glBalance, { cents: true })}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmtCurrency(r.subledgerBalance, { cents: true })}
                    </TableCell>
                    <TableCell
                      className={`text-right tabular-nums ${Math.abs(r.difference) < 1 ? "" : "text-destructive"}`}
                    >
                      {fmtCurrency(r.difference, { cents: true })}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_TONE[recStatusKey(r.status)]}>{r.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
