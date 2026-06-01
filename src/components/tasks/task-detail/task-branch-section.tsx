import { CopyBranchButton } from "@/components/tasks/copy-branch-button";
import { useTaskDetail } from "./task-detail-context";
import { SectionLabel } from "./task-property";

/** The "Git branch" group — only rendered when the task has a branch. */
export function TaskBranchSection() {
  const {
    state: { task },
  } = useTaskDetail();

  if (!task.githubBranch) return null;

  return (
    <section className="flex flex-col gap-2">
      <SectionLabel>Git branch</SectionLabel>
      <div className="flex items-center gap-1 rounded-lg border p-1">
        <span className="min-w-0 flex-1 truncate px-1.5 font-mono text-sm">{task.githubBranch}</span>
        <CopyBranchButton branch={task.githubBranch} />
      </div>
    </section>
  );
}
