import { useLoaderData } from "react-router";
import {
  ProjectDetailBreadcrumb,
  ProjectDetailContent,
  ProjectDetailProvider,
  ProjectDetailSidebar,
  ProjectDetailToolbar,
} from "@/components/projects/project-detail";
import type { Project, Task } from "@/lib/ipc";

interface LoaderData {
  project: Project;
  tasks: Task[];
}

export const ProjectDetail: React.FC = () => {
  const { project, tasks } = useLoaderData<LoaderData>();

  return (
    <ProjectDetailProvider project={project} tasks={tasks}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <ProjectDetailBreadcrumb />
        <ProjectDetailToolbar />
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        <ProjectDetailContent />
        <ProjectDetailSidebar />
      </div>
    </ProjectDetailProvider>
  );
};
