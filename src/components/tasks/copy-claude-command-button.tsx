import { Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ClaudeAiIcon } from "@/components/ui/svgs/claudeAiIcon";
import { cn } from "@/lib/utils";

/** Icon-only button that copies a `claude -n "<branch>"` command to launch
 * Claude Code with a session named after the task's git branch. */
export function CopyClaudeCommandButton({ branch }: { branch: string }) {
  const [copied, setCopied] = useState(false);
  const command = `claude -n "${branch}"`;

  const onCopy = async (event: React.MouseEvent) => {
    // Stop the click from bubbling to an enclosing link/row.
    event.preventDefault();
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      toast.success("Claude command copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy Claude command");
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={onCopy}
      title={`Copy Claude command: ${command}`}
      aria-label="Copy Claude command"
    >
      {copied ? (
        <HugeiconsIcon
          icon={Tick02Icon}
          strokeWidth={2}
          className="size-4 shrink-0 text-emerald-500"
        />
      ) : (
        <ClaudeAiIcon className={cn("size-4 shrink-0")} />
      )}
    </Button>
  );
}
