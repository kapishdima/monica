import { useTaskDetail } from "./task-detail-context";

/** Primary column: task id, title, and description. */
export function TaskDetailContent() {
  const {
    state: { task },
  } = useTaskDetail();

  return (
    <main className="min-w-0 flex-1">
      <p className="mb-3 text-sm text-muted-foreground tabular-nums">{task.taskId}</p>
      <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance">
        {task.title}
      </h1>
      {task.description ? (
        <p className="mt-4 max-w-[70ch] text-sm whitespace-pre-wrap text-pretty text-foreground/80">
          {task.description}
        </p>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">No description.</p>
      )}
    </main>
  );
}
