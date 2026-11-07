import { describe, it, expect } from 'vitest';
import { formatCurrency } from '../lib/utils';

describe('Cart Financial Math & Formatting', () => {
  it('formats currency correctly in USD', () => {
    expect(formatCurrency(349.99)).toBe('$349.99');
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('accurately calculates 8% tax and grand totals', () => {
    const items = [
      { price: 129.99, qty: 1 },
      { price: 69.99, qty: 1 },
      { price: 89.99, qty: 1 },
      { price: 29.99, qty: 1 },
    ];

    const subtotal = Math.round(items.reduce((acc, i) => acc + i.price * i.qty, 0) * 100) / 100;
    expect(subtotal).toBe(319.96);

    const estimatedTax = Math.round(subtotal * 0.08 * 100) / 100;
    expect(estimatedTax).toBe(25.6);

    const grandTotal = Math.round((subtotal + estimatedTax) * 100) / 100;
    expect(grandTotal).toBe(345.56);

    const budgetCeiling = 350.0;
    const savings = Math.round((budgetCeiling - grandTotal) * 100) / 100;
    expect(savings).toBe(4.44);
    expect(grandTotal).toBeLessThanOrEqual(budgetCeiling);
  });
});
