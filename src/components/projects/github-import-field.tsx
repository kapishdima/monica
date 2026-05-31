import { GitPullRequestIcon, RecordIcon, StarIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupButton } from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { type GithubRepo, github } from "@/lib/ipc";

/** GitHub metrics pulled from an import, carried into `projects.create`. */
export type GithubImport = { githubUrl: string; stars: number; prs: number; issues: number };

export interface GithubImportControlsProps {
  /** Resets the URL input each time the host dialog opens. */
  open: boolean;
  /** Metrics from the most recent successful import, shown read-only. */
  metrics: GithubImport | null;
  /** Fired once a repo is fetched, so the host can fill the form and keep the metrics. */
  onImported: (repo: GithubRepo, url: string) => void;
  /** Prefix for the input `id`, so multiple instances stay unique. */
  idPrefix?: string;
}

/**
 * Container-agnostic GitHub import: a URL field + Import button and the
 * resulting read-only metrics. Owns its transient input state; the fetched
 * metrics are lifted to the host via `onImported`. Drop it into an accordion,
 * tab, well, or inline section.
 */
export function GithubImportControls({
  open,
  metrics,
  onImported,
  idPrefix = "github",
}: GithubImportControlsProps) {
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);

  // Clear the URL input whenever the dialog opens.
  useEffect(() => {
    if (open) setImportUrl("");
  }, [open]);

  const handleImport = async () => {
    const url = importUrl.trim();
    if (!url) return;
    setImporting(true);
    try {
      const repo = await github.fetchRepo(url);
      onImported(repo, url);
      toast.success("Imported from GitHub");
    } catch (err) {
      toast.error("Failed to import from GitHub", { description: String(err) });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-2">
        <Input
          id={`${idPrefix}-import-url`}
          placeholder="https://github.com/owner/repo"
          value={importUrl}
          onChange={(e) => setImportUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleImport();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleImport}
          disabled={importing || !importUrl.trim()}
        >
          {importing && <Spinner />}
          Import
        </Button>
      </div>

      {metrics && (
        <div className="flex items-center gap-3 text-sm tabular-nums text-muted-foreground animate-in fade-in-0 slide-in-from-top-1 duration-200">
          <ImportMetric icon={StarIcon} value={metrics.stars} />
          <ImportMetric icon={GitPullRequestIcon} value={metrics.prs} />
          <ImportMetric icon={RecordIcon} value={metrics.issues} />
        </div>
      )}
    </div>
  );
}

function ImportMetric({ icon, value }: { icon: typeof StarIcon; value: number }) {
  return (
    <span className="flex items-center gap-1">
      <HugeiconsIcon icon={icon} strokeWidth={2} className="size-4" />
      {value}
    </span>
  );
}
