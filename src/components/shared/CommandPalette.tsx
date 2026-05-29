import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  BarChart3,
  Command,
  GitBranch,
  LayoutDashboard,
  type LucideIcon,
  MoonStar,
  Radio,
  Route,
  Search,
  Settings2,
  Workflow,
  BookOpen,
  GitCompare,
} from 'lucide-react';
import { generateExecutions } from '@/data/mock-data';
import type { ViewMode } from '@/types';
import { cn } from '@/utils';

type CommandPaletteAction = 'toggle-theme' | 'toggle-live' | 'settings';

export type CommandAction =
  | { type: 'navigate'; value: ViewMode }
  | { type: 'filter'; value: string }
  | { type: 'action'; value: CommandPaletteAction };

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onAction: (action: CommandAction) => void;
}

type CommandCategory = 'Views' | 'Workflows' | 'Actions';

interface CommandItem {
  id: string;
  label: string;
  subtitle?: string;
  category: CommandCategory;
  action: CommandAction;
  hint: string;
  keywords: string[];
  icon: LucideIcon;
}

const VIEW_ITEMS: CommandItem[] = [
  {
    id: 'view-dashboard',
    label: 'Executions',
    subtitle: 'Overview of workflow executions',
    category: 'Views',
    action: { type: 'navigate', value: 'dashboard' },
    hint: '1',
    keywords: ['executions', 'dashboard', 'overview', 'home'],
    icon: LayoutDashboard,
  },
  {
    id: 'view-flow',
    label: 'States',
    subtitle: 'Inspect workflow states and paths',
    category: 'Views',
    action: { type: 'navigate', value: 'flow' },
    hint: '2',
    keywords: ['states', 'flow', 'graph', 'dag', 'workflow'],
    icon: Route,
  },
  {
    id: 'view-timeline',
    label: 'Timeline',
    subtitle: 'Trace execution chronology',
    category: 'Views',
    action: { type: 'navigate', value: 'timeline' },
    hint: '3',
    keywords: ['timeline', 'history', 'time'],
    icon: GitBranch,
  },
  {
    id: 'view-traces',
    label: 'Traces',
    subtitle: 'Review step-level traces',
    category: 'Views',
    action: { type: 'navigate', value: 'traces' },
    hint: '4',
    keywords: ['traces', 'trace', 'spans', 'steps'],
    icon: Activity,
  },
  {
    id: 'view-diff',
    label: 'Diff',
    subtitle: 'Compare prompt and output changes',
    category: 'Views',
    action: { type: 'navigate', value: 'diff' },
    hint: '5',
    keywords: ['diff', 'compare', 'changes', 'prompt'],
    icon: GitCompare,
  },
  {
    id: 'view-insights',
    label: 'Insights',
    subtitle: 'Evaluations, analytics & cost metrics',
    category: 'Views',
    action: { type: 'navigate', value: 'insights' },
    hint: '6',
    keywords: ['analytics', 'charts', 'metrics', 'reports', 'evals', 'insights'],
    icon: BarChart3,
  },
  {
    id: 'view-showcase',
    label: 'About',
    subtitle: 'Explore the product showcase and overview',
    category: 'Views',
    action: { type: 'navigate', value: 'showcase' },
    hint: '7',
    keywords: ['about', 'showcase', 'overview', 'product'],
    icon: BookOpen,
  },
];

const ACTION_ITEMS: CommandItem[] = [
  {
    id: 'action-toggle-theme',
    label: 'Toggle theme',
    subtitle: 'Switch between light and dark mode',
    category: 'Actions',
    action: { type: 'action', value: 'toggle-theme' },
    hint: 'T',
    keywords: ['theme', 'dark', 'light', 'appearance'],
    icon: MoonStar,
  },
  {
    id: 'action-toggle-live-mode',
    label: 'Toggle live mode',
    subtitle: 'Enable or pause live workflow updates',
    category: 'Actions',
    action: { type: 'action', value: 'toggle-live' },
    hint: 'L',
    keywords: ['live', 'stream', 'realtime', 'auto refresh'],
    icon: Radio,
  },
  {
    id: 'action-open-settings',
    label: 'Open settings',
    subtitle: 'Adjust application preferences',
    category: 'Actions',
    action: { type: 'action', value: 'settings' },
    hint: 'S',
    keywords: ['settings', 'preferences', 'config'],
    icon: Settings2,
  },
];

const CATEGORY_ORDER: CommandCategory[] = ['Views', 'Workflows', 'Actions'];

