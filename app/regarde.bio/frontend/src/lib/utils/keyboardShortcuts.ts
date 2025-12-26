import { useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

export interface ShortcutHandler {
  shortcut: KeyboardShortcut;
  handler: () => void;
  enabled?: boolean;
  description?: string;
}

/**
 * Checks if a keyboard event matches a shortcut definition
 */
export function matchesShortcut(
  event: KeyboardEvent | React.KeyboardEvent,
  shortcut: KeyboardShortcut,
): boolean {
  return (
    event.key === shortcut.key &&
    !!event.metaKey === !!shortcut.metaKey &&
    !!event.ctrlKey === !!shortcut.ctrlKey &&
    !!event.altKey === !!shortcut.altKey &&
    !!event.shiftKey === !!shortcut.shiftKey
  );
}

/**
 * Creates a keyboard event handler for multiple shortcuts
 */
export function createKeyboardHandler(handlers: ShortcutHandler[]) {
  return (event: KeyboardEvent | React.KeyboardEvent) => {
    for (const { shortcut, handler, enabled = true } of handlers) {
      if (enabled && matchesShortcut(event, shortcut)) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        if (shortcut.stopPropagation) {
          event.stopPropagation();
        }
        handler();
        break;
      }
    }
  };
}

/**
 * Hook for managing keyboard shortcuts
 */
export function useKeyboardShortcuts(handlers: ShortcutHandler[]) {
  const handleKeyDown = useCallback(createKeyboardHandler(handlers), [
    handlers,
  ]);

  return handleKeyDown;
}

/**
 * Common keyboard shortcuts for form inputs
 */
export const COMMON_SHORTCUTS = {
  SUBMIT: { key: 'Enter', metaKey: true } as KeyboardShortcut,
  SUBMIT_ALT: { key: 'Enter', ctrlKey: true } as KeyboardShortcut,
  VIEW: { key: 'Enter', altKey: true } as KeyboardShortcut,
  ESCAPE: { key: 'Escape' } as KeyboardShortcut,
  SAVE: { key: 's', metaKey: true } as KeyboardShortcut,
} as const;

/**
 * Formats shortcut for display (tooltips, help text)
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.metaKey) parts.push('Cmd');
  if (shortcut.ctrlKey) parts.push('Ctrl');
  if (shortcut.altKey) parts.push('Alt');
  if (shortcut.shiftKey) parts.push('Shift');

  parts.push(shortcut.key === ' ' ? 'Space' : shortcut.key);

  return parts.join('+');
}
