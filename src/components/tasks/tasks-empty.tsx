import { TaskAdd01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useTaskDialogs } from "./task-dialogs-provider";

export const TasksEmpty: React.FC = () => {
  const { openCreate } = useTaskDialogs();

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HugeiconsIcon icon={TaskAdd01Icon} size={24} />
        </EmptyMedia>
        <EmptyTitle>No Tasks Yet</EmptyTitle>
        <EmptyDescription>
          You haven&apos;t created any tasks yet. Get started by creating your first task.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center gap-2">
        <Button onClick={openCreate}>Create Task</Button>
      </EmptyContent>
    </Empty>
  );
};
