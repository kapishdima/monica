import { GitBranchIcon, Message01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ClaudeSession } from "@/lib/ipc";
import { cn } from "@/lib/utils";
import { useSession } from "./session-context";

/** Left rail listing the branch's sessions; selecting one drives the transcript. */
export function SessionList() {
  const {
    state: { sessions, selected, branch },
    actions: { select },
  } = useSession();

  return (
    <nav className="sticky top-4 flex w-72 shrink-0 flex-col gap-1 self-start">
      {sessions.map((session) => (
        <SessionRow
          key={session.path}
          session={session}
          branch={branch}
          active={session.path === selected}
          onSelect={() => select(session.path)}
        />
      ))}
    </nav>
  );
}

function SessionRow({
  session,
  branch,
  active,
  onSelect,
}: {
  session: ClaudeSession;
  branch: string | null;
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

/** Short local date + time, e.g. "Jun 1, 14:32". */
function formatSessionTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
