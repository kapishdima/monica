import { createContext, type ReactNode, useContext, useMemo, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { ProjectFormDialog } from "./project-form-dialog";

interface ProjectDialogsContextValue {
  openCreate: () => void;
}

const ProjectDialogsContext = createContext<ProjectDialogsContextValue | null>(null);

/**
 * Holds the global "create project" dialog so the sidebar button, header button
 * and the `Cmd/Ctrl+P` hotkey all open the same dialog.
 */
export function ProjectDialogsProvider({ children }: { children: ReactNode }) {
  const [createOpen, setCreateOpen] = useState(false);

  useHotkeys(
    "mod+p",
    (event) => {
      event.preventDefault();
      setCreateOpen(true);
    },
    { enableOnFormTags: true },
  );

  const value = useMemo(() => ({ openCreate: () => setCreateOpen(true) }), []);

  return (
    <ProjectDialogsContext.Provider value={value}>
      {children}
      <ProjectFormDialog mode="create" open={createOpen} onOpenChange={setCreateOpen} />
    </ProjectDialogsContext.Provider>
  );
}

export function useProjectDialogs() {
  const ctx = useContext(ProjectDialogsContext);
  if (!ctx) {
    throw new Error("useProjectDialogs must be used within a ProjectDialogsProvider");
  }
  return ctx;
}
