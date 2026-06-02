import { Task01Icon, TaskEdit01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { SelectionPopover, useSession } from "@/components/session";
import { useTaskDialogs } from "@/components/tasks/task-dialogs-provider";
import { Button } from "@/components/ui/button";
import { useTaskDetail } from "./task-detail-context";

/**
 * Floating actions shown over a transcript text selection. Composes the generic
 * `SelectionPopover` with the task-specific actions: create a new task pre-filled
 * with the selected text, or append the selection to the current task's
 * description (via `onAppend`, owned by `TaskSessions` so the menu shares it).
 */
export function SelectionTaskFloating({ onAppend }: { onAppend: (text: string) => void }) {
  const {
    state: { containerRef },
  } = useSession();
  const {
    state: { task },
  } = useTaskDetail();
  const { openCreate } = useTaskDialogs();

  return (
    <SelectionPopover containerRef={containerRef}>
      {({ text, close }) => (
        <>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2 text-xs"
            onClick={() => {
              openCreate({ projectId: task.projectId, description: text });
              close();
            }}
          >
            <HugeiconsIcon icon={Task01Icon} className="size-3.5" strokeWidth={2} />
            Create task
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2 text-xs"
            onClick={() => {
              onAppend(text);
              close();
            }}
          >
            <HugeiconsIcon icon={TaskEdit01Icon} className="size-3.5" strokeWidth={2} />
            Append to task
          </Button>
        </>
      )}
    </SelectionPopover>
  );
}
