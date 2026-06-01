import { TaskList } from "@/components/tasks/task-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProjectDetail } from "./project-detail-context";
import { ProjectGithubTab } from "./project-github-tab";

/** Primary column: project name, description, and the tasks/PRs/issues tabs. */
export function ProjectDetailContent() {
  const {
    state: { project, tasks },
  } = useProjectDetail();

  return (
    <main className="min-w-0 flex-1">
      <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance">
        {project.name}
      </h1>
      {project.description ? (
        <p className="mt-4 max-w-[70ch] text-sm whitespace-pre-wrap text-pretty text-foreground/80">
          {project.description}
        </p>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">No description.</p>
      )}

      <Tabs defaultValue="tasks" className="mt-8">
        <TabsList>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="prs">Pull requests</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
        </TabsList>
        <TabsContent value="tasks">
          <TaskList tasks={tasks} />
        </TabsContent>
        <TabsContent value="prs">
          <ProjectGithubTab kind="prs" />
        </TabsContent>
        <TabsContent value="issues">
          <ProjectGithubTab kind="issues" />
        </TabsContent>
      </Tabs>
    </main>
  );
}
