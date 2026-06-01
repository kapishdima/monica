import { useMemo, useState } from "react";
import { useLoaderData, useRouteLoaderData } from "react-router";
import { TaskCard } from "@/components/tasks/task-card";
import { TASK_STATUS_LABELS, TASK_STATUS_OPTIONS } from "@/components/tasks/task-meta";
import { TaskStatusIcon } from "@/components/tasks/task-status";
import { TasksEmpty } from "@/components/tasks/tasks-empty";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Project, Task, TaskStatus } from "@/lib/ipc";

export const Tasks: React.FC = () => {
  const tasks = (useLoaderData() as Task[] | undefined) ?? [];
  const projects = (useRouteLoaderData("root") as Project[] | undefined) ?? [];
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const projectNames = useMemo(
    () => new Map(projects.map((project) => [project.id, project.name])),
    [projects],
  );

  // Bucket tasks by status, keeping the canonical status order for the sections.
  const groups = useMemo(() => {
    const byStatus = new Map<TaskStatus, Task[]>(TASK_STATUS_OPTIONS.map((status) => [status, []]));
    for (const task of tasks) {
      byStatus.get(task.status)?.push(task);
    }
    return TASK_STATUS_OPTIONS.map((status) => ({
      status,
      items: byStatus.get(status) ?? [],
    })).filter((group) => group.items.length > 0);
  }, [tasks]);

  const toggleSelected = (id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  if (!tasks.length) {
    return (
      <div className="w-full h-[50vh] flex items-center justify-center">
        <TasksEmpty />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2">
          <span className="text-sm text-muted-foreground tabular-nums">
            {selectedIds.size} selected
          </span>
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
            Clear selection
          </Button>
        </div>
      )}

      <Accordion defaultValue={groups.map((group) => group.status)} multiple>
        {groups.map((group) => (
          <AccordionItem
            key={group.status}
            value={group.status}
            className="data-open:bg-transparent"
          >
            <AccordionTrigger className="items-center py-3 hover:no-underline">
              <span className="flex items-center gap-2">
                <TaskStatusIcon status={group.status} />
                {TASK_STATUS_LABELS[group.status]}
                <Badge variant="secondary" className="tabular-nums">
                  {group.items.length}
                </Badge>
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-0">
              <div className="-mx-4 divide-y divide-border border-t">
                {group.items.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    projectName={projectNames.get(task.projectId)}
                    selected={selectedIds.has(task.id)}
                    onSelectedChange={(selected) => toggleSelected(task.id, selected)}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};
