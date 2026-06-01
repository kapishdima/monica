import { CreateProjecBtn } from "@/components/projects/create-project-btn";
import { CreateTaskBtn } from "@/components/tasks/create-task-btn";

export function NavActions() {
  return (
    <div className="flex items-center gap-2 text-sm">
      <CreateProjecBtn />
      <CreateTaskBtn />
    </div>
  );
}
