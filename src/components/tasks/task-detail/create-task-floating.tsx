import { Task01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { SelectionPopover, useSession } from "@/components/session";
import { useTaskDialogs } from "@/components/tasks/task-dialogs-provider";
import { Button } from "@/components/ui/button";
import { useTaskDetail } from "./task-detail-context";

/**
 * Floating "Create task" button shown over a transcript text selection. Composes
 * the generic `SelectionPopover` with the task-specific action: open the create
 * dialog pre-filled with the task's project and the selected text as description.
 */
export function CreateTaskFloating() {
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
      )}
    </SelectionPopover>
  );
}
