import { Task01Icon } from "@hugeicons/core-free-icons";
import { type SelectionAction, SessionProvider, Sessions } from "@/components/session";
import { useTaskDialogs } from "@/components/tasks/task-dialogs-provider";
import { useTaskDetail } from "./task-detail-context";
import { CreateTaskFloating } from "./create-task-floating";

/**
 * Wires the generic session components to the current task: it feeds the task's
 * branch into the `SessionProvider` and turns a transcript selection into a new
 * task pre-filled with the task's project + the selected text — via the right-click
 * menu (`selectionActions`) and the floating `CreateTaskFloating` button.
 */
export function TaskSessions() {
  const {
    state: { task },
  } = useTaskDetail();
  const { openCreate } = useTaskDialogs();

  const createTask = (text: string) =>
    openCreate({ projectId: task.projectId, description: text });

  const selectionActions: SelectionAction[] = [
    { key: "create-task", label: "Create task", icon: Task01Icon, onSelect: createTask },
  ];

  return (
    <SessionProvider branch={task.githubBranch}>
      <Sessions selectionActions={selectionActions} noBranchLabel="This task has no branch yet." />
      <CreateTaskFloating />
    </SessionProvider>
  );
}
