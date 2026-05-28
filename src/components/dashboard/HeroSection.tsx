import { motion } from 'framer-motion';
import { Workflow, ArrowRight, Zap, Shield, Eye, GitBranch } from 'lucide-react';

interface HeroSectionProps {
  onEnter: () => void;
}

export function HeroSection({ onEnter }: HeroSectionProps) {
  return (
    <div
      className="flex h-full items-center justify-center overflow-hidden relative"
      style={{ backgroundColor: 'var(--ds-bg-app)' }}
    >
      {/* Animated background grid */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(var(--ds-accent-primary) 1px, transparent 1px),
              linear-gradient(90deg, var(--ds-accent-primary) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
        {/* Radial glow */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
          style={{ background: 'radial-gradient(circle, var(--ds-glow-color) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Floating orbs */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${20 + i * 15}px`,
              height: `${20 + i * 15}px`,
              background: `var(--ds-accent-primary)`,
              opacity: 0.06 + i * 0.02,
              top: `${15 + i * 18}%`,
              left: `${10 + i * 20}%`,
            }}
            animate={{
              y: [0, -20, 0],
              x: [0, 10, 0],
            }}
            transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-3xl mx-auto text-center px-8">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center justify-center mb-8"
        >
          <div
            className="rounded-2xl p-5 shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, var(--ds-accent-primary), var(--ds-chart5))',
              boxShadow: '0 20px 60px -15px var(--ds-glow-color)',
            }}
          >
            <Workflow className="h-12 w-12 text-white" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-5xl font-bold tracking-tight mb-4"
          style={{ color: 'var(--ds-text-primary)' }}
        >
          Conductor
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="text-xl mb-3 font-medium"
          style={{ color: 'var(--ds-text-secondary)' }}
        >
          The Workflow Observatory for{' '}
          <span style={{ color: 'var(--ds-accent-primary)' }}>Output.ai</span>
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="text-base max-w-lg mx-auto mb-10 leading-relaxed"
          style={{ color: 'var(--ds-text-muted)' }}
        >
          See every workflow execution, trace, evaluator result, and token cost at a glance.
          Debug AI pipelines with the clarity they deserve.
        </motion.p>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="flex flex-wrap items-center justify-center gap-3 mb-10"
        >
          {[
            { icon: <Eye className="h-3.5 w-3.5" />, label: 'Real-time traces' },
            { icon: <GitBranch className="h-3.5 w-3.5" />, label: 'Step-by-step debugging' },
            { icon: <Zap className="h-3.5 w-3.5" />, label: 'Token & cost tracking' },
            { icon: <Shield className="h-3.5 w-3.5" />, label: 'Evaluator insights' },
          ].map((feature) => (
            <span
              key={feature.label}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border"
              style={{
                backgroundColor: 'var(--ds-accent-subtle)',
                borderColor: 'var(--ds-accent-muted)',
                color: 'var(--ds-text-secondary)',
              }}
            >
              <span style={{ color: 'var(--ds-accent-primary)' }}>{feature.icon}</span>
              {feature.label}
            </span>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          onClick={onEnter}
          className="inline-flex items-center gap-3 rounded-xl px-8 py-4 text-base font-semibold text-white shadow-xl transition-shadow hover:shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, var(--ds-accent-primary), var(--ds-chart5))',
            boxShadow: '0 10px 40px -10px var(--ds-glow-color)',
          }}
        >
          Open Dashboard
          <ArrowRight className="h-5 w-5" />
        </motion.button>

        {/* Attribution */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-8 text-xs"
          style={{ color: 'var(--ds-text-muted)' }}
        >
          Built on the Output.ai framework — durable workflows, multi-provider LLM, full observability
        </motion.p>
      </div>
    </div>
  );
}
