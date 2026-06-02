import { createContext, type ReactNode, use, useState } from "react";
import { useNavigate, useRouteLoaderData } from "react-router";
import { DeleteTaskDialog } from "@/components/tasks/delete-task-dialog";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import type { Project, Task } from "@/lib/ipc";

interface TaskDetailState {
  task: Task;
  /** The project the task belongs to, if it still exists. */
  project?: Project;
}

interface TaskDetailActions {
  openEdit: () => void;
  openDelete: () => void;
}

interface TaskDetailContextValue {
  state: TaskDetailState;
  actions: TaskDetailActions;
}

const TaskDetailContext = createContext<TaskDetailContextValue | null>(null);

/** Read the task, its project, and the edit/delete actions for the detail view. */
export function useTaskDetail(): TaskDetailContextValue {
  const ctx = use(TaskDetailContext);
  if (!ctx) {
    throw new Error("useTaskDetail must be used within a <TaskDetailProvider>");
  }
  return ctx;
}

/**
 * Owns the single-task detail state: resolves the task's project, holds the
 * edit/delete dialog state, and renders those dialogs. Every detail subcomponent
 * reads what it needs from context instead of receiving props.
 */
export function TaskDetailProvider({ task, children }: { task: Task; children: ReactNode }) {
  const projects = useRouteLoaderData<Project[] | undefined>("root") ?? [];
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const project = projects.find((p) => p.id === task.projectId);

  const value: TaskDetailContextValue = {
    state: { task, project },
    actions: {
      openEdit: () => setEditOpen(true),
      openDelete: () => setDeleteOpen(true),
    },
  };

  return (
    <TaskDetailContext value={value}>
      {children}
      <TaskFormDialog mode="edit" task={task} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteTaskDialog
        task={task}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => navigate("/tasks")}
      />
    </TaskDetailContext>
  );
}
