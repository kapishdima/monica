import { Badge } from "@/components/ui/badge";
import type { ProjectStatus } from "@/lib/ipc";

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: "Active",
  planned: "Planned",
  cancelled: "Cancelled",
};

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
