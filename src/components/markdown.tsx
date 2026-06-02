import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

// Tailwind component overrides — the project has no `@tailwindcss/typography`
// plugin, so each element is styled explicitly to read like prose at `text-sm`.
const components = {
  p: ({ node, ...props }: any) => (
    <p className="my-2 leading-relaxed first:mt-0 last:mb-0" {...props} />
  ),
  ul: ({ node, ...props }: any) => (
    <ul className="my-2 ml-5 list-disc space-y-1 marker:text-muted-foreground" {...props} />
  ),
  ol: ({ node, ...props }: any) => (
    <ol className="my-2 ml-5 list-decimal space-y-1 marker:text-muted-foreground" {...props} />
  ),
  li: ({ node, ...props }: any) => <li className="leading-relaxed" {...props} />,
  a: ({ node, ...props }: any) => (
    <a
      className="text-primary underline underline-offset-2"
      target="_blank"
      rel="noreferrer"
      {...props}
    />
  ),
  h1: ({ node, ...props }: any) => <h1 className="mt-4 mb-2 text-base font-semibold" {...props} />,
  h2: ({ node, ...props }: any) => <h2 className="mt-4 mb-2 text-base font-semibold" {...props} />,
  h3: ({ node, ...props }: any) => <h3 className="mt-3 mb-1.5 text-sm font-semibold" {...props} />,
  h4: ({ node, ...props }: any) => <h4 className="mt-3 mb-1.5 text-sm font-semibold" {...props} />,
  blockquote: ({ node, ...props }: any) => (
    <blockquote className="my-2 border-l-2 pl-3 text-muted-foreground" {...props} />
  ),
  hr: () => <hr className="my-3 border-border" />,
  pre: ({ node, ...props }: any) => (
    <pre
      className="my-2 overflow-x-auto rounded-md border bg-muted/50 p-3 text-xs leading-relaxed"
      {...props}
    />
  ),
  code: ({ node, className, children, ...props }: any) => {
    const text = String(children);
    const isInline = !className && !text.includes("\n");
    if (isInline) {
      return (
        <code
          className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em] break-words"
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code className={cn("font-mono", className)} {...props}>
        {children}
      </code>
    );
  },
  table: ({ node, ...props }: any) => (
    <div className="my-2 overflow-x-auto">
      <table className="w-full border-collapse text-xs" {...props} />
    </div>
  ),
  th: ({ node, ...props }: any) => (
    <th className="border px-2 py-1 text-left font-medium" {...props} />
  ),
  td: ({ node, ...props }: any) => <td className="border px-2 py-1" {...props} />,
};

/** Renders trusted Claude Code transcript text as GitHub-flavored markdown. */
export function MarkdownText({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn("text-sm text-foreground/90", className)}>
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </Markdown>
    </div>
  );
}
