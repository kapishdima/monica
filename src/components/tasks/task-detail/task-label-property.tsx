import { Tag01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { TASK_LABEL_LABELS, TASK_LABEL_OPTIONS } from "@/components/tasks/task-meta";
import { useTaskUpdate } from "@/hooks/use-task-update";
import type { TaskLabel } from "@/lib/ipc";
import { useTaskDetail } from "./task-detail-context";
import { type PropertyOption, PropertySelect } from "./task-property";

const TagIcon = <HugeiconsIcon icon={Tag01Icon} strokeWidth={2} className="size-4 shrink-0" />;

// An empty value clears the label; it renders muted via PropertySelect's
// falsy-value styling.
const OPTIONS: PropertyOption<TaskLabel | "">[] = [
  { value: "", label: "No label", icon: TagIcon },
  ...TASK_LABEL_OPTIONS.map((label) => ({
    value: label,
    label: TASK_LABEL_LABELS[label],
    icon: TagIcon,
  })),
];

export function LabelProperty() {
  const {
    state: { task },
  } = useTaskDetail();
  const { updateLabel } = useTaskUpdate();

  return (
    <PropertySelect
      value={task.label ?? ""}
      options={OPTIONS}
      persist={(value) => updateLabel(task.id, value || null)}
    />
  );
}
