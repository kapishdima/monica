import { createContext, type ReactNode, useContext, useMemo, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { TaskFormDialog } from "./task-form-dialog";

interface TaskDialogsContextValue {
  openCreate: () => void;
}

const TaskDialogsContext = createContext<TaskDialogsContextValue | null>(null);

/**
 * Holds the global "create task" dialog so the page button, empty state and the
 * `Cmd/Ctrl+Shift+T` hotkey all open the same dialog.
 */
export function TaskDialogsProvider({ children }: { children: ReactNode }) {
  const [createOpen, setCreateOpen] = useState(false);

  useHotkeys(
    "mod+shift+t",
    (event) => {
      event.preventDefault();
      setCreateOpen(true);
    },
    { enableOnFormTags: true },
  );

  const value = useMemo(() => ({ openCreate: () => setCreateOpen(true) }), []);

  return (
    <TaskDialogsContext.Provider value={value}>
      {children}
      <TaskFormDialog mode="create" open={createOpen} onOpenChange={setCreateOpen} />
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
