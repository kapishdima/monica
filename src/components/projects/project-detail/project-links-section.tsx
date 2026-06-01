import { GithubIcon, Link01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { PROPERTY_ROW, PropertyGroup, SectionLabel } from "@/components/detail/property";
import { Button } from "@/components/ui/button";
import { useProjectDetail } from "./project-detail-context";

/** Strips the scheme so a URL reads as a compact, Linear-style hostname/path. */
function prettyUrl(url: string) {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

/** The "Links" group: GitHub repo, website, or a connect-GitHub affordance. */
export function ProjectLinksSection() {
  const {
    state: { project },
    actions: { openConnect },
  } = useProjectDetail();

  return (
    <section className="flex flex-col gap-2">
      <SectionLabel>Links</SectionLabel>
      <PropertyGroup>
        {project.githubUrl ? (
          <Button
            variant="ghost"
            className={PROPERTY_ROW}
            onClick={() => openUrl(project.githubUrl as string)}
          >
            <HugeiconsIcon icon={GithubIcon} strokeWidth={2} className="size-4 shrink-0" />
            <span className="truncate">{prettyUrl(project.githubUrl)}</span>
          </Button>
        ) : (
          <Button variant="ghost" className={PROPERTY_ROW} onClick={openConnect}>
            <HugeiconsIcon icon={GithubIcon} strokeWidth={2} className="size-4 shrink-0" />
            <span className="truncate text-muted-foreground">Connect GitHub</span>
          </Button>
        )}
        {project.url && (
          <Button
            variant="ghost"
            className={PROPERTY_ROW}
            onClick={() => openUrl(project.url as string)}
          >
            <HugeiconsIcon icon={Link01Icon} strokeWidth={2} className="size-4 shrink-0" />
            <span className="truncate">{prettyUrl(project.url)}</span>
          </Button>
        )}
      </PropertyGroup>
    </section>
  );
}
