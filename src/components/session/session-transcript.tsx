import {
  AiBrain01Icon,
  AiUserIcon,
  Alert02Icon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  ComputerTerminal01Icon,
  Edit02Icon,
  File01Icon,
  Folder01Icon,
  FolderSearchIcon,
  GlobeIcon,
  InformationCircleIcon,
  PencilEdit01Icon,
  Robot01Icon,
  Search01Icon,
  SparklesIcon,
  Task01Icon,
  UnfoldLessIcon,
  UnfoldMoreIcon,
  Wrench01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type ComponentProps, type ReactNode, type RefObject, useEffect, useMemo, useState } from "react";
import { MarkdownText } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { claudeSessions, type SessionEvent, type SessionTranscript as Transcript } from "@/lib/ipc";
import { cn } from "@/lib/utils";
import { useSession } from "./session-context";

type HugeIcon = typeof AiUserIcon;

/** A right-click menu entry acting on the selected transcript text. */
export interface SelectionAction {
  key: string;
  label: string;
  icon: ComponentProps<typeof HugeiconsIcon>["icon"];
  onSelect: (text: string) => void;
}

/**
 * Renders the currently selected session's transcript. `selectionActions` power
 * the right-click menu over a text selection; pass none for a plain, read-only
 * transcript. The floating selection UI is composed separately via `SelectionPopover`.
 */
export function SessionTranscript({
  selectionActions = [],
}: {
  selectionActions?: SelectionAction[];
}) {
  const {
    state: { selected, containerRef },
  } = useSession();

  if (!selected) return null;
  // Remount on session change so all per-event state resets cleanly.
  return (
    <TranscriptView
      key={selected}
      path={selected}
      selectionActions={selectionActions}
      containerRef={containerRef}
    />
  );
}

