import { Folder01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTaskDetail } from "./task-detail-context";
import { PROPERTY_ROW, PropertyGroup, SectionLabel } from "./task-property";

/** The "Project" group: a link to the owning project, or a muted fallback. */
export function TaskProjectSection() {
  const {
    state: { project },
  } = useTaskDetail();

  return (
    <section className="flex flex-col gap-2">
      <SectionLabel>Project</SectionLabel>
      <PropertyGroup>
        {project ? (
          <Button
            variant="ghost"
            className={PROPERTY_ROW}
            render={<Link to={`/projects/${project.id}`} />}
          >
            <HugeiconsIcon icon={Folder01Icon} strokeWidth={2} className="size-4 shrink-0" />
            <span className="truncate">{project.name}</span>
          </Button>
        ) : (
          <div className={cn(PROPERTY_ROW, "flex items-center text-muted-foreground")}>
            <HugeiconsIcon icon={Folder01Icon} strokeWidth={2} className="size-4 shrink-0" />
            <span className="truncate">Unknown project</span>
          </div>
        )}
      </PropertyGroup>
    </section>
  );
}
