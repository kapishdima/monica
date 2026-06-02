import type { ReactNode } from "react";
import { useSession } from "./session-context";
import { SessionList } from "./session-list";
import { type SelectionAction, SessionTranscript } from "./session-transcript";

/**
 * The default two-pane session view: a list rail beside the selected transcript,
 * with loading / error / empty handling. Compose `SessionList` + `SessionTranscript`
 * directly if a different layout is needed.
 */
export function Sessions({
  selectionActions = [],
  noBranchLabel = "No branch yet.",
}: {
  selectionActions?: SelectionAction[];
  noBranchLabel?: ReactNode;
}) {
  const {
    state: { branch, sessions, loading, error },
  } = useSession();

  if (!branch) {
    return <EmptyState>{noBranchLabel}</EmptyState>;
  }
  if (loading) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Loading sessions…</p>;
  }
  if (error) {
    return <p className="py-12 text-center text-sm text-destructive">{error}</p>;
  }
  if (sessions.length === 0) {
    return (
      <EmptyState>
        No Claude Code sessions for <code className="font-mono text-foreground">{branch}</code>.
      </EmptyState>
    );
  }

  return (
    <div className="flex gap-6">
      <SessionList />
      <div className="min-w-0 flex-1">
        <SessionTranscript selectionActions={selectionActions} />
      </div>
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="py-12 text-center text-sm text-muted-foreground">
      <p>{children}</p>
    </div>
  );
}
