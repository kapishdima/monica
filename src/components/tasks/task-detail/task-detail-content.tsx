import { useRef } from "react";
import { useTaskUpdate } from "@/hooks/use-task-update";
import { TaskDescriptionEditor } from "../task-description-editor";
import { useTaskDetail } from "./task-detail-context";

/** Primary column: task id, title, and an inline-editable description. */
export function TaskDetailContent() {
  const {
    state: { task },
  } = useTaskDetail();
  const { updateDescription } = useTaskUpdate();

  // Markdown captured on focus — the baseline we diff against on blur so a
  // focus/blur with no edits (where serialization may normalize the stored
  // text) doesn't trigger a redundant write.
  const baseline = useRef(task.description ?? "");

  const handleBlur = (markdown: string) => {
    const next = markdown.trim() ? markdown : "";
    if (next === baseline.current) return;
    baseline.current = next;
    updateDescription(task.id, next || null).catch(() => {
      // Revert the baseline so the next blur retries the failed write.
      baseline.current = task.description ?? "";
    });
  };

  return (
    <main className="min-w-0 flex-1">
      <p className="mb-3 text-sm text-muted-foreground tabular-nums">{task.taskId}</p>
      <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance">
        {task.title}
      </h1>
      <TaskDescriptionEditor
        key={task.id}
        value={task.description ?? ""}
        onFocus={(markdown) => {
          baseline.current = markdown;
        }}
        onBlur={handleBlur}
        placeholder="Add a description…"
        className="max-w-[70ch]"
        containerClassName="mt-4 min-h-24"
      />
    </main>
  );
}
