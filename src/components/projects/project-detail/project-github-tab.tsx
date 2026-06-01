import { GithubIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";
import { GithubItemList } from "@/components/projects/github-item-list";
import { Button } from "@/components/ui/button";
import { type GithubActivity, github } from "@/lib/ipc";
import { useProjectDetail } from "./project-detail-context";

/** Fetches and renders the project's open PRs or issues for a tab. */
export function ProjectGithubTab({ kind }: { kind: "prs" | "issues" }) {
  const {
    state: { project },
    actions: { openConnect },
  } = useProjectDetail();
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
        <Button variant="outline" size="sm" onClick={openConnect}>
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
