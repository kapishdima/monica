import { useMemo } from "react";
import { useLoaderData, useRouteLoaderData } from "react-router";
import { TaskList } from "@/components/tasks/task-list";
import { TasksEmpty } from "@/components/tasks/tasks-empty";
import type { Project, Task } from "@/lib/ipc";

export const Tasks: React.FC = () => {
  const tasks = (useLoaderData() as Task[] | undefined) ?? [];
  const projects = (useRouteLoaderData("root") as Project[] | undefined) ?? [];

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

  return <TaskList tasks={tasks} projectNames={projectNames} />;
};
