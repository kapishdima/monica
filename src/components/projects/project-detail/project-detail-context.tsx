import { createContext, type ReactNode, use, useState } from "react";
import { useNavigate } from "react-router";
import { ConnectGithubDialog } from "@/components/projects/connect-github-dialog";
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import type { Project, Task } from "@/lib/ipc";

interface ProjectDetailState {
  project: Project;
  tasks: Task[];
}

interface ProjectDetailActions {
  openEdit: () => void;
  openDelete: () => void;
  openConnect: () => void;
}

interface ProjectDetailContextValue {
  state: ProjectDetailState;
  actions: ProjectDetailActions;
}

const ProjectDetailContext = createContext<ProjectDetailContextValue | null>(null);

/** Read the project, its tasks, and the edit/delete/connect actions for the detail view. */
export function useProjectDetail(): ProjectDetailContextValue {
  const ctx = use(ProjectDetailContext);
  if (!ctx) {
    throw new Error("useProjectDetail must be used within a <ProjectDetailProvider>");
  }
  return ctx;
}

/**
 * Owns the single-project detail state: holds the edit/delete/connect dialog
 * state and renders those dialogs. Every detail subcomponent reads what it
 * needs from context instead of receiving props.
 */
export function ProjectDetailProvider({
  project,
  tasks,
  children,
}: {
  project: Project;
  tasks: Task[];
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);

  const value: ProjectDetailContextValue = {
    state: { project, tasks },
    actions: {
      openEdit: () => setEditOpen(true),
      openDelete: () => setDeleteOpen(true),
      openConnect: () => setConnectOpen(true),
    },
  };

  return (
    <ProjectDetailContext value={value}>
      {children}
      <ProjectFormDialog mode="edit" project={project} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteProjectDialog
        project={project}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => navigate("/projects")}
      />
      <ConnectGithubDialog project={project} open={connectOpen} onOpenChange={setConnectOpen} />
    </ProjectDetailContext>
  );
}
