import { Badge } from "@/components/ui/badge";
import type { TaskLabel, TaskPriority, TaskStatus } from "@/lib/ipc";

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "Todo",
  in_progress: "In progress",
  in_review: "In review",
  done: "Done",
};

export const TASK_STATUS_OPTIONS: TaskStatus[] = [
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "done",
];

const STATUS_VARIANT: Record<TaskStatus, "default" | "secondary" | "outline"> = {
  backlog: "outline",
  todo: "secondary",
  in_progress: "default",
  in_review: "default",
  done: "secondary",
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{TASK_STATUS_LABELS[status]}</Badge>;
}

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  high: "High",
  urgent: "Urgent",
};

export const TASK_PRIORITY_OPTIONS: TaskPriority[] = ["low", "high", "urgent"];

const PRIORITY_VARIANT: Record<TaskPriority, "secondary" | "default" | "destructive"> = {
  low: "secondary",
  high: "default",
  urgent: "destructive",
};

export function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  return <Badge variant={PRIORITY_VARIANT[priority]}>{TASK_PRIORITY_LABELS[priority]}</Badge>;
}

export const TASK_LABEL_LABELS: Record<TaskLabel, string> = {
  feat: "Feature",
  fix: "Fix",
  refactor: "Refactor",
  chore: "Chore",
};

export const TASK_LABEL_OPTIONS: TaskLabel[] = ["feat", "fix", "refactor", "chore"];
