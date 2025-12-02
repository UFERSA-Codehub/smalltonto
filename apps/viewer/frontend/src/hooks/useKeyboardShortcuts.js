import { useEffect, useCallback, useRef } from "react";

const shortcutRegistry = new Map();

function normalizeShortcut(event) {
  const parts = [];

  if (event.ctrlKey || event.metaKey) parts.push("ctrl");
  if (event.altKey) parts.push("alt");
  if (event.shiftKey) parts.push("shift");

  let key = event.key.toLowerCase();

  if (key === " ") key = "space";
  if (key === "escape") key = "esc";

  parts.push(key);

  return parts.join("+");
}

function parseShortcut(shortcut) {
  return shortcut
    .toLowerCase()
    .split("+")
    .map((s) => s.trim())
    .sort((a, b) => {
      const modifiers = ["ctrl", "alt", "shift"];
      const aIdx = modifiers.indexOf(a);
      const bIdx = modifiers.indexOf(b);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return 0;
    })
    .join("+");
}

function handleKeyDown(event) {
  const target = event.target;
  if (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.isContentEditable
  ) {
    return;
  }

  const shortcut = normalizeShortcut(event);
  const handler = shortcutRegistry.get(shortcut);

  if (handler) {
    event.preventDefault();
    event.stopPropagation();
    handler(event);
  }
}

let listenerAttached = false;

export function useKeyboardShortcuts(shortcuts) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    if (!listenerAttached) {
      document.addEventListener("keydown", handleKeyDown);
      listenerAttached = true;
    }

    const normalizedShortcuts = [];
    for (const [shortcut, handler] of Object.entries(shortcutsRef.current)) {
      const normalized = parseShortcut(shortcut);
      normalizedShortcuts.push(normalized);
      shortcutRegistry.set(normalized, handler);
    }

    return () => {
      for (const normalized of normalizedShortcuts) {
        shortcutRegistry.delete(normalized);
      }

      if (shortcutRegistry.size === 0 && listenerAttached) {
        document.removeEventListener("keydown", handleKeyDown);
        listenerAttached = false;
      }
    };
  }, [shortcuts]);
}

export function useKeyboardShortcut(shortcut, handler) {
  const shortcuts = useCallback(() => ({ [shortcut]: handler }), [shortcut, handler]);
  useKeyboardShortcuts({ [shortcut]: handler });
}

export default useKeyboardShortcuts;
