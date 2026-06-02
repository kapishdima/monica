import { useMemo } from "react";
import { useLoaderData, useRouteLoaderData } from "react-router";
import { PlanTomorrowSection } from "@/components/planner/plan-tomorrow-section";
import { TodaySection } from "@/components/planner/today-section";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <div className="max-w-3xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Today</CardTitle>
          <CardDescription>{formatDayKey(data.today)}</CardDescription>
        </CardHeader>
        <CardContent>
          <TodaySection
            date={data.today}
            plan={data.plan}
            tasks={data.todayTasks}
            projectNames={projectNames}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Plan tomorrow</CardTitle>
          <CardDescription>{formatDayKey(data.tomorrow)}</CardDescription>
        </CardHeader>
        <CardContent>
          <PlanTomorrowSection
            tomorrow={data.tomorrow}
            planned={data.tomorrowTasks}
            carryover={carryover}
            plannable={data.plannable}
            projects={projects}
            projectNames={projectNames}
          />
        </CardContent>
      </Card>
    </div>
  );
};
