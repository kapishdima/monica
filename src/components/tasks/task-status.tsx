import {
  Progress01Icon,
  Progress02Icon,
  Progress03Icon,
  Progress04Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
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
import type { TaskStatus as ITaskStatus } from "@/lib/ipc";
import { cn } from "@/lib/utils";

const icons: Record<ITaskStatus, IconSvgElement> = {
  backlog: Progress01Icon,
  todo: Progress02Icon,
  in_progress: Progress03Icon,
  in_review: Progress04Icon,
  done: Progress01Icon,
};

const colors: Record<ITaskStatus, string> = {
  backlog: "text-muted-foreground",
  todo: "text-muted-foreground",
  in_progress: "text-blue-500",
  in_review: "text-orange-500",
  done: "text-emerald-500",
};

const labels: Record<ITaskStatus, string> = {
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "In progress",
  in_review: "In review",
  done: "Done",
};
const statuses: ITaskStatus[] = ["backlog", "done", "in_progress", "in_review", "todo"];

/** Read-only, colored status glyph — reused in group headers and lists. */
export const TaskStatusIcon: React.FC<{ status: ITaskStatus; className?: string }> = ({
  status,
  className,
}) => (
  <HugeiconsIcon
    icon={icons[status]}
    strokeWidth={1.5}
    className={cn("size-4 shrink-0", colors[status], className)}
  />
);

export const TaskStatus: React.FC<{
  taskId: string;
  status: ITaskStatus;
  className?: string;
}> = ({ taskId, status }) => {
  const { updateStatus } = useTaskUpdate();
  const [s, setS] = useState(status);

  const onChange = async (next: ITaskStatus) => {
    setS(next);
    await updateStatus(taskId, next);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-xs" className={colors[s]}>
            <HugeiconsIcon icon={icons[s]} strokeWidth={1.5} />
          </Button>
        }
      />
      <DropdownMenuContent className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuRadioGroup value={s} onValueChange={onChange}>
            {statuses.map((s) => (
              <DropdownMenuRadioItem value={s} key={s} className={colors[s]}>
                <HugeiconsIcon icon={icons[s]} color="currentColor" strokeWidth={1.5} />
                {labels[s]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
