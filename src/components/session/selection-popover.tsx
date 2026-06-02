import { type ComponentProps, type ReactNode, type RefObject, useEffect, useState } from "react";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/** The live selection handed to the render child while the popover is open. */
export interface ActiveSelection {
  /** The trimmed selected text. */
  text: string;
  /** Dismiss the popover (e.g. after acting on the selection). */
  close: () => void;
}

/**
 * Primitive: shows a floating popover over the user's text selection while it
 * stays inside `containerRef`, and renders whatever `children` returns into it.
 * Owns all the selection-detection and anchoring logic; knows nothing about what
 * it renders, so callers compose their own node (a button, a menu, …).
 */
export function SelectionPopover({
  containerRef,
  children,
  side = "top",
  sideOffset = 8,
  className,
}: {
  containerRef: RefObject<HTMLElement | null>;
  children: (selection: ActiveSelection) => ReactNode;
  side?: ComponentProps<typeof PopoverContent>["side"];
  sideOffset?: ComponentProps<typeof PopoverContent>["sideOffset"];
  className?: string;
}) {
  // A new rect re-anchors the popover; `null` closes it.
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [text, setText] = useState("");

  useEffect(() => {
    // The current selection if it is non-empty and lives inside our container.
    const currentSelection = () => {
      const selection = window.getSelection();
      const container = containerRef.current;
      if (!selection || selection.isCollapsed || selection.rangeCount === 0 || !container) {
        return null;
      }
      const value = selection.toString().trim();
      if (
        !value ||
        !selection.anchorNode ||
        !selection.focusNode ||
        !container.contains(selection.anchorNode) ||
        !container.contains(selection.focusNode)
      ) {
        return null;
      }
      return { value, rect: selection.getRangeAt(0).getBoundingClientRect() };
    };

    const reveal = () => {
      const result = currentSelection();
      if (result) {
        setText(result.value);
        setRect(result.rect);
      }
    };

    // Open on the next tick, after the gesture's trailing `click` has fired.
    // base-ui dismisses on an "intentional" outside click, so opening synchronously
    // on pointerup lets that same click immediately close the popover.
    let timer = 0;
    const scheduleReveal = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(reveal, 0);
    };

    // Hide as soon as the selection collapses or moves out of the container.
    const onSelectionChange = () => {
      if (!currentSelection()) setRect(null);
    };

    const onPointerUp = (event: PointerEvent) => {
      const container = containerRef.current;
      // Ignore releases on the popover itself (it lives in a portal, outside the container).
      if (!container || !(event.target instanceof Node) || !container.contains(event.target)) {
        return;
      }
      scheduleReveal();
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.shiftKey) scheduleReveal();
    };

    document.addEventListener("selectionchange", onSelectionChange);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("keyup", onKeyUp);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("selectionchange", onSelectionChange);
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("keyup", onKeyUp);
    };
  }, [containerRef]);

  const close = () => setRect(null);
  const open = rect !== null;

  // Virtual anchor reads the live selection rect so the bar follows scrolling too.
  const anchor = rect
    ? {
        getBoundingClientRect: () => {
          const selection = window.getSelection();
          return selection && selection.rangeCount > 0
            ? selection.getRangeAt(0).getBoundingClientRect()
            : rect;
        },
      }
    : undefined;

  return (
    <Popover open={open} onOpenChange={(next) => !next && close()}>
      <PopoverContent
        anchor={anchor}
        side={side}
        sideOffset={sideOffset}
        // Don't steal focus — that would fight the active text selection.
        initialFocus={false}
        finalFocus={false}
        // Keep the selection alive when pressing a control (mousedown would clear it).
        onMouseDown={(event) => event.preventDefault()}
        className={cn(
          "flex w-auto flex-row items-center gap-0.5 rounded-lg p-1 shadow-md",
          className,
        )}
      >
        {open ? children({ text, close }) : null}
      </PopoverContent>
    </Popover>
  );
}
