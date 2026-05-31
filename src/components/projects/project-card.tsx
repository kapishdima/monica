import {
  Delete02Icon,
  Edit02Icon,
  GithubIcon,
  GitPullRequestIcon,
  MoreHorizontalCircle01Icon,
  RecordIcon,
  StarIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import type { Project } from "@/lib/ipc";
import { cn } from "@/lib/utils";
import { ConnectGithubDialog } from "./connect-github-dialog";
import { DeleteProjectDialog } from "./delete-project-dialog";
import { ProjectFormDialog } from "./project-form-dialog";
import { hasGithubMetrics, ProjectStatusBadge } from "./project-status";

function Metric({ icon, value }: { icon: typeof StarIcon; value: number }) {
  return (
    <span className="flex items-center gap-1 tabular-nums text-muted-foreground">
      <HugeiconsIcon icon={icon} strokeWidth={2} className="size-4" />
      {value}
    </span>
  );
}

function ProjectMetrics({ project }: { project: Project }) {
  return (
    <div className="flex items-center gap-3 text-sm mt-2">
      <Metric icon={StarIcon} value={project.githubStars ?? 0} />
      <Metric icon={GitPullRequestIcon} value={project.githubPrs ?? 0} />
      <Metric icon={RecordIcon} value={project.githubIssues ?? 0} />
    </div>
  );
}

type ProjectActions = {
  onEdit: () => void;
  onConnect: () => void;
  onDelete: () => void;
};

function ProjectActionsMenu({ onEdit, onConnect, onDelete }: ProjectActions) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label="Project actions" />}
      >
        <HugeiconsIcon icon={MoreHorizontalCircle01Icon} strokeWidth={2} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={onEdit}>
          <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
          <span>Edit project</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onConnect}>
          <HugeiconsIcon icon={GithubIcon} strokeWidth={2} />
          <span>Connect GitHub</span>
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
          <span>Delete project</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ProjectInitial({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn(
        "flex size-10 items-center justify-center rounded-xl bg-muted text-sm font-medium text-muted-foreground",
        className,
      )}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function ProjectLogo({ project }: { project: Project }) {
  const [broken, setBroken] = useState(false);
  if (project.logoPath && !broken) {
    return (
      <img
        src={convertFileSrc(project.logoPath)}
        alt=""
        className="size-10 rounded-xl object-cover"
        onError={() => setBroken(true)}
      />
    );
  }
  return <ProjectInitial name={project.name} />;
}

export function ProjectCard({ project }: { project: Project }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);

  const showMetrics = hasGithubMetrics(project);
  const actions: ProjectActions = {
    onEdit: () => setEditOpen(true),
    onConnect: () => setConnectOpen(true),
    onDelete: () => setDeleteOpen(true),
  };
  const projectHref = `/projects/${project.id}`;

  return (
    <>
      <Item variant="line" className="items-start py-5">
        <ItemMedia>
          <ProjectLogo project={project} />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>
            <Link to={projectHref} className="hover:underline">
              {project.name}
            </Link>
            <ProjectStatusBadge status={project.status} />
          </ItemTitle>
          {project.description && (
            <ItemDescription className="max-w-3xl line-clamp-2">
              {project.description}
            </ItemDescription>
          )}
          {showMetrics && <ProjectMetrics project={project} />}
        </ItemContent>
        <ItemActions>
          <ProjectActionsMenu {...actions} />
        </ItemActions>
      </Item>

      <ProjectFormDialog mode="edit" project={project} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteProjectDialog project={project} open={deleteOpen} onOpenChange={setDeleteOpen} />
      <ConnectGithubDialog project={project} open={connectOpen} onOpenChange={setConnectOpen} />
    </>
  );
}
