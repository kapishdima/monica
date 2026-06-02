"use client";

import { MarkdownPlugin } from "@platejs/markdown";
import type { PlateEditor } from "platejs/react";
import { Plate, usePlateEditor } from "platejs/react";
import { BasicNodesKit } from "@/components/editor/plugins/basic-nodes-kit";
import { MarkdownKit } from "@/components/editor/plugins/markdown-kit";
import { Editor, EditorContainer } from "@/components/ui/editor";
import { cn } from "@/lib/utils";

const toMarkdown = (editor: PlateEditor) => editor.getApi(MarkdownPlugin).markdown.serialize();

export interface TaskDescriptionEditorProps {
  /** Current description, as Markdown. */
  value: string;
  /** Called with the serialized Markdown on every change. */
  onChange?: (markdown: string) => void;
  /** Called with the serialized Markdown when the editor loses focus. */
  onBlur?: (markdown: string) => void;
  /** Called with the serialized Markdown when the editor gains focus. */
  onFocus?: (markdown: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  /** Extra classes for the editable surface. */
  className?: string;
  /** Extra classes for the scroll container. */
  containerClassName?: string;
}

/**
 * Plate (platejs) rich-text editor bound to a task description. Reads/writes
 * Markdown so the stored value stays plain, readable text — keeping it
 * compatible with the textarea-era data and the CC-session append flow.
 *
 * The editor is uncontrolled internally: `value` seeds the initial document
 * only. Remount it (e.g. via a `key`) when the underlying value changes from
 * outside.
 */
export function TaskDescriptionEditor({
  value,
  onChange,
  onBlur,
  onFocus,
  placeholder = "Add description…",
  readOnly,
  className,
  containerClassName,
}: TaskDescriptionEditorProps) {
  const editor = usePlateEditor({
    plugins: [...BasicNodesKit, ...MarkdownKit],
    value: (e) => e.getApi(MarkdownPlugin).markdown.deserialize(value ?? ""),
  });

  return (
    <Plate
      editor={editor}
      onChange={onChange ? ({ editor: e }) => onChange(toMarkdown(e)) : undefined}
    >
      <EditorContainer className={containerClassName}>
        <Editor
          variant="none"
          readOnly={readOnly}
          placeholder={placeholder}
          className={cn("text-sm", className)}
          onBlur={onBlur ? () => onBlur(toMarkdown(editor)) : undefined}
          onFocus={onFocus ? () => onFocus(toMarkdown(editor)) : undefined}
        />
      </EditorContainer>
    </Plate>
  );
}
