import { createContext, type ReactNode, type RefObject, use, useEffect, useRef, useState } from "react";
import { type ClaudeSession, claudeSessions } from "@/lib/ipc";

interface SessionState {
  /** Git branch whose Claude Code sessions are listed; null when there is none. */
  branch: string | null;
  sessions: ClaudeSession[];
  /** Path of the selected session, or null when nothing is selected. */
  selected: string | null;
  loading: boolean;
  error: string | null;
  /** The element wrapping the rendered transcript — the scope for text selection. */
  containerRef: RefObject<HTMLDivElement | null>;
}

interface SessionActions {
  select: (path: string) => void;
}

interface SessionContextValue {
  state: SessionState;
  actions: SessionActions;
}

const SessionContext = createContext<SessionContextValue | null>(null);

/** Read the session list, the selected session, and the select action. */
export function useSession(): SessionContextValue {
  const ctx = use(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within a <SessionProvider>");
  }
  return ctx;
}

/**
 * Owns everything about a branch's Claude Code sessions: fetching the list,
 * loading/error state, and which one is selected. The provider is the only place
 * that knows *how* sessions are loaded — consumers read from `useSession()` and
 * stay agnostic of the IPC layer.
 */
export function SessionProvider({
  branch,
  children,
}: {
  branch: string | null;
  children: ReactNode;
}) {
  const [sessions, setSessions] = useState<ClaudeSession[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!branch) {
      setSessions([]);
      setSelected(null);
      return;
    }
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

  const value: SessionContextValue = {
    state: { branch, sessions, selected, loading, error, containerRef },
    actions: { select: setSelected },
  };

  return <SessionContext value={value}>{children}</SessionContext>;
}
