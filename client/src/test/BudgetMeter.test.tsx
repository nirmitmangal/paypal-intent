import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BudgetMeter } from '../components/ui/BudgetMeter';

describe('BudgetMeter Component', () => {
  it('displays correct headroom when under budget', () => {
    render(<BudgetMeter currentTotal={319.96} budgetCeiling={350.0} />);
    expect(screen.getByText(/headroom remaining/i)).toBeInTheDocument();
    expect(screen.getByText(/\$30\.04/i)).toBeInTheDocument();
  });

  it('displays deficit warning when over budget', () => {
    render(<BudgetMeter currentTotal={410.0} budgetCeiling={350.0} />);
    expect(screen.getByText(/Over ceiling/i)).toBeInTheDocument();
    expect(screen.getByText(/\$60\.00/i)).toBeInTheDocument();
  });

  it('renders progress bar percentage correctly', () => {
    const { container } = render(<BudgetMeter currentTotal={175.0} budgetCeiling={350.0} />);
    const bar = container.querySelector('.rounded-full.transition-all') as HTMLElement;
    expect(bar.style.width).toBe('50%');
  });
});
