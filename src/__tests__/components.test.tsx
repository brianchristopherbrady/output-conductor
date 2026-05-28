import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge, MetricCard } from '@/components/shared/StatusBadge';

describe('StatusBadge', () => {
  it('renders the status text', () => {
    render(<StatusBadge status="completed" />);
    expect(screen.getByText('completed')).toBeInTheDocument();
  });

  it('renders running status with pulse', () => {
    const { container } = render(<StatusBadge status="running" />);
    expect(screen.getByText('running')).toBeInTheDocument();
  });

  it('renders failed status', () => {
    render(<StatusBadge status="failed" />);
    expect(screen.getByText('failed')).toBeInTheDocument();
  });

  it('renders with md size', () => {
    render(<StatusBadge status="completed" size="md" />);
    const badge = screen.getByText('completed').closest('span');
    expect(badge?.className).toContain('text-sm');
  });
});

describe('MetricCard', () => {
  it('renders label and value', () => {
    render(
      <MetricCard
        label="Total Cost"
        value="$42.50"
        icon={<span data-testid="icon">$</span>}
      />
    );
    expect(screen.getByText('Total Cost')).toBeInTheDocument();
    expect(screen.getByText('$42.50')).toBeInTheDocument();
  });

  it('renders subvalue when provided', () => {
    render(
      <MetricCard
        label="Success Rate"
        value="95.2%"
        subvalue="+2.1% vs last week"
        icon={<span>%</span>}
        trend="up"
      />
    );
    expect(screen.getByText('+2.1% vs last week')).toBeInTheDocument();
  });
});
