import { RecordIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type React from "react";
import { Badge } from "@/components/ui/badge";
import type { ProjectStatus } from "@/lib/ipc";
import { cn } from "@/lib/utils";

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: "Active",
  planned: "Planned",
  cancelled: "Cancelled",
};

const STATUS_COLOR: Record<ProjectStatus, string> = {
  active: "text-emerald-500",
  planned: "text-muted-foreground",
  cancelled: "text-destructive",
};

/** Read-only, colored status glyph — mirrors the task status dot. */
export const ProjectStatusIcon: React.FC<{ status: ProjectStatus; className?: string }> = ({
  status,
  className,
}) => (
  <HugeiconsIcon
    icon={RecordIcon}
    strokeWidth={2}
    className={cn("size-4 shrink-0", STATUS_COLOR[status], className)}
  />
);

export const PROJECT_STATUS_OPTIONS: ProjectStatus[] = ["planned", "active", "cancelled"];

const STATUS_VARIANT: Record<ProjectStatus, "default" | "secondary" | "destructive"> = {
  active: "default",
  planned: "secondary",
  cancelled: "destructive",
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{PROJECT_STATUS_LABELS[status]}</Badge>;
}

/** A project shows GitHub metrics only once connected and not merely planned. */
export function hasGithubMetrics(project: {
  status: ProjectStatus;
  githubUrl: string | null;
}): boolean {
  return project.status !== "planned" && !!project.githubUrl;
}
