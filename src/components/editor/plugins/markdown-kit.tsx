"use client";

import { MarkdownPlugin } from "@platejs/markdown";
import remarkGfm from "remark-gfm";

// Serialize/deserialize the editor value to Markdown so descriptions stay
// plain, human-readable text in SQLite (and round-trip with the CC-session
// append + plain-text rendering elsewhere). remarkGfm covers the gfm syntax the
// basic marks emit (e.g. ~~strikethrough~~).
export const MarkdownKit = [
  MarkdownPlugin.configure({
    options: {
      remarkPlugins: [remarkGfm],
    },
  }),
];
