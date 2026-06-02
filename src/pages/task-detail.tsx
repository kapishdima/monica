import { useLoaderData } from "react-router";
import {
  TaskDetailBreadcrumb,
  TaskDetailContent,
  TaskDetailProvider,
  TaskDetailSidebar,
  TaskDetailToolbar,
  TaskSessions,
} from "@/components/tasks/task-detail";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Task } from "@/lib/ipc";

export const TaskDetail: React.FC = () => {
  const task = useLoaderData<Task>();

  return (
    <TaskDetailProvider task={task}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <TaskDetailBreadcrumb />
        <TaskDetailToolbar />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
            <TaskDetailContent />
            <TaskDetailSidebar />
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="mt-6">
          <TaskSessions />
        </TabsContent>
      </Tabs>
    </TaskDetailProvider>
  );
};
