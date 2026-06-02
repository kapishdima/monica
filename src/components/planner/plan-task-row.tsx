import type { ReactNode } from "react";
import { Link } from "react-router";
import { TaskPriorityBadge } from "@/components/tasks/task-meta";
import { TaskStatusIcon } from "@/components/tasks/task-status";
import { Badge } from "@/components/ui/badge";
import type { Task } from "@/lib/ipc";

/**
 * A compact, read-only task row for the planner lists: status glyph, title
 * (links to the task), project badge, and a trailing `action` slot (add/remove
 * from a day). Distinct from `TaskCard`, which owns inline status editing and
 * bulk selection for the main task views.
 */
export function PlanTaskRow({
  task,
  projectName,
  action,
}: {
  task: Task;
  projectName?: string;
  action: ReactNode;
}) {
  return (
    <div className="group flex items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/40">
      <TaskStatusIcon status={task.status} />
      <Link to={`/tasks/${task.id}`} className="min-w-0 flex-1 truncate text-sm hover:underline">
        {task.title}
      </Link>
      {task.priority !== "low" && <TaskPriorityBadge priority={task.priority} />}
      {projectName && (
        <Badge variant="secondary" className="shrink-0">
          {projectName}
        </Badge>
      )}
      <div className="shrink-0">{action}</div>
    </div>
  );
}
