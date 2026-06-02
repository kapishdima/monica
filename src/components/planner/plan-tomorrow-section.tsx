import { Add01Icon, ArrowRight01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { SectionLabel } from "@/components/detail/property";
import { TaskCard } from "@/components/tasks/task-card";
import { Button } from "@/components/ui/button";

import { useTaskPlanning } from "@/hooks/use-task-planning";
import type { Project, Task } from "@/lib/ipc";

interface PlanTomorrowSectionProps {
  tomorrow: string;
  /** Tasks already planned for tomorrow. */
  planned: Task[];
  /** Today's unfinished tasks, offered for carryover. */
  carryover: Task[];
  /** Open, unassigned tasks across all projects. */
  plannable: Task[];
  projectNames: Map<string, string>;
}

/** Evening planning: carry today's unfinished work forward, pull from the
 * backlog, or quick-create — all stamped with tomorrow's date. */
export function PlanTomorrowSection({
  tomorrow,
  planned,
  carryover,
  plannable,
  projectNames,
}: PlanTomorrowSectionProps) {
  const { planFor } = useTaskPlanning();
  const plannedIds = new Set(planned.map((t) => t.id));

  return (
    <section className="flex flex-col gap-5">
      {planned.length > 0 && (
        <div className="flex flex-col gap-1">
          <SectionLabel>Planned</SectionLabel>
          <div className="divide-y divide-border rounded-lg border">
            {planned.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                projectName={projectNames.get(task.projectId)}
                action={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove from tomorrow"
                    onClick={() => planFor(task.id, null)}
                  >
                    <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
                  </Button>
                }
              />
            ))}
          </div>
        </div>
      )}

      {carryover.filter((t) => !plannedIds.has(t.id)).length > 0 && (
        <div className="flex flex-col gap-1">
          <SectionLabel>Carry over from today</SectionLabel>
          <div className="divide-y divide-border rounded-lg border">
            {carryover
              .filter((t) => !plannedIds.has(t.id))
              .map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  projectName={projectNames.get(task.projectId)}
                  action={
                    <Button variant="ghost" size="sm" onClick={() => planFor(task.id, tomorrow)}>
                      <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
                      Tomorrow
                    </Button>
                  }
                />
              ))}
          </div>
        </div>
      )}

      {plannable.length > 0 && (
        <div className="flex flex-col gap-1">
          <SectionLabel>Add from backlog</SectionLabel>
          <div className="divide-y divide-border rounded-lg border">
            {plannable.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                projectName={projectNames.get(task.projectId)}
                action={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Add to tomorrow"
                    onClick={() => planFor(task.id, tomorrow)}
                  >
                    <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
                  </Button>
                }
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
