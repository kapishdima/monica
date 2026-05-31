import { Delete02Icon, Edit02Icon, GithubIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";
import { useLoaderData, useNavigate } from "react-router";
import { ConnectGithubDialog } from "@/components/projects/connect-github-dialog";
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog";
import { GithubItemList } from "@/components/projects/github-item-list";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { ProjectStatusBadge } from "@/components/projects/project-status";
import { ProjectTasks } from "@/components/projects/project-tasks";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type GithubActivity, github, type Project, type Task } from "@/lib/ipc";

interface LoaderData {
  project: Project;
  tasks: Task[];
}

function GithubTab({
  project,
  kind,
  onConnect,
}: {
  project: Project;
  kind: "prs" | "issues";
  onConnect: () => void;
}) {
  const [activity, setActivity] = useState<GithubActivity | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!project.githubUrl) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    github
      .activity(project.githubUrl)
      .then((data) => {
        if (!cancelled) setActivity(data);
      })
      .catch((err) => {
        if (!cancelled) setError(String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [project.githubUrl]);

  if (!project.githubUrl) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center text-sm text-muted-foreground">
        <p>Connect this project to GitHub to see its activity.</p>
        <Button variant="outline" size="sm" onClick={onConnect}>
          <HugeiconsIcon icon={GithubIcon} strokeWidth={2} />
          Connect GitHub
        </Button>
      </div>
    );
  }

  if (loading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>;
  }
  if (error) {
    return <p className="py-8 text-center text-sm text-destructive">{error}</p>;
  }

  const items = kind === "prs" ? (activity?.prs ?? []) : (activity?.issues ?? []);
  return (
    <GithubItemList
      items={items}
      emptyText={kind === "prs" ? "No open pull requests" : "No open issues"}
    />
  );
}

export const ProjectDetail: React.FC = () => {
  const { project, tasks } = useLoaderData() as LoaderData;
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl font-semibold">{project.name}</h1>
            <ProjectStatusBadge status={project.status} />
          </div>
          {project.description && (
            <p className="max-w-2xl text-sm text-muted-foreground">{project.description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
            Delete
          </Button>
        </div>
      </div>

      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="prs">Pull requests</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
        </TabsList>
        <TabsContent value="tasks">
          <ProjectTasks tasks={tasks} />
        </TabsContent>
        <TabsContent value="prs">
          <GithubTab project={project} kind="prs" onConnect={() => setConnectOpen(true)} />
        </TabsContent>
        <TabsContent value="issues">
          <GithubTab project={project} kind="issues" onConnect={() => setConnectOpen(true)} />
        </TabsContent>
      </Tabs>

      <ProjectFormDialog mode="edit" project={project} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteProjectDialog
        project={project}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => navigate("/projects")}
      />
      <ConnectGithubDialog project={project} open={connectOpen} onOpenChange={setConnectOpen} />
    </div>
  );
};
