import {
  Copy01Icon,
  Delete02Icon,
  Edit02Icon,
  Folder01Icon,
  GitBranchIcon,
  MoreHorizontalCircle01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { TaskPriority } from "@/components/tasks/task-priority";
import { TaskStatus } from "@/components/tasks/task-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Task } from "@/lib/ipc";
import { cn } from "@/lib/utils";
import { DeleteTaskDialog } from "./delete-task-dialog";
import { TaskFormDialog } from "./task-form-dialog";

/** Icon-only button that copies the auto-generated git branch name. */
function CopyBranchButton({ branch }: { branch: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(branch);
      setCopied(true);
      toast.success("Branch name copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy branch name");
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={onCopy}
      title={`Copy branch name: ${branch}`}
      aria-label={`Copy branch name ${branch}`}
    >
      <HugeiconsIcon
        icon={copied ? Tick02Icon : GitBranchIcon}
        strokeWidth={2}
        className={cn("size-4 shrink-0", copied && "text-emerald-500")}
      />
    </Button>
  );
}

/** The project a task belongs to, shown muted on the right. */
function ProjectLead({ name }: { name: string }) {
  return (
    <Badge variant="secondary">
      <HugeiconsIcon icon={Folder01Icon} strokeWidth={2} className="size-3.5 shrink-0" />
      {name}
    </Badge>
  );
}

function ActionsMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label="Task actions" />}
      >
        <HugeiconsIcon icon={MoreHorizontalCircle01Icon} strokeWidth={2} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={onEdit}>
          <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
          <span>Edit task</span>
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
          <span>Delete task</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export interface TaskCardProps {
  task: Task;
  projectName?: string;
  /** Whether this row is selected for bulk actions. */
  selected?: boolean;
  /** Toggle this row's selection. */
  onSelectedChange?: (selected: boolean) => void;
}

export function TaskCard({ task, projectName, selected = false, onSelectedChange }: TaskCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const taskHref = `/tasks/${task.id}`;

  return (
    <>
      <div
        data-selected={selected || undefined}
        className="group flex items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/40 data-selected:bg-primary/5"
      >
        <Checkbox
          checked={selected}
          onCheckedChange={(checked) => onSelectedChange?.(checked === true)}
          aria-label={selected ? "Deselect task" : "Select task"}
        />

        <TaskStatus taskId={task.id} status={task.status} />
        <TaskPriority priority={task.priority} className="shrink-0" />

        <Link to={taskHref} className="min-w-0 flex-1 truncate text-sm hover:underline">
          {task.title}
        </Link>

        {projectName && <ProjectLead name={projectName} />}

        <div className="flex shrink-0 items-center gap-0.5">
          {task.githubBranch && <CopyBranchButton branch={task.githubBranch} />}
          <ActionsMenu onEdit={() => setEditOpen(true)} onDelete={() => setDeleteOpen(true)} />
        </div>
      </div>

      <TaskFormDialog mode="edit" task={task} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteTaskDialog task={task} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </>
  );
}
