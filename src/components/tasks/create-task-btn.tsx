import { TaskAdd01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTaskDialogs } from "@/components/tasks/task-dialogs-provider";
import { Button } from "@/components/ui/button";

export const CreateTaskBtn: React.FC = () => {
  const { openCreate } = useTaskDialogs();

  return (
    <Button variant="outline" size="sm" onClick={openCreate}>
      <HugeiconsIcon icon={TaskAdd01Icon} strokeWidth={2} />
      Add task
    </Button>
  );
};
