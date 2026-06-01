import { formatDetailDate } from "@/components/detail/property";
import { useProjectDetail } from "./project-detail-context";

/** Created / updated timestamps shown muted at the bottom of the sidebar. */
export function ProjectDates() {
  const {
    state: { project },
  } = useProjectDetail();

  return (
    <div className="flex flex-col gap-1 px-2 text-xs text-muted-foreground tabular-nums">
      <span>Created {formatDetailDate(project.createdAt)}</span>
      <span>Updated {formatDetailDate(project.updatedAt)}</span>
    </div>
  );
}
