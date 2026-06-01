import { Link } from "react-router";
import { useTaskDetail } from "./task-detail-context";

/** Tasks › Project › TASK-ID trail. */
export function TaskDetailBreadcrumb() {
  const {
    state: { task, project },
  } = useTaskDetail();

  return (
    <nav className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
      <Link to="/tasks" className="shrink-0 hover:text-foreground">
        Tasks
      </Link>
      <span className="text-muted-foreground/50">›</span>
      {project && (
        <>
          <Link to={`/projects/${project.id}`} className="truncate hover:text-foreground">
            {project.name}
          </Link>
          <span className="shrink-0 text-muted-foreground/50">›</span>
        </>
      )}
      <span className="shrink-0 font-medium text-foreground tabular-nums">{task.taskId}</span>
    </nav>
  );
}
