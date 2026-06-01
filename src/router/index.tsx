import { createBrowserRouter } from "react-router";
import { AppLayout } from "@/components/layout/app-layout";
import { menu } from "@/config/menu";
import { projects, tasks } from "@/lib/ipc";
import { ProjectDetail } from "@/pages/project-detail";
import { TaskDetail } from "@/pages/task-detail";

export const router = createBrowserRouter([
  {
    // The root layout loader lists projects; it is the single source of truth
    // for both the sidebar and the projects list page. Mutations call
    // `useRevalidator().revalidate()` to refresh it.
    id: "root",
    Component: AppLayout,
    loader: () => projects.list(),
    children: [
      ...menu.map((item) => ({
        path: item.url,
        Component: item.component,
        loader: item.loader,
      })),
      {
        path: "/projects/:projectId",
        Component: ProjectDetail,
        loader: async ({ params }) => {
          const id = params.projectId as string;
          const [project, projectTasks] = await Promise.all([projects.get(id), tasks.list(id)]);
          return { project, tasks: projectTasks };
        },
      },
      {
        path: "/tasks/:taskId",
        Component: TaskDetail,
        loader: ({ params }) => tasks.get(params.taskId as string),
      },
    ],
  },
]);
