/**
 * Safe Monetary Arithmetic Utility
 * Enforces integer minor units (cents) for all financial calculations
 * to eliminate IEEE 754 floating-point drift and rounding errors.
 */

export const Money = {
  /**
   * Convert a floating-point dollar amount to integer minor units (cents).
   * E.g. 129.99 -> 12999
   */
  toCents(amount: number): number {
    return Math.round(amount * 100);
  },

  /**
   * Convert integer minor units (cents) to floating-point dollar amount.
   * E.g. 12999 -> 129.99
   */
  fromCents(cents: number): number {
    return Math.round(cents) / 100;
  },

  /**
   * Safe addition of multiple dollar amounts in minor units.
   */
  add(...amounts: number[]): number {
    const totalCents = amounts.reduce((acc, curr) => acc + Money.toCents(curr), 0);
    return Money.fromCents(totalCents);
  },

  /**
   * Multiply unit price by quantity in minor units.
   */
  multiply(unitPrice: number, quantity: number): number {
    const priceCents = Money.toCents(unitPrice);
    const totalCents = priceCents * Math.max(0, Math.floor(quantity));
    return Money.fromCents(totalCents);
  },

  /**
   * Calculate sales tax in minor units given subtotal and rate (default 8%).
   */
  calculateTax(subtotal: number, taxRate = 0.08): number {
    const subtotalCents = Money.toCents(subtotal);
    const taxCents = Math.round(subtotalCents * taxRate);
    return Money.fromCents(taxCents);
  },

  /**
   * Calculate percentage discount in minor units.
   */
  calculateDiscount(subtotal: number, discountPercent: number): number {
    const subtotalCents = Money.toCents(subtotal);
    const discountCents = Math.round(subtotalCents * (discountPercent / 100));
    return Money.fromCents(discountCents);
  },

  /**
   * Compute complete order breakdown using safe integer minor units.
   */
  calculateTotals(
    lineItems: Array<{ price: number; quantity: number }>,
    taxRate = 0.08,
    shippingFee = 0.0
  ): {
    subtotal: number;
    subtotalCents: number;
    tax: number;
    taxCents: number;
    shipping: number;
    shippingCents: number;
    total: number;
    totalCents: number;
  } {
    let subtotalCents = 0;
    for (const item of lineItems) {
      subtotalCents += Money.toCents(item.price) * Math.max(0, Math.floor(item.quantity));
    }

    const taxCents = Math.round(subtotalCents * taxRate);
    const shippingCents = Money.toCents(shippingFee);
    const totalCents = subtotalCents + taxCents + shippingCents;

    return {
      subtotal: Money.fromCents(subtotalCents),
      subtotalCents,
      tax: Money.fromCents(taxCents),
      taxCents,
      shipping: Money.fromCents(shippingCents),
      shippingCents,
      total: Money.fromCents(totalCents),
      totalCents,
    };
  },
};
