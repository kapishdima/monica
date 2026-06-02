import { useMemo } from "react";
import { useLoaderData, useRouteLoaderData } from "react-router";
import { PlanTomorrowSection } from "@/components/planner/plan-tomorrow-section";
import { TodaySection } from "@/components/planner/today-section";
import { Separator } from "@/components/ui/separator";
import { formatDayKey } from "@/lib/date";
import type { DailyPlan, Project, Task } from "@/lib/ipc";

export interface HomeLoaderData {
  today: string;
  tomorrow: string;
  plan: DailyPlan;
  todayTasks: Task[];
  tomorrowTasks: Task[];
  plannable: Task[];
}

export const Home: React.FC = () => {
  const data = useLoaderData() as HomeLoaderData;
  const projects = (useRouteLoaderData("root") as Project[] | undefined) ?? [];

  const projectNames = useMemo(
    () => new Map(projects.map((project) => [project.id, project.name])),
    [projects],
  );

  // Today's unfinished tasks are the carryover candidates for tomorrow.
  const carryover = useMemo(
    () => data.todayTasks.filter((task) => task.status !== "done"),
    [data.todayTasks],
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 py-2">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Today</h1>
        <p className="text-sm text-muted-foreground">{formatDayKey(data.today)}</p>
      </header>

      <TodaySection
        date={data.today}
        plan={data.plan}
        tasks={data.todayTasks}
        projectNames={projectNames}
      />

      <Separator />

      <section className="flex flex-col gap-4">
        <header className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold tracking-tight">Plan tomorrow</h2>
          <p className="text-sm text-muted-foreground">{formatDayKey(data.tomorrow)}</p>
        </header>
        <PlanTomorrowSection
          tomorrow={data.tomorrow}
          planned={data.tomorrowTasks}
          carryover={carryover}
          plannable={data.plannable}
          projects={projects}
          projectNames={projectNames}
        />
      </section>
    </div>
  );
};