/** Loads and renders one session's transcript by its file path. */
function TranscriptView({
  path,
  selectionActions,
  containerRef,
}: {
  path: string;
  selectionActions: SelectionAction[];
  containerRef: RefObject<HTMLDivElement | null>;
}) {
  const [data, setData] = useState<Transcript | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Open state for every collapsible row (thinking / tool calls / results),
  // keyed by event index — lets us drive expand/collapse-all from the toolbar.
  const [openKeys, setOpenKeys] = useState<Set<number>>(new Set());
  // The text selected when the context menu was last opened.
  const [selection, setSelection] = useState("");

  const captureSelection = () => setSelection(window.getSelection()?.toString().trim() ?? "");

  useEffect(() => {
    setLoading(true);
    setError(null);
    claudeSessions
      .get(path)
      .then(setData)
      .catch((err) => {
        setError(String(err));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [path]);

  const collapsibleIndices = useMemo(
    () =>
      (data?.events ?? []).map((event, i) => (isCollapsible(event) ? i : -1)).filter((i) => i >= 0),
    [data],
  );

  if (loading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Loading transcript…</p>;
  }
  if (error) {
    return <p className="py-8 text-center text-sm text-destructive">{error}</p>;
  }
  if (!data || data.events.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Empty session.</p>;
  }

  const setOpen = (index: number, open: boolean) =>
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (open) next.add(index);
      else next.delete(index);
      return next;
    });

  const body = (
    <>
      {collapsibleIndices.length > 0 ? (
        <div className="mb-3 flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs text-muted-foreground"
            onClick={() => setOpenKeys(new Set(collapsibleIndices))}
          >
            <HugeiconsIcon icon={UnfoldMoreIcon} className="size-3.5" strokeWidth={2} />
            Expand all
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs text-muted-foreground"
            onClick={() => setOpenKeys(new Set())}
          >
            <HugeiconsIcon icon={UnfoldLessIcon} className="size-3.5" strokeWidth={2} />
            Collapse all
          </Button>
        </div>
      ) : null}

      <ol>
        {data.events.map((event, i) => (
          <RailRow
            key={event.uuid ? `${event.uuid}-${i}` : i}
            event={event}
            isLast={i === data.events.length - 1}
            open={openKeys.has(i)}
            onOpenChange={(open) => setOpen(i, open)}
          />
        ))}
      </ol>
    </>
  );

  // No actions → a plain transcript (the ref still scopes any floating selection UI).
  if (selectionActions.length === 0) {
    return (
      <div ref={containerRef} className="select-text">
        {body}
      </div>
    );
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={<div ref={containerRef} className="select-text" onContextMenu={captureSelection} />}
      >
        {body}
      </ContextMenuTrigger>
      <ContextMenuContent>
        {selectionActions.map((action) => (
          <ContextMenuItem
            key={action.key}
            disabled={!selection}
            onClick={() => action.onSelect(selection)}
          >
            <HugeiconsIcon icon={action.icon} className="size-4" strokeWidth={2} />
            {action.label}
          </ContextMenuItem>
        ))}
      </ContextMenuContent>
    </ContextMenu>
  );
}

function RailRow({
  event,
  isLast,
  open,
  onOpenChange,
}: {
  event: SessionEvent;
  isLast: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const time = formatTime(event.timestamp);

  switch (event.kind) {
    case "userText":
      return (
        <Shell glyph={AiUserIcon} tone="primary" isLast={isLast}>
          <Head label="You" time={time} />
          <MarkdownText>{event.text}</MarkdownText>
        </Shell>
      );
    case "assistant":
      return (
        <Shell glyph={SparklesIcon} tone="primary" isLast={isLast}>
          <Head label="Claude" meta={event.model ?? undefined} time={time} />
          <MarkdownText>{event.text}</MarkdownText>
        </Shell>
      );
    case "system":
      return (
        <Shell glyph={InformationCircleIcon} tone="muted" isLast={isLast}>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">{event.subtype ?? "system"}</span> · {event.content}
          </p>
        </Shell>
      );
    case "thinking":
      return (
        <Shell glyph={AiBrain01Icon} tone="muted" isLast={isLast}>
          <Disclosure open={open} onOpenChange={onOpenChange} label="Thought" time={time}>
            <MarkdownText className="text-muted-foreground italic">{event.text}</MarkdownText>
          </Disclosure>
        </Shell>
      );
    case "toolUse":
      return (
        <Shell glyph={toolIcon(event.name)} tone="muted" isLast={isLast}>
          <Disclosure
            open={open}
            onOpenChange={onOpenChange}
            label={event.name}
            summary={toolSummary(event.input)}
            time={time}
          >
            <CodeBlock text={prettyInput(event.input)} />
          </Disclosure>
        </Shell>
      );
    case "toolResult": {
      const summary = event.content ? resultSummary(event.content) : "(no output)";
      return (
        <Shell
          glyph={event.isError ? Alert02Icon : CheckmarkCircle02Icon}
          tone={event.isError ? "error" : "muted"}
          isLast={isLast}
        >
          <Disclosure
            open={open}
            onOpenChange={onOpenChange}
            label={event.isError ? "Error" : "Result"}
            summary={summary}
            tone={event.isError ? "error" : "default"}
            time={time}
          >
            <CodeBlock text={event.content || "(no output)"} />
          </Disclosure>
        </Shell>
      );
    }
  }
}

/** A timeline row: the connector rail (glyph + line) on the left, content right. */
function Shell({
  glyph,
  tone = "primary",
  isLast,
  children,
}: {
  glyph: HugeIcon;
  tone?: Tone;
  isLast: boolean;
  children: ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <div className="flex flex-col items-center">
        <span
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full border bg-background",
            tone === "error" && "border-destructive/40",
          )}
        >
          <HugeiconsIcon icon={glyph} className={cn("size-3", GLYPH_TONE[tone])} strokeWidth={2} />
        </span>
        {!isLast ? <span aria-hidden className="mt-1 w-px flex-1 bg-border" /> : null}
      </div>
      <div className="min-w-0 flex-1 pb-4">{children}</div>
    </li>
  );
}

