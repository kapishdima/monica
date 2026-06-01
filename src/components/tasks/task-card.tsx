import {
  Delete02Icon,
  Edit02Icon,
  Folder01Icon,
  MoreHorizontalCircle01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Link } from "react-router";
import { CopyBranchButton } from "@/components/tasks/copy-branch-button";
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
import { DeleteTaskDialog } from "./delete-task-dialog";
import { TaskFormDialog } from "./task-form-dialog";

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

        <div className="flex items-center">
          <TaskStatus taskId={task.id} status={task.status} />
          <TaskPriority taskId={task.id} priority={task.priority} />
        </div>

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
