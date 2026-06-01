import {
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_OPTIONS,
} from "@/components/tasks/task-meta";
import { TaskPriorityBars } from "@/components/tasks/task-priority";
import { useTaskUpdate } from "@/hooks/use-task-update";
import type { TaskPriority } from "@/lib/ipc";
import { useTaskDetail } from "./task-detail-context";
import { type PropertyOption, PropertySelect } from "./task-property";

const OPTIONS: PropertyOption<TaskPriority>[] = TASK_PRIORITY_OPTIONS.map((priority) => ({
  value: priority,
  label: TASK_PRIORITY_LABELS[priority],
  icon: <TaskPriorityBars priority={priority} />,
}));

export function PriorityProperty() {
  const {
    state: { task },
  } = useTaskDetail();
  const { updatePriority } = useTaskUpdate();

  return (
    <PropertySelect
      value={task.priority}
      options={OPTIONS}
      persist={(priority) => updatePriority(task.id, priority)}
    />
  );
}
