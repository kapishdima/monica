import { useMemo } from "react";
import { useLoaderData, useRouteLoaderData } from "react-router";
import { TaskList } from "@/components/tasks/task-list";
import { TasksEmpty } from "@/components/tasks/tasks-empty";
import type { Project, Task, TaskStatus } from "@/lib/ipc";

/** Section order for the Tasks page — active work first. */
const STATUS_ORDER: TaskStatus[] = ["in_progress", "todo", "backlog", "in_review", "done"];

export const Tasks: React.FC = () => {
  const tasks = useLoaderData<Task[] | undefined>() ?? [];
  const projects = useRouteLoaderData<Project[] | undefined>("root") ?? [];

  const projectNames = useMemo(
    () => new Map(projects.map((project) => [project.id, project.name])),
    [projects],
  );

  if (!tasks.length) {
    return (
      <div className="w-full h-[50vh] flex items-center justify-center">
        <TasksEmpty />
      </div>
    );
  }

  return <TaskList tasks={tasks} projectNames={projectNames} statusOrder={STATUS_ORDER} />;
};
