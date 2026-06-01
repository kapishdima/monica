import { GitPullRequestIcon, RecordIcon, StarIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { PROPERTY_ROW, PropertyGroup, SectionLabel } from "@/components/detail/property";
import { hasGithubMetrics } from "@/components/projects/project-status";
import { cn } from "@/lib/utils";
import { useProjectDetail } from "./project-detail-context";

function StatRow({
  icon,
  label,
  value,
}: {
  icon: IconSvgElement;
  label: string;
  value: number | null;
}) {
  return (
    <div className={cn(PROPERTY_ROW, "flex items-center")}>
      <HugeiconsIcon icon={icon} strokeWidth={2} className="size-4 shrink-0" />
      <span className="truncate">{label}</span>
      <span className="ml-auto tabular-nums text-muted-foreground">{value ?? 0}</span>
    </div>
  );
}

/** The "GitHub" group: stars, open PRs, and open issues — only when connected. */
export function ProjectStatsSection() {
  const {
    state: { project },
  } = useProjectDetail();

  if (!hasGithubMetrics(project)) return null;

  return (
    <section className="flex flex-col gap-2">
      <SectionLabel>GitHub</SectionLabel>
      <PropertyGroup>
        <StatRow icon={StarIcon} label="Stars" value={project.githubStars} />
        <StatRow icon={GitPullRequestIcon} label="Pull requests" value={project.githubPrs} />
        <StatRow icon={RecordIcon} label="Issues" value={project.githubIssues} />
      </PropertyGroup>
    </section>
  );
}
