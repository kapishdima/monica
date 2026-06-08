import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useLocation } from "react-router";
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

/** Pull the project id out of a `/projects/:projectId` detail path, else undefined. */
function projectIdFromPath(pathname: string): string | undefined {
  return /^\/projects\/([^/]+)/.exec(pathname)?.[1];
}

/**
 * Holds the global "create task" dialog so the page button, empty state and the
 * global `C` hotkey all open the same dialog. When opened without an explicit
 * project — and we're on a project's detail page — that project is pre-selected.
 */
export function TaskDialogsProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [createOpen, setCreateOpen] = useState(false);
  const [initial, setInitial] = useState<TaskCreateInitial | undefined>();

  const openCreate = useCallback(
    (init?: TaskCreateInitial) => {
      // When the caller doesn't name a project, default to the one whose detail
      // page we're on, so "create task" from a project pre-selects that project.
      const projectId = init?.projectId ?? projectIdFromPath(location.pathname);
      setInitial(projectId ? { ...init, projectId } : init);
      setCreateOpen(true);
    },
    [location.pathname],
  );

  // Linear-style single-key shortcut: `C` opens the create-task composer.
  // Left disabled on form fields / contenteditable (react-hotkeys-hook default)
  // so typing "c" in an input never triggers it. The dep list re-binds the
  // listener when `createOpen` flips, so the guard below reads the live value
  // instead of a stale closure.
  useHotkeys(
    "c",
    (event) => {
      // Ignore while the composer is already open so we never wipe in-progress input.
      if (createOpen) return;
      event.preventDefault();
      openCreate();
    },
    [createOpen, openCreate],
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
