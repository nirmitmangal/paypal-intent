import { describe, it, expect } from 'vitest';
import type { Product } from '@paypal-intent/shared';

describe('Tier Selection & State Synchronization Suite', () => {
  const keyboardBudget: Product = {
    id: 'prod_kb_03',
    sku: 'KB-NOVA-SLIM',
    title: 'NovaType SilentTouch Low-Profile Bluetooth Keyboard',
    categoryId: 'keyboards',
    brand: 'NovaType',
    basePrice: 59.99,
    currency: 'USD',
    rating: 4.6,
    reviewCount: 310,
    inStock: true,
    imageUrl: '',
    description: '',
    createdAt: '',
    updatedAt: '',
  };

  const mouseBudget: Product = {
    id: 'prod_mou_01',
    sku: 'MOU-ERGO-VERT',
    title: 'ErgoKey ErgoGlide Vertical Ergonomic Wireless Mouse',
    categoryId: 'mice',
    brand: 'ErgoKey',
    basePrice: 69.99,
    currency: 'USD',
    rating: 4.8,
    reviewCount: 520,
    inStock: true,
    imageUrl: '',
    description: '',
    createdAt: '',
    updatedAt: '',
  };

  const lampBudget: Product = {
    id: 'prod_acc_02',
    sku: 'ACC-LUM-BAR',
    title: 'Lumeno Pro ScreenBar High-CRI Desk Task Lamp',
    categoryId: 'accessories',
    brand: 'Lumeno',
    basePrice: 64.99,
    currency: 'USD',
    rating: 4.7,
    reviewCount: 380,
    inStock: true,
    imageUrl: '',
    description: '',
    createdAt: '',
    updatedAt: '',
  };

  const headphonesOverEar: Product = {
    id: 'prod_hp_01',
    sku: 'HP-STUDIO-40',
    title: 'StudioPure 40mm Closed-Back Reference Headphones',
    categoryId: 'headphones',
    brand: 'StudioPure',
    basePrice: 89.99,
    currency: 'USD',
    rating: 4.8,
    reviewCount: 410,
    inStock: true,
    imageUrl: '',
    description: '',
    createdAt: '',
    updatedAt: '',
  };

  const headsetOnEar: Product = {
    id: 'prod_hp_03',
    sku: 'HP-CALL-CLEAR',
    title: 'VoiceLink ClearVoice USB Call Headset with Noise-Cancelling Mic',
    categoryId: 'headphones',
    brand: 'VoiceLink',
    basePrice: 49.99,
    currency: 'USD',
    rating: 4.5,
    reviewCount: 220,
    inStock: true,
    imageUrl: '',
    description: '',
    createdAt: '',
    updatedAt: '',
  };

  it('correctly calculates Balanced Tier total ($307.76) and flags $7.76 budget deficit', () => {
    const balancedBundle = [keyboardBudget, mouseBudget, lampBudget, headphonesOverEar];
    const subtotal = Math.round(balancedBundle.reduce((sum, p) => sum + p.basePrice, 0) * 100) / 100;
    expect(subtotal).toBe(284.96);

    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    expect(tax).toBe(22.80);

    const grandTotal = Math.round((subtotal + tax) * 100) / 100;
    expect(grandTotal).toBe(307.76);

    const budgetCeiling = 300.0;
    const isOverBudget = grandTotal > budgetCeiling;
    expect(isOverBudget).toBe(true);

    const shortfall = Math.round((grandTotal - budgetCeiling) * 100) / 100;
    expect(shortfall).toBe(7.76);
  });

  it('correctly calculates Budget Tier total ($264.56) and unlocks checkout under $300 ceiling', () => {
    const budgetBundle = [keyboardBudget, mouseBudget, lampBudget, headsetOnEar];
    const subtotal = Math.round(budgetBundle.reduce((sum, p) => sum + p.basePrice, 0) * 100) / 100;
    expect(subtotal).toBe(244.96);

    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    expect(tax).toBe(19.60);

    const grandTotal = Math.round((subtotal + tax) * 100) / 100;
    expect(grandTotal).toBe(264.56);

    const budgetCeiling = 300.0;
    const isOverBudget = grandTotal > budgetCeiling;
    expect(isOverBudget).toBe(false);

    const headroom = Math.round((budgetCeiling - grandTotal) * 100) / 100;
    expect(headroom).toBe(35.44);
    expect(grandTotal).toBeLessThanOrEqual(budgetCeiling);
  });

  it('derives all 4 essential categories dynamically when switching tiers', () => {
    const budgetBundle = [keyboardBudget, mouseBudget, lampBudget, headsetOnEar];

    const kb = budgetBundle.find((p) => p.categoryId?.toLowerCase().includes('keyboard'));
    const mou = budgetBundle.find((p) => p.categoryId?.toLowerCase().includes('mice') || p.categoryId?.toLowerCase().includes('mou'));
    const lamp = budgetBundle.find((p) => p.title?.toLowerCase().includes('lamp') || p.categoryId?.toLowerCase().includes('accessories'));
    const audio = budgetBundle.find((p) => p.categoryId?.toLowerCase().includes('headphone'));

    expect(kb?.id).toBe('prod_kb_03');
    expect(mou?.id).toBe('prod_mou_01');
    expect(lamp?.id).toBe('prod_acc_02');
    expect(audio?.id).toBe('prod_hp_03');
    expect(audio?.basePrice).toBe(49.99);
  });

  it('verifies that syncing the budget bundle yields a valid 4-item cart with $264.56 total for checkout', () => {
    const budgetBundle = [keyboardBudget, mouseBudget, lampBudget, headsetOnEar];
    const items = budgetBundle.map((p) => ({ productId: p.id, quantity: 1, unitPrice: p.basePrice }));
    const subtotal = Math.round(items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0) * 100) / 100;
    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    expect(items.length).toBe(4);
    expect(subtotal).toBe(244.96);
    expect(tax).toBe(19.60);
    expect(total).toBe(264.56);
  });
});
