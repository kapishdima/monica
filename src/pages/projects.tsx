import { Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouteLoaderData } from "react-router";
import { ProjectCard } from "@/components/projects/project-card";
import { useProjectDialogs } from "@/components/projects/project-dialogs-provider";
import { Button } from "@/components/ui/button";
import type { Project } from "@/lib/ipc";

export const Projects: React.FC = () => {
  const projects = (useRouteLoaderData("root") as Project[] | undefined) ?? [];
  const { openCreate } = useProjectDialogs();

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Projects</h1>
        <Button onClick={openCreate}>
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
          Add project
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
          No projects yet
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
};
