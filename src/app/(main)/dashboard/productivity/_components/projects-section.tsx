import { format } from "date-fns";
import { Orbit, Plus } from "lucide-react";

import type { ProdProject } from "@/lib/dashboards/types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function formatDue(dueDate: string | null) {
  if (!dueDate) return "No due date";
  const parsed = new Date(dueDate);
  if (Number.isNaN(parsed.getTime())) return "No due date";
  return `Due ${format(parsed, "MMM d")}`;
}

export function ProjectsSection({ projects }: { projects: ProdProject[] }) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl tracking-tight">Projects</h2>
        <div className="flex items-center gap-2">
          <Select defaultValue="active">
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Active" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Plus data-icon="inline-start" />
            New
          </Button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="grid place-items-center rounded-xl border bg-background p-8 text-muted-foreground text-sm shadow-xs">
          No projects yet.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="shadow-xs">
              <CardHeader>
                <CardTitle>
                  <div className="flex items-center gap-2">
                    <Orbit className="size-4" style={{ color: project.color }} />
                    <span>{project.name}</span>
                  </div>
                </CardTitle>
                <CardAction>
                  <Badge variant="outline">{project.status}</Badge>
                </CardAction>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <Progress value={project.progress} className="h-2" />
                    <span className="shrink-0 text-sm">{project.progress}%</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="py-2.5">
                <span className="text-muted-foreground">{formatDue(project.dueDate)}</span>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
