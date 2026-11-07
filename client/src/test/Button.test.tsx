import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../components/ui/Button';

describe('Button Component', () => {
  it('renders children correctly', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Submit Goal</Button>);
    fireEvent.click(screen.getByText('Submit Goal'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders loading state and disables button', () => {
    const handleClick = vi.fn();
    render(<Button isLoading onClick={handleClick}>Processing</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies paypal variant styling', () => {
    render(<Button variant="paypal">Authorize with PayPal</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-[#FFC439]');
  });
});
