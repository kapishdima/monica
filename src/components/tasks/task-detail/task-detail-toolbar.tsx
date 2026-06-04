import {
  Delete02Icon,
  Edit02Icon,
  MoreHorizontalCircle01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { CopyBranchButton } from "@/components/tasks/copy-branch-button";
import { CopyClaudeCommandButton } from "@/components/tasks/copy-claude-command-button";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTaskDetail } from "./task-detail-context";

/** Action cluster: copy branch, edit, and a more-actions menu. */
export function TaskDetailToolbar() {
  const {
    state: { task },
    actions: { openEdit, openDelete },
  } = useTaskDetail();

  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-lg border p-0.5">
      {task.githubBranch && <CopyBranchButton branch={task.githubBranch} />}
      {task.githubBranch && <CopyClaudeCommandButton branch={task.githubBranch} />}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={openEdit}
        title="Edit task"
        aria-label="Edit task"
      >
        <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon-sm" aria-label="More actions" />}
        >
          <HugeiconsIcon icon={MoreHorizontalCircle01Icon} strokeWidth={2} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={openEdit}>
            <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
            <span>Edit task</span>
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={openDelete}>
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
            <span>Delete task</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
