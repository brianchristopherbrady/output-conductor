import { motion } from 'framer-motion';
import { Sun, Moon, Monitor, Minus, AlignCenter, Maximize2, X, Palette, Ruler } from 'lucide-react';
import { useDesignSystem, type ThemeMode, type DensityMode } from '@/design-system';
import { cn } from '@/utils';

interface SettingsPanelProps {
  onClose: () => void;
}

const THEME_OPTIONS: { id: ThemeMode; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'light', label: 'Light', icon: <Sun className="h-5 w-5" />, description: 'Clean, bright interface for well-lit environments' },
  { id: 'dark', label: 'Dark', icon: <Moon className="h-5 w-5" />, description: 'Easy on the eyes for extended sessions' },
];

const DENSITY_OPTIONS: { id: DensityMode; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'compact', label: 'Compact', icon: <Minus className="h-5 w-5" />, description: 'Maximum information density — see more at a glance' },
  { id: 'comfortable', label: 'Comfortable', icon: <AlignCenter className="h-5 w-5" />, description: 'Balanced spacing for everyday use' },
  { id: 'spacious', label: 'Spacious', icon: <Maximize2 className="h-5 w-5" />, description: 'Generous whitespace for focused reading' },
];

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { theme, density, setTheme, setDensity } = useDesignSystem();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'var(--ds-bg-overlay)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden"
        style={{
          backgroundColor: 'var(--ds-bg-elevated)',
          borderColor: 'var(--ds-border-primary)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'var(--ds-border-secondary)' }}
        >
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--ds-text-primary)' }}>
              Appearance Settings
            </h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--ds-text-muted)' }}>
              Customize how Conductor looks and feels
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:opacity-80"
            style={{ backgroundColor: 'var(--ds-bg-hover)' }}
          >
            <X className="h-5 w-5" style={{ color: 'var(--ds-text-tertiary)' }} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-8">
          {/* Theme Section */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Palette className="h-4 w-4" style={{ color: 'var(--ds-accent-primary)' }} />
              <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--ds-text-secondary)' }}>
                Theme
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {THEME_OPTIONS.map(option => (
                <button
                  key={option.id}
                  onClick={() => setTheme(option.id)}
                  className={cn(
                    'group relative flex flex-col items-start rounded-xl border-2 p-4 text-left transition-all',
                    theme === option.id ? 'ring-2' : 'hover:opacity-90',
                  )}
                  style={{
                    borderColor: theme === option.id ? 'var(--ds-accent-primary)' : 'var(--ds-border-primary)',
                    backgroundColor: theme === option.id ? 'var(--ds-accent-subtle)' : 'var(--ds-bg-secondary)',
                    ...(theme === option.id ? { '--tw-ring-color': 'var(--ds-accent-muted)' } as React.CSSProperties : {}),
                  }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="rounded-lg p-2"
                      style={{
                        backgroundColor: theme === option.id ? 'var(--ds-accent-muted)' : 'var(--ds-bg-tertiary)',
                        color: theme === option.id ? 'var(--ds-accent-primary)' : 'var(--ds-text-tertiary)',
                      }}
                    >
                      {option.icon}
                    </div>
                    <span className="font-medium" style={{ color: 'var(--ds-text-primary)' }}>
                      {option.label}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--ds-text-muted)' }}>
                    {option.description}
                  </p>
                  {theme === option.id && (
                    <motion.div
                      layoutId="theme-indicator"
                      className="absolute top-3 right-3 h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: 'var(--ds-accent-primary)' }}
                    />
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Density Section */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Ruler className="h-4 w-4" style={{ color: 'var(--ds-accent-primary)' }} />
              <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--ds-text-secondary)' }}>
                Density
              </h3>
            </div>
            <div className="space-y-2">
              {DENSITY_OPTIONS.map(option => (
                <button
                  key={option.id}
                  onClick={() => setDensity(option.id)}
                  className={cn(
                    'w-full flex items-center gap-4 rounded-xl border-2 px-4 py-3 text-left transition-all',
                    density === option.id ? 'ring-2' : 'hover:opacity-90',
                  )}
                  style={{
                    borderColor: density === option.id ? 'var(--ds-accent-primary)' : 'var(--ds-border-primary)',
                    backgroundColor: density === option.id ? 'var(--ds-accent-subtle)' : 'var(--ds-bg-secondary)',
                    ...(density === option.id ? { '--tw-ring-color': 'var(--ds-accent-muted)' } as React.CSSProperties : {}),
                  }}
                >
                  <div
                    className="rounded-lg p-2 shrink-0"
                    style={{
                      backgroundColor: density === option.id ? 'var(--ds-accent-muted)' : 'var(--ds-bg-tertiary)',
                      color: density === option.id ? 'var(--ds-accent-primary)' : 'var(--ds-text-tertiary)',
                    }}
                  >
                    {option.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm" style={{ color: 'var(--ds-text-primary)' }}>
                      {option.label}
                    </span>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--ds-text-muted)' }}>
                      {option.description}
                    </p>
                  </div>
                  {density === option.id && (
                    <div
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: 'var(--ds-accent-primary)' }}
                    />
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Preview hint */}
          <div
            className="rounded-xl p-4 text-center"
            style={{ backgroundColor: 'var(--ds-bg-secondary)', borderColor: 'var(--ds-border-secondary)' }}
          >
            <p className="text-sm" style={{ color: 'var(--ds-text-tertiary)' }}>
              Changes apply instantly across the entire interface.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
