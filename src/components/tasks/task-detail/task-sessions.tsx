import { Task01Icon, TaskEdit01Icon } from "@hugeicons/core-free-icons";
import { type SelectionAction, SessionProvider, Sessions } from "@/components/session";
import { useTaskDialogs } from "@/components/tasks/task-dialogs-provider";
import { useTaskUpdate } from "@/hooks/use-task-update";
import { useTaskDetail } from "./task-detail-context";
import { SelectionTaskFloating } from "./create-task-floating";

/**
 * Wires the generic session components to the current task: it feeds the task's
 * branch into the `SessionProvider` and turns a transcript selection into either
 * a new task (pre-filled with the task's project + the selected text) or an
 * append to the current task's description — via the right-click menu
 * (`selectionActions`) and the floating `SelectionTaskFloating` buttons.
 */
export function TaskSessions() {
  const {
    state: { task },
  } = useTaskDetail();
  const { openCreate } = useTaskDialogs();
  const { updateDescription } = useTaskUpdate();

  const createTask = (text: string) =>
    openCreate({ projectId: task.projectId, description: text });

  const appendToTask = (text: string) => {
    const description = [task.description?.trim(), text.trim()].filter(Boolean).join("\n\n");
    return updateDescription(task.id, description);
  };

  const selectionActions: SelectionAction[] = [
    { key: "create-task", label: "Create task", icon: Task01Icon, onSelect: createTask },
    { key: "append-task", label: "Append to task", icon: TaskEdit01Icon, onSelect: appendToTask },
  ];

  return (
    <SessionProvider branch={task.githubBranch}>
      <Sessions selectionActions={selectionActions} noBranchLabel="This task has no branch yet." />
      <SelectionTaskFloating onAppend={appendToTask} />
    </SessionProvider>
  );
}