/** Header line for a primary turn: label (+meta) left, timestamp right. */
function Head({ label, meta, time }: { label: string; meta?: string; time?: string | null }) {
  return (
    <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
      <div className="font-medium text-foreground">
        {label}
        {meta ? (
          <span className="ml-1.5 font-normal text-muted-foreground/70">· {meta}</span>
        ) : null}
      </div>
      {time ? (
        <div className="shrink-0 text-[0.7rem] text-muted-foreground/60 tabular-nums">{time}</div>
      ) : null}
    </div>
  );
}

/** Collapsed-by-default disclosure for thinking / tool calls / results. */
function Disclosure({
  open,
  onOpenChange,
  label,
  summary,
  tone = "default",
  time,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  summary?: string;
  tone?: "default" | "error";
  time?: string | null;
  children: ReactNode;
}) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger className="-mx-1 flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-left text-xs hover:bg-muted/50">
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          className={cn(
            "size-3 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-90",
          )}
          strokeWidth={2}
        />
        <span
          className={cn(
            "shrink-0 font-medium",
            tone === "error" ? "text-destructive" : "text-foreground",
          )}
        >
          {label}
        </span>
        <span className="min-w-0 flex-1 truncate font-normal text-muted-foreground/80">
          {summary}
        </span>
        {time ? (
          <span className="shrink-0 text-muted-foreground/50 tabular-nums">{time}</span>
        ) : null}
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">{children}</CollapsibleContent>
    </Collapsible>
  );
}

function CodeBlock({ text }: { text: string }) {
  return (
    <pre className="max-h-80 overflow-auto rounded-md bg-muted/50 p-2.5 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap">
      {text}
    </pre>
  );
}

// --- helpers -------------------------------------------------------------------

type Tone = "primary" | "muted" | "error";

const GLYPH_TONE: Record<Tone, string> = {
  primary: "text-foreground",
  muted: "text-muted-foreground",
  error: "text-destructive",
};

const TOOL_ICONS: Record<string, HugeIcon> = {
  read: File01Icon,
  edit: Edit02Icon,
  multiedit: Edit02Icon,
  notebookedit: Edit02Icon,
  write: PencilEdit01Icon,
  bash: ComputerTerminal01Icon,
  bashoutput: ComputerTerminal01Icon,
  grep: Search01Icon,
  glob: FolderSearchIcon,
  ls: Folder01Icon,
  task: Robot01Icon,
  agent: Robot01Icon,
  todowrite: Task01Icon,
  webfetch: GlobeIcon,
  websearch: GlobeIcon,
};

function toolIcon(name: string): HugeIcon {
  return TOOL_ICONS[name.toLowerCase()] ?? Wrench01Icon;
}

function isCollapsible(event: SessionEvent): boolean {
  return event.kind === "thinking" || event.kind === "toolUse" || event.kind === "toolResult";
}

/** A one-line signal pulled from a tool call's input (file, command, query, …). */
function toolSummary(input: unknown): string | undefined {
  if (typeof input === "string") return oneLine(input);
  if (!input || typeof input !== "object") return undefined;
  const o = input as Record<string, unknown>;
  for (const key of [
    "file_path",
    "filePath",
    "path",
    "notebook_path",
    "command",
    "pattern",
    "query",
    "url",
    "prompt",
    "description",
  ]) {
    const value = o[key];
    if (typeof value === "string" && value.trim()) return oneLine(value);
  }
  return undefined;
}

/** Collapsed preview of a tool result: first line + total line count. */
function resultSummary(content: string): string {
  const lines = content.split("\n");
  const first = lines.find((l) => l.trim()) ?? "";
  const count = lines.length;
  const preview = oneLine(first);
  const suffix = `${count} ${count === 1 ? "line" : "lines"}`;
  return preview ? `${preview} · ${suffix}` : suffix;
}

function oneLine(text: string): string {
  const first = text.split("\n")[0].trim();
  return first.length > 120 ? `${first.slice(0, 120)}…` : first;
}

function formatTime(iso?: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function prettyInput(input: unknown): string {
  if (typeof input === "string") return input;
  try {
    return JSON.stringify(input, null, 2);
  } catch {
    return String(input);
  }
}
