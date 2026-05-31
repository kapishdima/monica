import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { openUrl } from "@tauri-apps/plugin-opener";
import type { GithubItem } from "@/lib/ipc";

export function GithubItemList({ items, emptyText }: { items: GithubItem[]; emptyText: string }) {
  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{emptyText}</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-border">
      {items.map((item) => (
        <li key={item.number}>
          <button
            type="button"
            onClick={() => openUrl(item.htmlUrl)}
            className="flex w-full items-start gap-3 py-3 text-left hover:bg-muted/50"
          >
            <span className="text-sm text-muted-foreground tabular-nums">#{item.number}</span>
            <span className="flex-1 text-sm">{item.title}</span>
            {item.author && <span className="text-xs text-muted-foreground">{item.author}</span>}
            <HugeiconsIcon
              icon={ArrowUpRight01Icon}
              strokeWidth={2}
              className="size-4 text-muted-foreground"
            />
          </button>
        </li>
      ))}
    </ul>
  );
}