function fuzzyScore(text: string, query: string): number {
  const normalizedText = text.toLowerCase();
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return 1;
  }

  return normalizedQuery
    .split(/\s+/)
    .filter(Boolean)
    .reduce((total, token) => {
      if (normalizedText === token) return total + 120;
      if (normalizedText.startsWith(token)) return total + 90;

      const includesIndex = normalizedText.indexOf(token);
      if (includesIndex >= 0) return total + Math.max(55 - includesIndex, 25);

      let cursor = -1;
      let gapPenalty = 0;

      for (const char of token) {
        const nextIndex = normalizedText.indexOf(char, cursor + 1);
        if (nextIndex === -1) return 0;
        if (cursor >= 0) {
          gapPenalty += nextIndex - cursor - 1;
        }
        cursor = nextIndex;
      }

      return total + Math.max(40 - gapPenalty, 10);
    }, 0);
}

function getShortcutLabel(): string {
  return navigator.platform.toLowerCase().includes('mac') ? '⌘K' : 'Ctrl K';
}

export function CommandPalette({ open, onClose, onAction }: CommandPaletteProps) {
  const [shortcutOpen, setShortcutOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const isOpen = open || shortcutOpen;
  const shortcutLabel = useMemo(() => getShortcutLabel(), []);

  const executions = useMemo(() => generateExecutions(300), []);

  const workflowItems = useMemo<CommandItem[]>(() => {
    const workflowNames = [...new Set(executions.map((execution) => execution.workflowName))].sort();
    const workflowCommands = workflowNames.map((workflowName) => ({
      id: `workflow-${workflowName}`,
      label: workflowName,
      subtitle: 'Filter by workflow name',
      category: 'Workflows' as const,
      action: { type: 'filter' as const, value: workflowName },
      hint: '↵ Filter',
      keywords: [workflowName, 'workflow', 'filter'],
      icon: Workflow,
    }));

    const executionCommands = executions.slice(0, 80).map((execution) => ({
      id: `execution-${execution.id}`,
      label: execution.id,
      subtitle: `Execution • ${execution.workflowName}`,
      category: 'Workflows' as const,
      action: { type: 'filter' as const, value: execution.id },
      hint: '↵ Filter',
      keywords: [execution.id, execution.workflowName, 'execution', 'run', 'trace'],
      icon: Command,
    }));

    return [...workflowCommands, ...executionCommands];
  }, [executions]);

  const allItems = useMemo(() => [...VIEW_ITEMS, ...workflowItems, ...ACTION_ITEMS], [workflowItems]);

  const filteredItems = useMemo(() => {
    const scored = allItems
      .map((item, index) => {
        const score = fuzzyScore([item.label, item.subtitle, ...item.keywords].filter(Boolean).join(' '), query);
        return { item, score, index };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.index - b.index;
      })
      .map(({ item }) => item);

    return scored;
  }, [allItems, query]);

  const groupedItems = useMemo(() => {
    return CATEGORY_ORDER.map((category) => ({
      category,
      items: filteredItems.filter((item) => item.category === category),
    })).filter((group) => group.items.length > 0);
  }, [filteredItems]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const isOpenShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
      if (isOpenShortcut) {
        event.preventDefault();
        if (isOpen) {
          setShortcutOpen(false);
          onClose();
        } else {
          setShortcutOpen(true);
        }
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        setShortcutOpen(false);
        onClose();
        return;
      }

      if (!filteredItems.length) return;

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex((current) => (current + 1) % filteredItems.length);
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex((current) => (current - 1 + filteredItems.length) % filteredItems.length);
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        const item = filteredItems[selectedIndex];
        if (!item) return;
        onAction(item.action);
        setShortcutOpen(false);
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredItems, isOpen, onAction, onClose, selectedIndex]);

  useEffect(() => {
    const handleGlobalOpen = (event: KeyboardEvent) => {
      const isOpenShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
      if (!isOpenShortcut || isOpen) return;
      event.preventDefault();
      setShortcutOpen(true);
    };

    window.addEventListener('keydown', handleGlobalOpen);
    return () => window.removeEventListener('keydown', handleGlobalOpen);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSelectedIndex(0);
      itemRefs.current = [];
      return;
    }

    const timeout = window.setTimeout(() => inputRef.current?.focus(), 30);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.clearTimeout(timeout);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!filteredItems.length) {
      setSelectedIndex(0);
      return;
    }

    if (selectedIndex >= filteredItems.length) {
      setSelectedIndex(filteredItems.length - 1);
      return;
    }

    itemRefs.current[selectedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [filteredItems, selectedIndex]);

  const handleClose = () => {
    setShortcutOpen(false);
    onClose();
  };

  const handleSelect = (item: CommandItem) => {
    onAction(item.action);
    handleClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-start justify-center px-4 py-12 sm:px-6"
          style={{ backgroundColor: 'var(--ds-bg-overlay, rgba(0, 0, 0, 0.72))' }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleClose();
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -8 }}
            transition={{ type: 'spring', duration: 0.24, bounce: 0 }}
            className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl border shadow-2xl backdrop-blur-2xl"
            style={{
              borderColor: 'var(--ds-border-primary)',
              background: 'color-mix(in srgb, var(--ds-bg-secondary) 82%, transparent)',
              boxShadow: '0 24px 64px var(--ds-shadow-color, rgba(0, 0, 0, 0.35))',
            }}
          >
            <div
              className="border-b px-5 py-4"
              style={{
                borderColor: 'var(--ds-border-secondary, var(--ds-border-primary))',
                background: 'linear-gradient(180deg, color-mix(in srgb, var(--ds-bg-elevated, var(--ds-bg-secondary)) 88%, transparent), transparent)',
              }}
            >
              <div className="flex items-center gap-3 rounded-2xl border px-4 py-3 backdrop-blur-xl"
                style={{
                  borderColor: 'var(--ds-input-border, var(--ds-border-primary))',
                  backgroundColor: 'color-mix(in srgb, var(--ds-input-bg, var(--ds-bg-primary)) 76%, transparent)',
                }}
              >
                <Search className="h-4 w-4 shrink-0" style={{ color: 'var(--ds-text-muted)' }} />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search views, workflows, or execution IDs..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-current"
                  style={{ color: 'var(--ds-text-primary)' }}
                />
                <kbd
                  className="hidden rounded-md border px-2 py-1 text-[10px] font-semibold tracking-wide sm:inline-flex"
                  style={{
                    borderColor: 'var(--ds-border-primary)',
                    color: 'var(--ds-text-tertiary)',
                    backgroundColor: 'color-mix(in srgb, var(--ds-bg-tertiary) 65%, transparent)',
                  }}
                >
                  {shortcutLabel}
                </kbd>
              </div>
            </div>

            <div className="max-h-[min(70vh,36rem)] overflow-y-auto px-3 py-3">
              {groupedItems.length > 0 ? (
                groupedItems.map((group) => (
                  <div key={group.category} className="mb-4 last:mb-0">
                    <div
                      className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.24em]"
                      style={{ color: 'var(--ds-text-muted)' }}
                    >
                      {group.category}
                    </div>
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const globalIndex = filteredItems.findIndex((entry) => entry.id === item.id);
                        const isSelected = globalIndex === selectedIndex;
                        const Icon = item.icon;

                        return (
                          <button
                            key={item.id}
                            ref={(element) => {
                              itemRefs.current[globalIndex] = element;
                            }}
                            type="button"
                            onClick={() => handleSelect(item)}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            className={cn(
                              'flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all',
                              isSelected && 'shadow-lg',
                            )}
                            style={{
                              borderColor: isSelected ? 'var(--ds-border-focus, var(--ds-border-primary))' : 'transparent',
                              backgroundColor: isSelected
                                ? 'color-mix(in srgb, var(--ds-accent-subtle, var(--ds-bg-tertiary)) 100%, transparent)'
                                : 'transparent',
                            }}
                          >
                            <div
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                              style={{
                                borderColor: isSelected ? 'var(--ds-border-focus, var(--ds-border-primary))' : 'var(--ds-border-primary)',
                                backgroundColor: isSelected
                                  ? 'color-mix(in srgb, var(--ds-accent-muted, var(--ds-bg-tertiary)) 100%, transparent)'
                                  : 'color-mix(in srgb, var(--ds-bg-tertiary) 72%, transparent)',
                                color: isSelected ? 'var(--ds-text-primary)' : 'var(--ds-text-secondary)',
                              }}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium" style={{ color: 'var(--ds-text-primary)' }}>
                                {item.label}
                              </div>
                              {item.subtitle && (
                                <div className="truncate text-xs" style={{ color: 'var(--ds-text-tertiary)' }}>
                                  {item.subtitle}
                                </div>
                              )}
                            </div>
                            <kbd
                              className="rounded-lg border px-2 py-1 text-[10px] font-semibold tracking-wide"
                              style={{
                                borderColor: 'var(--ds-border-primary)',
                                color: 'var(--ds-text-muted)',
                                backgroundColor: 'color-mix(in srgb, var(--ds-bg-tertiary) 72%, transparent)',
                              }}
                            >
                              {item.hint}
                            </kbd>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                  <div
                    className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border"
                    style={{
                      borderColor: 'var(--ds-border-primary)',
                      backgroundColor: 'color-mix(in srgb, var(--ds-bg-tertiary) 72%, transparent)',
                    }}
                  >
                    <Search className="h-5 w-5" style={{ color: 'var(--ds-text-muted)' }} />
                  </div>
                  <div className="text-sm font-medium" style={{ color: 'var(--ds-text-primary)' }}>
                    No results found
                  </div>
                  <div className="mt-1 text-xs" style={{ color: 'var(--ds-text-tertiary)' }}>
                    Try searching by view name, workflow, or execution ID.
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default CommandPalette;
