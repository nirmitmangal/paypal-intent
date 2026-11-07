import { describe, it, expect } from 'vitest';
import { Money } from '../src/utils/money';

describe('Safe Monetary Calculations (Integer Minor Units)', () => {
  it('accurately converts floating dollars to minor units (cents) and back', () => {
    expect(Money.toCents(129.99)).toBe(12999);
    expect(Money.toCents(0.01)).toBe(1);
    expect(Money.toCents(100.0)).toBe(10000);
    expect(Money.toCents(3.456)).toBe(346); // Half-up rounding

    expect(Money.fromCents(12999)).toBe(129.99);
    expect(Money.fromCents(1)).toBe(0.01);
    expect(Money.fromCents(10000)).toBe(100.0);
  });

  it('eliminates IEEE 754 floating point addition anomalies', () => {
    // Standard JS: 0.1 + 0.2 === 0.30000000000000004
    const naiveSum = 0.1 + 0.2;
    expect(naiveSum).not.toBe(0.3);

    // Money utility: perfectly exact
    const safeSum = Money.add(0.1, 0.2);
    expect(safeSum).toBe(0.3);
  });

  it('accurately calculates sales tax in integer cents without drift', () => {
    // $129.99 * 0.08 = 10.3992 -> $10.40
    expect(Money.calculateTax(129.99, 0.08)).toBe(10.4);

    // $319.96 * 0.08 = 25.5968 -> $25.60
    expect(Money.calculateTax(319.96, 0.08)).toBe(25.6);
  });

  it('accurately calculates percentage discounts in integer cents', () => {
    // 10% off $319.96 = 31.996 -> $32.00
    expect(Money.calculateDiscount(319.96, 10)).toBe(32.0);

    // 15% off $129.99 = 19.4985 -> $19.50
    expect(Money.calculateDiscount(129.99, 15)).toBe(19.5);
  });

  it('calculates comprehensive order totals in minor units', () => {
    const items = [
      { price: 129.99, quantity: 2 }, // $259.98 -> 25998 cents
      { price: 69.99, quantity: 1 },  // $69.99  -> 6999 cents
      { price: 29.99, quantity: 3 },  // $89.97  -> 8997 cents
    ];

    // Subtotal: 259.98 + 69.99 + 89.97 = 419.94 (41994 cents)
    // Tax (8%): 41994 * 0.08 = 3359.52 -> 3360 cents ($33.60)
    // Shipping: $0.00
    // Total: 41994 + 3360 = 45354 cents ($453.54)
    const result = Money.calculateTotals(items, 0.08, 0.0);

    expect(result.subtotal).toBe(419.94);
    expect(result.subtotalCents).toBe(41994);
    expect(result.tax).toBe(33.6);
    expect(result.taxCents).toBe(3360);
    expect(result.shipping).toBe(0.0);
    expect(result.shippingCents).toBe(0);
    expect(result.total).toBe(453.54);
    expect(result.totalCents).toBe(45354);
  });
});
