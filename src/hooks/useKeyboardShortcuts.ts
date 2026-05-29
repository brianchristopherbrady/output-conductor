import { useEffect, useRef } from 'react';

export interface ShortcutHandlers {
  onNavigateNext?: () => void;
  onNavigatePrev?: () => void;
  onSelect?: () => void;
  onBack?: () => void;
  onToggleLive?: () => void;
  onOpenSettings?: () => void;
  onOpenCommandPalette?: () => void;
  onShowHelp?: () => void;
  onGoToDashboard?: () => void;
  onGoToFlow?: () => void;
  onGoToTimeline?: () => void;
  onGoToTraces?: () => void;
  onGoToDiff?: () => void;
  onGoToInsights?: () => void;
  onGoToShowcase?: () => void;
}

function isTextInputFocused() {
  const activeElement = document.activeElement;

  if (!(activeElement instanceof HTMLElement)) {
    return false;
  }

  const tagName = activeElement.tagName;
  return tagName === 'INPUT' || tagName === 'TEXTAREA' || activeElement.isContentEditable;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTextInputFocused()) {
        return;
      }

      if ((event.ctrlKey || event.metaKey) && !event.altKey) {
        if (event.key.toLowerCase() === 'k') {
          event.preventDefault();
          handlersRef.current.onOpenCommandPalette?.();
        }
        return;
      }

      if (event.altKey) {
        return;
      }

      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

      switch (key) {
        case 'j':
        case 'ArrowDown':
          event.preventDefault();
          handlersRef.current.onNavigateNext?.();
          break;
        case 'k':
        case 'ArrowUp':
          event.preventDefault();
          handlersRef.current.onNavigatePrev?.();
          break;
        case 'Enter':
          event.preventDefault();
          handlersRef.current.onSelect?.();
          break;
        case 'Escape':
          event.preventDefault();
          handlersRef.current.onBack?.();
          break;
        case 'l':
          event.preventDefault();
          handlersRef.current.onToggleLive?.();
          break;
        case 's':
          event.preventDefault();
          handlersRef.current.onOpenSettings?.();
          break;
        case '?':
          event.preventDefault();
          handlersRef.current.onShowHelp?.();
          break;
        case '1':
          event.preventDefault();
          handlersRef.current.onGoToDashboard?.();
          break;
        case '2':
          event.preventDefault();
          handlersRef.current.onGoToFlow?.();
          break;
        case '3':
          event.preventDefault();
          handlersRef.current.onGoToTimeline?.();
          break;
        case '4':
          event.preventDefault();
          handlersRef.current.onGoToTraces?.();
          break;
        case '5':
          event.preventDefault();
          handlersRef.current.onGoToDiff?.();
          break;
        case '6':
          event.preventDefault();
          handlersRef.current.onGoToInsights?.();
          break;
        case '7':
          event.preventDefault();
          handlersRef.current.onGoToShowcase?.();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
