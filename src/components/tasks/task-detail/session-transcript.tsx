import {
  AiBrain01Icon,
  AiUserIcon,
  ArrowRight01Icon,
  SparklesIcon,
  Wrench01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type ReactNode, useEffect, useState } from "react";
import { MarkdownText } from "@/components/markdown";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { type SessionEvent, type SessionTranscript, claudeSessions } from "@/lib/ipc";
import { cn } from "@/lib/utils";

/** Loads and renders one session's transcript by its file path. */
export function SessionTranscriptView({ path }: { path: string }) {
  const [data, setData] = useState<SessionTranscript | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    claudeSessions
      .get(path)
      .then((d) => {
        if (!cancelled) setData(d);
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
  }, [path]);

  if (loading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Loading transcript…</p>;
  }
  if (error) {
    return <p className="py-8 text-center text-sm text-destructive">{error}</p>;
  }
  if (!data || data.events.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Empty session.</p>;
  }

  return (
    <div className="space-y-4">
      {data.events.map((event, i) => (
        <EventView key={event.uuid ? `${event.uuid}-${i}` : i} event={event} />
      ))}
    </div>
  );
}

function EventView({ event }: { event: SessionEvent }) {
  switch (event.kind) {
    case "userText":
      return (
        <div className="rounded-lg border bg-muted/30 p-3">
          <RoleHeader icon={AiUserIcon} label="You" />
          <MarkdownText>{event.text}</MarkdownText>
        </div>
      );
    case "assistant":
      return (
        <div className="px-1">
          <RoleHeader icon={SparklesIcon} label="Claude" meta={event.model ?? undefined} />
          <MarkdownText>{event.text}</MarkdownText>
        </div>
      );
    case "thinking":
      return (
        <Disclosure icon={AiBrain01Icon} label="Thought">
          <MarkdownText className="text-muted-foreground italic">{event.text}</MarkdownText>
        </Disclosure>
      );
    case "toolUse":
      return (
        <Disclosure icon={Wrench01Icon} label={event.name} meta="tool call">
          <CodeBlock text={prettyInput(event.input)} />
        </Disclosure>
      );
    case "toolResult":
      return (
        <Disclosure
          icon={Wrench01Icon}
          label={event.isError ? "Result (error)" : "Result"}
          tone={event.isError ? "error" : "default"}
        >
          <CodeBlock text={event.content || "(no output)"} />
        </Disclosure>
      );
    case "system":
      return (
        <p className="px-1 text-xs text-muted-foreground">
          <span className="font-medium">{event.subtype ?? "system"}:</span> {event.content}
        </p>
      );
  }
}

function RoleHeader({
  icon,
  label,
  meta,
}: {
  icon: typeof AiUserIcon;
  label: string;
  meta?: string;
}) {
  return (
    <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <HugeiconsIcon icon={icon} className="size-3.5" strokeWidth={2} />
      <span>{label}</span>
      {meta ? <span className="font-normal text-muted-foreground/70">· {meta}</span> : null}
    </div>
  );
}

/** Collapsed-by-default disclosure for thinking / tool calls / tool results. */
function Disclosure({
  icon,
  label,
  meta,
  tone = "default",
  children,
}: {
  icon: typeof AiUserIcon;
  label: string;
  meta?: string;
  tone?: "default" | "error";
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border">
      <CollapsibleTrigger className="flex w-full items-center gap-2 px-2.5 py-2 text-left text-xs font-medium hover:bg-muted/40">
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-90",
          )}
          strokeWidth={2}
        />
        <HugeiconsIcon
          icon={icon}
          className={cn("size-3.5 shrink-0", tone === "error" ? "text-destructive" : "text-muted-foreground")}
          strokeWidth={2}
        />
        <span className={cn("truncate", tone === "error" && "text-destructive")}>{label}</span>
        {meta ? <span className="font-normal text-muted-foreground/70">· {meta}</span> : null}
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t px-2.5 py-2">{children}</CollapsibleContent>
    </Collapsible>
  );
}

function CodeBlock({ text }: { text: string }) {
  return (
    <pre className="max-h-80 overflow-auto rounded-md bg-muted/50 p-2.5 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words">
      {text}
    </pre>
  );
}

function prettyInput(input: unknown): string {
  if (typeof input === "string") return input;
  try {
    return JSON.stringify(input, null, 2);
  } catch {
    return String(input);
  }
}
