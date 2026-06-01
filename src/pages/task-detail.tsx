import { Delete02Icon, Edit02Icon, GitBranchIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Link, useLoaderData, useNavigate, useRouteLoaderData } from "react-router";
import { DeleteTaskDialog } from "@/components/tasks/delete-task-dialog";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import {
  TASK_LABEL_LABELS,
  TaskPriorityBadge,
  TaskStatusBadge,
} from "@/components/tasks/task-meta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Item, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import type { Project, Task } from "@/lib/ipc";

export const TaskDetail: React.FC = () => {
  const task = useLoaderData() as Task;
  const projects = (useRouteLoaderData("root") as Project[] | undefined) ?? [];
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const project = projects.find((p) => p.id === task.projectId);

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground tabular-nums">{task.taskId}</span>
            <h1 className="font-heading text-2xl font-semibold">{task.title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <TaskStatusBadge status={task.status} />
            <TaskPriorityBadge priority={task.priority} />
            {task.label && <Badge variant="outline">{TASK_LABEL_LABELS[task.label]}</Badge>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
            Delete
          </Button>
        </div>
      </div>

      {task.description && (
        <p className="mb-6 max-w-2xl text-sm text-muted-foreground whitespace-pre-wrap">
          {task.description}
        </p>
      )}

      <div className="flex flex-col divide-y divide-border">
        <Item variant="line" className="items-start py-4">
          <ItemContent>
            <ItemTitle>Project</ItemTitle>
            <ItemDescription>
              {project ? (
                <Link to={`/projects/${project.id}`} className="hover:underline">
                  {project.name}
                </Link>
              ) : (
                task.projectId
              )}
            </ItemDescription>
          </ItemContent>
        </Item>

        {task.githubBranch && (
          <Item variant="line" className="items-start py-4">
            <ItemContent>
              <ItemTitle className="flex items-center gap-2">
                <HugeiconsIcon icon={GitBranchIcon} strokeWidth={2} className="size-4" />
                Branch
              </ItemTitle>
              <ItemDescription className="font-mono">{task.githubBranch}</ItemDescription>
            </ItemContent>
          </Item>
        )}
      </div>

      <TaskFormDialog mode="edit" task={task} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteTaskDialog
        task={task}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => navigate("/tasks")}
      />
    </div>
  );
};
