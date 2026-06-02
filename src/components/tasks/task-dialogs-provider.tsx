import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { TaskFormDialog } from "./task-form-dialog";

/** Optional values to pre-fill the create dialog with (e.g. from a transcript selection). */
export interface TaskCreateInitial {
  projectId?: string;
  description?: string;
}

interface TaskDialogsContextValue {
  openCreate: (initial?: TaskCreateInitial) => void;
}

const TaskDialogsContext = createContext<TaskDialogsContextValue | null>(null);

/**
 * Holds the global "create task" dialog so the page button, empty state and the
 * `Cmd/Ctrl+Shift+T` hotkey all open the same dialog.
 */
export function TaskDialogsProvider({ children }: { children: ReactNode }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [initial, setInitial] = useState<TaskCreateInitial | undefined>();

  const openCreate = useCallback((init?: TaskCreateInitial) => {
    setInitial(init);
    setCreateOpen(true);
  }, []);

  useHotkeys(
    "mod+shift+t",
    (event) => {
      event.preventDefault();
      openCreate();
    },
    { enableOnFormTags: true },
  );

  const value = useMemo(() => ({ openCreate }), [openCreate]);

  return (
    <TaskDialogsContext.Provider value={value}>
      {children}
      <TaskFormDialog
        mode="create"
        initial={initial}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </TaskDialogsContext.Provider>
  );
}

export function useTaskDialogs() {
  const ctx = useContext(TaskDialogsContext);
  if (!ctx) {
    throw new Error("useTaskDialogs must be used within a TaskDialogsProvider");
  }
  return ctx;
}
