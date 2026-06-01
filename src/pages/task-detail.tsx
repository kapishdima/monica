import { useLoaderData } from "react-router";
import {
  TaskDetailBreadcrumb,
  TaskDetailContent,
  TaskDetailProvider,
  TaskDetailSidebar,
  TaskDetailToolbar,
} from "@/components/tasks/task-detail";
import type { Task } from "@/lib/ipc";

export const TaskDetail: React.FC = () => {
  const task = useLoaderData() as Task;

  return (
    <TaskDetailProvider task={task}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <TaskDetailBreadcrumb />
        <TaskDetailToolbar />
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        <TaskDetailContent />
        <TaskDetailSidebar />
      </div>
    </TaskDetailProvider>
  );
};
