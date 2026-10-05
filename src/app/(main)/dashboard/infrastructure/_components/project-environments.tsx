import { cn } from "cn";
import {
  ArrowUpDown,
  Bell,
  ChevronDown,
  CircleDashed,
  Clock3,
  Copy,
  EllipsisVertical,
  FileText,
  GitBranch,
  Plus,
  RefreshCw,
  Settings,
  SquareTerminal,
  Terminal,
} from "lucide-react";

import type { InfraEnvironment, InfraProject } from "@/lib/dashboards/types";

import { getFrameworkIcon } from "./infrastructure-data";

import { SimpleIcon } from "@/components/simple-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function titleCase(value: string): string {
  return value.length > 0 ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function formatDeployedAt(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ProjectEnvironments({ project }: { project: InfraProject }) {
  return (
    <Collapsible
      defaultOpen
      className="flex flex-col overflow-hidden rounded-xl border bg-card py-3 text-card-foreground data-[state=open]:gap-3 data-[state=open]:pb-0"
    >
      <div className="flex flex-col gap-2 px-4 sm:flex-row sm:items-center">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="group -ml-2 h-auto w-full justify-start gap-2 px-2 py-1 hover:bg-transparent aria-expanded:bg-transparent sm:flex-1"
          >
            <ChevronDown className="group-data-[state=open]:rotate-180" />
            <div className="flex min-w-0 items-baseline gap-1.5 text-left">
              <span className="shrink-0 font-medium leading-none">{project.name}</span>
              {project.repo ? (
                <span className="min-w-0 truncate text-muted-foreground text-sm">({project.repo})</span>
              ) : null}
            </div>
          </Button>
        </CollapsibleTrigger>
        <div className="flex w-full items-center justify-between gap-2 sm:ml-auto sm:w-auto sm:justify-end">
          <Button variant="ghost" size="sm" className="-ml-1.5 sm:ml-0">
            <Plus data-icon="inline-start" />
            Add Environment
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon-sm">
                <EllipsisVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-40" align="end">
              <DropdownMenuGroup>
                {project.environments.length > 0 ? (
                  <DropdownMenuItem>
                    <FileText />
                    Activity Logs
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem>
                  <Terminal />
                  Open Console
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings />
                  Project Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <RefreshCw />
                  Sync Status
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bell />
                  Manage Alerts
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <Copy />
                  Copy Project ID
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CollapsibleContent>
        {project.environments.length > 0 ? (
          <EnvironmentTable rows={project.environments} framework={project.framework} />
        ) : (
          <EmptyProjectState />
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

function EnvironmentTable({ rows, framework }: { rows: InfraEnvironment[]; framework: string | null }) {
  const frameworkIcon = getFrameworkIcon(framework);

  return (
    <div className="scrollbar-thin overflow-x-auto [scrollbar-color:var(--border)_transparent] **:data-[slot=table-container]:overflow-visible [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:h-1">
      <Table className="min-w-[1700px] table-fixed **:data-[slot='table-cell']:px-5 **:data-[slot='table-head']:px-5">
        <colgroup>
          <col className="w-90" />
          <col className="w-40" />
          <col className="w-42" />
          <col className="w-35" />
          <col className="w-35" />
          <col className="w-38" />
          <col className="w-98" />
          <col className="w-55" />
          <col className="w-18" />
        </colgroup>
        <TableHeader className="bg-muted/50 [&_tr]:border-y">
          <TableRow>
            <TableHead className="font-medium">
              <span className="inline-flex items-center gap-1">
                Domain <ArrowUpDown className="size-4" />
              </span>
            </TableHead>
            <TableHead>Platform</TableHead>
            <TableHead>Environment</TableHead>
            <TableHead>Health</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>Uptime</TableHead>
            <TableHead>Commit</TableHead>
            <TableHead>Deployment</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody className="**:data-[slot='table-row']:hover:bg-transparent">
          {rows.map((row) => {
            const domain = row.url ? row.url.replace(/^https?:\/\//, "") : row.name;
            const isProduction = row.name.toLowerCase() === "production";
            const isReady = row.status.toLowerCase() === "ready";
            const isError = row.status.toLowerCase() === "error";
            const isBuilding = row.status.toLowerCase() === "building";

            return (
              <TableRow key={row.id}>
                <TableCell>
                  <span className="block truncate font-medium" title={domain}>
                    {domain}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="flex items-center gap-2 font-medium text-muted-foreground">
                    {frameworkIcon ? <SimpleIcon icon={frameworkIcon} className="size-4 fill-current" /> : null}
                    {framework ?? "—"}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "rounded-sm px-1.5 py-0.5",
                      isProduction
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-sky-500/10 text-sky-600 dark:text-sky-400",
                    )}
                  >
                    {titleCase(row.name)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={isError ? "destructive" : "secondary"}
                    className={cn(
                      "rounded-sm px-1.5 py-0.5",
                      isReady && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                      isBuilding && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        isReady && "bg-emerald-500",
                        isBuilding && "bg-amber-500",
                        isError && "bg-destructive",
                        !isReady && !isBuilding && !isError && "bg-muted-foreground",
                      )}
                    />
                    {titleCase(row.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <GitBranch className="size-4" />
                    <span className="truncate" title={row.branch ?? undefined}>
                      {row.branch ?? "—"}
                    </span>
                  </span>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground tabular-nums">
                    <Clock3 className="size-4" />
                    {row.uptimePct.toFixed(2)}%
                  </span>
                </TableCell>
                <TableCell>
                  <span className="flex min-w-0 flex-col font-medium">
                    <span className="truncate" title={row.commitMessage ?? undefined}>
                      {row.commitMessage ?? "—"}
                    </span>
                    {row.commitSha ? (
                      <span className="font-mono text-muted-foreground text-xs">{row.commitSha}</span>
                    ) : null}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="flex flex-col font-medium">
                    {row.region ?? "—"}
                    <span className="text-muted-foreground text-xs">
                      {formatDeployedAt(row.lastDeployAt)}
                      {row.deployedBy ? ` · ${row.deployedBy}` : ""}
                    </span>
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" className="-mr-2">
                        <SquareTerminal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-40" align="end">
                      <DropdownMenuGroup>
                        <DropdownMenuItem>
                          <FileText />
                          View Logs
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Terminal />
                          Open Console
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <RefreshCw />
                          Restart
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem>
                          <Copy />
                          Copy URL
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function EmptyProjectState() {
  return (
    <div className="flex min-h-24 items-center justify-center border-t bg-muted/50 p-4">
      <div className="flex items-center gap-2">
        <CircleDashed className="size-4" />
        <p className="font-medium text-sm">No environments in this project</p>
      </div>
    </div>
  );
}
