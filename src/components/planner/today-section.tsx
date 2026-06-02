import { useState } from "react";
import {
  DAY_RATING_LABELS,
  DAY_RATING_OPTIONS,
  DayRatingIcon,
} from "@/components/planner/day-rating";
import { TaskList } from "@/components/tasks/task-list";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useDayPlanUpdate } from "@/hooks/use-day-plan-update";
import type { DailyPlan, DayRating, Task } from "@/lib/ipc";

/** End-of-day review: how the day went (rating + reflection) plus today's tasks
 * with inline status editing (via `TaskList`/`TaskCard`). */
export function TodaySection({
  date,
  plan,
  tasks,
  projectNames,
}: {
  date: string;
  plan: DailyPlan;
  tasks: Task[];
  projectNames: Map<string, string>;
}) {
  const { updateReflection, updateRating } = useDayPlanUpdate(date);
  const [reflection, setReflection] = useState(plan.reflection ?? "");
  const [rating, setRating] = useState<DayRating | null>(plan.rating);

  const onRating = async (next: DayRating) => {
    const prev = rating;
    setRating(next);
    try {
      await updateRating(next);
    } catch {
      setRating(prev);
    }
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="rounded-lg border p-1">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" className="h-9 w-full justify-start gap-2 px-2 font-normal" />
            }
          >
            {rating ? (
              <>
                <DayRatingIcon rating={rating} />
                <span>{DAY_RATING_LABELS[rating]}</span>
              </>
            ) : (
              <span className="text-muted-foreground">How did today go?</span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-48">
            <DropdownMenuRadioGroup
              value={rating ?? ""}
              onValueChange={(v) => onRating(v as DayRating)}
            >
              {DAY_RATING_OPTIONS.map((value) => (
                <DropdownMenuRadioItem key={value} value={value}>
                  <DayRatingIcon rating={value} />
                  {DAY_RATING_LABELS[value]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <Textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          onBlur={() => {
            if (reflection !== (plan.reflection ?? "")) {
              updateReflection(reflection).catch(() => setReflection(plan.reflection ?? ""));
            }
          }}
          placeholder="Reflect on the day…"
          className="min-h-20 resize-none border-0 shadow-none focus-visible:ring-0"
        />
      </div>

      <TaskList
        tasks={tasks}
        projectNames={projectNames}
        emptyState={
          <p className="py-8 text-center text-sm text-muted-foreground">
            No tasks planned for today.
          </p>
        }
      />
    </section>
  );
}
