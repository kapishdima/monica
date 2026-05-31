import {
  Delete02Icon,
  Edit02Icon,
  GitPullRequestIcon,
  GithubIcon,
  MoreHorizontalCircle01Icon,
  RecordIcon,
  StarIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Project } from "@/lib/ipc";
import { ConnectGithubDialog } from "./connect-github-dialog";
import { DeleteProjectDialog } from "./delete-project-dialog";
import { ProjectFormDialog } from "./project-form-dialog";
import { hasGithubMetrics, ProjectStatusBadge } from "./project-status";

function Metric({ icon, value }: { icon: typeof StarIcon; value: number }) {
  return (
    <span className="flex items-center gap-1 text-muted-foreground">
      <HugeiconsIcon icon={icon} strokeWidth={2} className="size-4" />
      {value}
    </span>
  );
}

export function ProjectCard({ project }: { project: Project }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);

  const showMetrics = hasGithubMetrics(project);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            <Link to={`/projects/${project.id}`} className="hover:underline">
              {project.name}
            </Link>
          </CardTitle>
          <CardAction>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon-sm" aria-label="Project actions" />
                }
              >
                <HugeiconsIcon icon={MoreHorizontalCircle01Icon} strokeWidth={2} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
                  <span>Edit project</span>
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
                  <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                  <span>Delete project</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardAction>
          {project.description && (
            <CardDescription className="line-clamp-2">{project.description}</CardDescription>
          )}
        </CardHeader>

        <CardContent className="flex items-center justify-between gap-2">
          <ProjectStatusBadge status={project.status} />
          {showMetrics ? (
            <div className="flex items-center gap-3 text-sm">
              <Metric icon={StarIcon} value={project.githubStars ?? 0} />
              <Metric icon={GitPullRequestIcon} value={project.githubPrs ?? 0} />
              <Metric icon={RecordIcon} value={project.githubIssues ?? 0} />
            </div>
          ) : project.status !== "planned" ? (
            <Button variant="outline" size="sm" onClick={() => setConnectOpen(true)}>
              <HugeiconsIcon icon={GithubIcon} strokeWidth={2} />
              Connect GitHub
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <ProjectFormDialog
        mode="edit"
        project={project}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteProjectDialog project={project} open={deleteOpen} onOpenChange={setDeleteOpen} />
      <ConnectGithubDialog project={project} open={connectOpen} onOpenChange={setConnectOpen} />
    </>
  );
}
