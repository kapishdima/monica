import { Link } from "react-router";
import { useProjectDetail } from "./project-detail-context";

/** Projects › Project name trail. */
export function ProjectDetailBreadcrumb() {
  const {
    state: { project },
  } = useProjectDetail();

  return (
    <nav className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
      <Link to="/projects" className="shrink-0 hover:text-foreground">
        Projects
      </Link>
      <span className="shrink-0 text-muted-foreground/50">›</span>
      <span className="truncate font-medium text-foreground">{project.name}</span>
    </nav>
  );
}
