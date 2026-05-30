import { useEffect } from "react";

interface ShortcutOptions {
  /** Require the key to be chorded with Cmd (mac) or Ctrl. */
  ctrlOrMeta?: boolean;
}

const EDITABLE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return Boolean(el && (EDITABLE_TAGS.has(el.tagName) || el.isContentEditable));
}

/**
 * Fire `handler` on a global keydown for `key`. Bare-key shortcuts are ignored
 * while the user is typing in a field; chorded (Cmd/Ctrl) shortcuts always
 * fire, since they can't be mistaken for text entry. `handler` should be stable
 * (wrap in `useCallback`).
 */
export function useKeyboardShortcut(
  key: string,
  handler: () => void,
  options: ShortcutOptions = {}
): void {
  const { ctrlOrMeta = false } = options;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== key.toLowerCase()) {
        return;
      }
      if (ctrlOrMeta) {
        if (!(event.metaKey || event.ctrlKey)) {
          return;
        }
      } else if (isTypingTarget(event.target)) {
        return;
      }
      event.preventDefault();
      handler();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [key, ctrlOrMeta, handler]);
}
