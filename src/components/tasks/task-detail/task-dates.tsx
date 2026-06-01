import { useTaskDetail } from "./task-detail-context";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Created / updated timestamps shown muted at the bottom of the sidebar. */
export function TaskDates() {
  const {
    state: { task },
  } = useTaskDetail();

  return (
    <div className="flex flex-col gap-1 px-2 text-xs text-muted-foreground tabular-nums">
      <span>Created {formatDate(task.createdAt)}</span>
      <span>Updated {formatDate(task.updatedAt)}</span>
    </div>
  );
}
