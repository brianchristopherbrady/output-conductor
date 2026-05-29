import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

interface ShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
}

interface ShortcutSection {
  title: string;
  className?: string;
  items: ShortcutItem[];
}

const SHORTCUT_SECTIONS: ShortcutSection[] = [
  {
    title: 'Navigation',
    items: [
      { keys: ['J', '↓'], description: 'Navigate to the next item' },
      { keys: ['K', '↑'], description: 'Navigate to the previous item' },
      { keys: ['1'], description: 'Go to Executions' },
      { keys: ['2'], description: 'Go to States' },
      { keys: ['3'], description: 'Go to Timeline' },
      { keys: ['4'], description: 'Go to Traces' },
      { keys: ['5'], description: 'Go to Diff' },
      { keys: ['6'], description: 'Go to Insights' },
      { keys: ['7'], description: 'Go to About' },
      { keys: ['Enter'], description: 'Select the current item' },
      { keys: ['Esc'], description: 'Go back or close the current view' },
    ],
  },
  {
    title: 'Actions',
    items: [
      { keys: ['L'], description: 'Toggle live mode' },
      { keys: ['S'], description: 'Open settings' },
      { keys: ['Ctrl', 'K'], description: 'Open command palette' },
      { keys: ['⌘', 'K'], description: 'Open command palette on macOS' },
    ],
  },
  {
    title: 'Help',
    className: 'sm:col-span-2',
    items: [
      { keys: ['?'], description: 'Show this shortcuts dialog' },
    ],
  },
];

function ShortcutKey({ label }: { label: string }) {
  return (
    <span
      className="inline-flex min-w-8 items-center justify-center rounded-md border px-2 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide"
      style={{
        borderColor: 'var(--ds-border-primary)',
        backgroundColor: 'var(--ds-bg-tertiary)',
        color: 'var(--ds-text-primary)',
        boxShadow: 'inset 0 -1px 0 rgba(255, 255, 255, 0.05), 0 1px 2px rgba(0, 0, 0, 0.18)',
      }}
    >
      {label}
    </span>
  );
}

export function ShortcutsHelp({ open, onClose }: ShortcutsHelpProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--ds-bg-secondary) 52%, transparent)',
            backdropFilter: 'blur(18px)',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.16 }}
            className="w-full max-w-[500px] rounded-3xl border p-6 shadow-2xl"
            style={{
              borderColor: 'var(--ds-border-primary)',
              backgroundColor: 'color-mix(in srgb, var(--ds-bg-secondary) 88%, transparent)',
              color: 'var(--ds-text-primary)',
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: 'var(--ds-text-muted)' }}>
                  Keyboard shortcuts
                </p>
                <h2 className="mt-2 text-2xl font-semibold">Quick commands</h2>
                <p className="mt-2 text-sm leading-6" style={{ color: 'var(--ds-text-muted)' }}>
                  Navigate the app and trigger common actions without leaving the keyboard.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border p-2 transition-opacity hover:opacity-80"
                style={{
                  borderColor: 'var(--ds-border-primary)',
                  backgroundColor: 'var(--ds-bg-tertiary)',
                  color: 'var(--ds-text-muted)',
                }}
                aria-label="Close keyboard shortcuts help"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {SHORTCUT_SECTIONS.map((section) => (
                <section
                  key={section.title}
                  className={section.className}
                  style={{
                    border: '1px solid var(--ds-border-primary)',
                    backgroundColor: 'var(--ds-bg-secondary)',
                    borderRadius: '1rem',
                    padding: '1rem',
                  }}
                >
                  <h3
                    className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em]"
                    style={{ color: 'var(--ds-text-muted)' }}
                  >
                    {section.title}
                  </h3>
                  <div className="space-y-3">
                    {section.items.map((item) => (
                      <div key={`${section.title}-${item.description}`} className="flex items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {item.keys.map((keyLabel) => (
                            <ShortcutKey key={`${item.description}-${keyLabel}`} label={keyLabel} />
                          ))}
                        </div>
                        <span className="text-right text-sm leading-5" style={{ color: 'var(--ds-text-primary)' }}>
                          {item.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
