import { Badge } from "@/components/ui/badge";
import type { Task, TaskStatus } from "@/lib/ipc";

const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "Todo",
  in_progress: "In progress",
  in_review: "In review",
  done: "Done",
};

function TaskRow({ task }: { task: Task }) {
  return (
    <li className="flex items-center gap-3 py-3">
      <span className="text-xs text-muted-foreground tabular-nums">{task.taskId}</span>
      <span className="flex-1 text-sm">{task.title}</span>
      {task.label && <Badge variant="outline">{task.label}</Badge>}
      <Badge variant="secondary">{TASK_STATUS_LABELS[task.status]}</Badge>
    </li>
  );
}

export function ProjectTasks({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No tasks yet</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-border">
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} />
      ))}
    </ul>
  );
}
