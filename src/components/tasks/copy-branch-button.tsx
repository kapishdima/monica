import { GitBranchIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Icon-only button that copies a task's auto-generated git branch name. */
export function CopyBranchButton({ branch }: { branch: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async (event: React.MouseEvent) => {
    // Stop the click from bubbling to an enclosing link/row.
    event.preventDefault();
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(branch);
      setCopied(true);
      toast.success("Branch name copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy branch name");
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={onCopy}
      title={`Copy branch name: ${branch}`}
      aria-label="Copy branch name"
    >
      <HugeiconsIcon
        icon={copied ? Tick02Icon : GitBranchIcon}
        strokeWidth={2}
        className={cn("size-4 shrink-0", copied && "text-emerald-500")}
      />
    </Button>
  );
}
