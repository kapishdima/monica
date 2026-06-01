import { type ReactNode, useMemo, useState } from "react";
import { TaskCard } from "@/components/tasks/task-card";
import { TASK_STATUS_LABELS, TASK_STATUS_OPTIONS } from "@/components/tasks/task-meta";
import { TaskStatusIcon } from "@/components/tasks/task-status";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Task, TaskStatus } from "@/lib/ipc";

interface TaskListProps {
  tasks: Task[];
  /** Maps task `projectId` → project name for the per-row project badge. Omit to hide it. */
  projectNames?: Map<string, string>;
  /** Rendered in place of the list when there are no tasks. */
  emptyState?: ReactNode;
}

/**
 * The status-grouped task list shared by the Tasks page and the project detail
 * view: buckets tasks into collapsible status sections and owns the bulk-select
 * state and its clear-selection bar.
 */
export function TaskList({ tasks, projectNames, emptyState }: TaskListProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
      emptyState ?? <p className="py-8 text-center text-sm text-muted-foreground">No tasks yet</p>
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
                    projectName={projectNames?.get(task.projectId)}
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
}
