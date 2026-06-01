import { useMemo, useState } from "react";
import { useLoaderData, useRouteLoaderData } from "react-router";
import { TaskCard } from "@/components/tasks/task-card";
import { TasksEmpty } from "@/components/tasks/tasks-empty";
import { Button } from "@/components/ui/button";
import type { Project, Task } from "@/lib/ipc";

export const Tasks: React.FC = () => {
  const tasks = (useLoaderData() as Task[] | undefined) ?? [];
  const projects = (useRouteLoaderData("root") as Project[] | undefined) ?? [];
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const projectNames = useMemo(
    () => new Map(projects.map((project) => [project.id, project.name])),
    [projects],
  );

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

      <div className="divide-y divide-border overflow-hidden rounded-lg border">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            projectName={projectNames.get(task.projectId)}
            selected={selectedIds.has(task.id)}
            onSelectedChange={(selected) => toggleSelected(task.id, selected)}
          />
        ))}
      </div>
    </div>
  );
};
