import { TaskBranchSection } from "./task-branch-section";
import { TaskDates } from "./task-dates";
import { TaskProjectSection } from "./task-project-section";
import { TaskPropertiesSection } from "./task-properties-section";

/** Linear-style right column: properties, project, branch, and timestamps. */
export function TaskDetailSidebar() {
  return (
    <aside className="flex w-full shrink-0 flex-col gap-5 lg:w-64">
      <TaskPropertiesSection />
      <TaskProjectSection />
      <TaskBranchSection />
      <TaskDates />
    </aside>
  );
}
