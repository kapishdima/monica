import { Add01Icon, ArrowRight01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Children, type ReactNode, useState } from "react";

import { SectionLabel } from "@/components/detail/property";
import { TaskCard } from "@/components/tasks/task-card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import { cn } from "@/lib/utils";
import { useTaskPlanning } from "@/hooks/use-task-planning";
import type { Project, Task, TaskPriority, TaskStatus } from "@/lib/ipc";

/** Sort weight for task status — in_progress first, backlog last. */
const STATUS_ORDER: Record<TaskStatus, number> = {
  in_progress: 0,
  in_review: 1,
  todo: 2,
  backlog: 3,
  done: 4,
};

/** Sort weight for task priority — urgent/high first, low last. */
const PRIORITY_ORDER: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  low: 2,
};

/** Order tasks by status (in_progress → backlog), then by priority (high first). */
function sortByStatus(tasks: Task[]): Task[] {
  return [...tasks].sort(
    (a, b) =>
      STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
      PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
  );
}

/** How many tasks stay visible before the rest collapse behind a toggle. */
const COLLAPSED_COUNT = 5;

/** A labelled task group that keeps the first {@link COLLAPSED_COUNT} rows
 * visible and tucks any overflow behind a "Show more" collapsible. */
function PlanSection({
  label,
  count,
  children,
}: {
  label: string;
  count: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const items = Children.toArray(children);
  const hasMore = items.length > COLLAPSED_COUNT;
  const visible = hasMore ? items.slice(0, COLLAPSED_COUNT) : items;
  const hidden = hasMore ? items.slice(COLLAPSED_COUNT) : [];

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 px-1">
        <SectionLabel>{label}</SectionLabel>
        <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
      </div>
      <div className="rounded-lg border">
        <div className="divide-y divide-border">{visible}</div>
        {hasMore && (
          <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleContent>
              <div className="divide-y divide-border border-t">{hidden}</div>
            </CollapsibleContent>
            <CollapsibleTrigger className="flex w-full items-center gap-1.5 border-t px-3 py-2 text-left text-xs text-muted-foreground hover:bg-muted/50">
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                strokeWidth={2}
                className={cn("size-3.5 shrink-0 transition-transform", open && "rotate-90")}
              />
              {open ? "Show less" : `Show ${hidden.length} more`}
            </CollapsibleTrigger>
          </Collapsible>
        )}
      </div>
    </div>
  );
}

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
  const carryoverTasks = carryover.filter((t) => !plannedIds.has(t.id));

  return (
    <section className="flex flex-col gap-5">
      {planned.length > 0 && (
        <PlanSection label="Planned" count={planned.length}>
          {sortByStatus(planned).map((task) => (
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
        </PlanSection>
      )}

      {carryoverTasks.length > 0 && (
        <PlanSection label="Carry over from today" count={carryoverTasks.length}>
          {sortByStatus(carryoverTasks).map((task) => (
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
        </PlanSection>
      )}

      {plannable.length > 0 && (
        <PlanSection label="Add from backlog" count={plannable.length}>
          {sortByStatus(plannable).map((task) => (
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
        </PlanSection>
      )}
    </section>
  );
}
