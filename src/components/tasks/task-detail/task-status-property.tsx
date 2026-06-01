import {
  TASK_STATUS_LABELS,
  TASK_STATUS_OPTIONS,
} from "@/components/tasks/task-meta";
import { TaskStatusIcon } from "@/components/tasks/task-status";
import { useTaskUpdate } from "@/hooks/use-task-update";
import type { TaskStatus } from "@/lib/ipc";
import { useTaskDetail } from "./task-detail-context";
import { type PropertyOption, PropertySelect } from "./task-property";

const OPTIONS: PropertyOption<TaskStatus>[] = TASK_STATUS_OPTIONS.map((status) => ({
  value: status,
  label: TASK_STATUS_LABELS[status],
  icon: <TaskStatusIcon status={status} />,
}));

export function StatusProperty() {
  const {
    state: { task },
  } = useTaskDetail();
  const { updateStatus } = useTaskUpdate();

  return (
    <PropertySelect
      value={task.status}
      options={OPTIONS}
      persist={(status) => updateStatus(task.id, status)}
    />
  );
}
