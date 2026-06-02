import { GitBranchIcon, Message01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";
import { type ClaudeSession, claudeSessions } from "@/lib/ipc";
import { cn } from "@/lib/utils";
import { SessionTranscriptView } from "./session-transcript";
import { useTaskDetail } from "./task-detail-context";

/**
 * Sessions tab: a left rail listing the Claude Code sessions whose git branch
 * matches the task's `githubBranch`, and a wide pane rendering the selected
 * session's transcript.
 */
export function TaskSessions() {
  const {
    state: { task },
  } = useTaskDetail();
  const branch = task.githubBranch;

  const [sessions, setSessions] = useState<ClaudeSession[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!branch) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    claudeSessions
      .list(branch)
      .then((data) => {
        if (cancelled) return;
        setSessions(data);
        setSelected(data[0]?.path ?? null);
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
  }, [branch]);

  if (!branch) {
    return <EmptyState>This task has no branch yet.</EmptyState>;
  }
  if (loading) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Loading sessions…</p>;
  }
  if (error) {
    return <p className="py-12 text-center text-sm text-destructive">{error}</p>;
  }
  if (!sessions || sessions.length === 0) {
    return (
      <EmptyState>
        No Claude Code sessions for <code className="font-mono text-foreground">{branch}</code>.
      </EmptyState>
    );
  }

  return (
    <div className="flex gap-6">
      <nav className="sticky top-4 flex w-72 shrink-0 flex-col gap-1 self-start">
        {sessions.map((session) => (
          <SessionRow
            key={session.path}
            session={session}
            branch={branch}
            active={session.path === selected}
            onSelect={() => setSelected(session.path)}
          />
        ))}
      </nav>
      <div className="min-w-0 flex-1">
        {selected ? <SessionTranscriptView key={selected} path={selected} /> : null}
      </div>
    </div>
  );
}

function SessionRow({
  session,
  branch,
  active,
  onSelect,
}: {
  session: ClaudeSession;
  branch: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full flex-col items-start gap-1 rounded-lg border p-2.5 text-left transition-colors hover:bg-muted/40",
        active ? "border-foreground/20 bg-muted/50" : "border-transparent",
      )}
    >
      <span className="line-clamp-2 text-sm font-medium text-foreground">
        {session.title || session.sessionId}
      </span>
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        {session.updatedAt ? <span>{formatSessionTime(session.updatedAt)}</span> : null}
        <span className="flex items-center gap-1">
          <HugeiconsIcon icon={Message01Icon} className="size-3" strokeWidth={2} />
          {session.messageCount}
        </span>
        {session.gitBranch && session.gitBranch !== branch ? (
          <span className="flex items-center gap-1 font-mono">
            <HugeiconsIcon icon={GitBranchIcon} className="size-3" strokeWidth={2} />
            {session.gitBranch}
          </span>
        ) : null}
      </span>
    </button>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-12 text-center text-sm text-muted-foreground">
      <p>{children}</p>
    </div>
  );
}

/** Short local date + time, e.g. "Jun 1, 14:32". */
function formatSessionTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
