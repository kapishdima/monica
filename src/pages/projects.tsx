import { useRouteLoaderData } from "react-router";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectsEmpty } from "@/components/projects/project-empty";
import type { Project } from "@/lib/ipc";

export const Projects: React.FC = () => {
  const projects = useRouteLoaderData<Project[] | undefined>("root") ?? [];

  if (!projects.length) {
    return (
      <div className="w-full h-[50vh] flex items-center justify-center">
        <ProjectsEmpty />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
};
