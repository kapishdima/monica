import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTaskUpdate } from "@/hooks/use-task-update";
import type { TaskPriority as ITaskPriority } from "@/lib/ipc";
import { cn } from "@/lib/utils";
import { TASK_PRIORITY_LABELS, TASK_PRIORITY_OPTIONS } from "./task-meta";

const PRIORITY_LEVEL: Record<ITaskPriority, number> = {
  low: 1,
  high: 2,
  urgent: 3,
};

const PRIORITY_BAR_HEIGHTS = ["h-1", "h-1.5", "h-2.5"] as const;

export const TaskPriority: React.FC<{
  taskId: string;
  priority: ITaskPriority;
  className?: string;
}> = ({ taskId, priority }) => {
  const { updatePriority } = useTaskUpdate();
  const [p, setP] = useState(priority);

  const onChange = async (next: ITaskPriority) => {
    setP(next);
    await updatePriority(taskId, next);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-xs">
            <TaskPriorityBars priority={p} />
          </Button>
        }
      />
      <DropdownMenuContent className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuRadioGroup value={p} onValueChange={onChange}>
            {TASK_PRIORITY_OPTIONS.map((option) => (
              <DropdownMenuRadioItem value={option} key={option}>
                <TaskPriorityBars priority={option} />
                {TASK_PRIORITY_LABELS[option]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export function TaskPriorityBars({
  priority,
  className,
}: {
  priority: ITaskPriority;
  className?: string;
}) {
  const level = PRIORITY_LEVEL[priority];
  const filled = priority === "urgent" ? "bg-orange-300" : "bg-gray-400";
  return (
    <span
      className={cn("flex items-end gap-0.5", className)}
      role="img"
      aria-label={`Priority: ${TASK_PRIORITY_LABELS[priority]}`}
    >
      {PRIORITY_BAR_HEIGHTS.map((height, i) => (
        <span
          key={i}
          className={cn("w-1 rounded-[1px]", height, i < level ? filled : "bg-gray-200")}
        />
      ))}
    </span>
  );
}
