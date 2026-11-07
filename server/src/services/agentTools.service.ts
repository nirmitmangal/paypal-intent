import { z } from 'zod';
import { catalogService } from './catalog.service';
import { cartService } from './cart.service';
import { productRepository } from '../db/repository';
import { Money } from '../utils/money';
import { logger } from '../utils/logger';
import type {
  AgentToolName,
  AgentToolResult,
  Product,
} from '@paypal-intent/shared';

// ============================================================================
// Tool Input Schemas (Strictly Validated with Zod)
// ============================================================================

export const searchProductsSchema = z.object({
  query: z.string().optional(),
  categoryId: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  inStockOnly: z.boolean().optional().default(true),
  limit: z.number().min(1).max(50).optional().default(10),
});

export const getProductDetailsSchema = z.object({
  productId: z.string().min(1, 'productId is required'),
});

export const compareProductsSchema = z.object({
  productIds: z
    .array(z.string().min(1))
    .min(2, 'Must provide at least 2 product IDs to compare')
    .max(4, 'Can compare at most 4 products simultaneously'),
});

export const calculateBudgetSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).default(1),
      })
    )
    .min(1, 'At least one item is required to calculate budget'),
  taxRate: z.number().min(0).max(0.5).optional().default(0.08),
  shippingFee: z.number().min(0).optional().default(0.0),
});

export const evaluateCompatibilitySchema = z.object({
  productIds: z.array(z.string().min(1)).min(1),
  intentRequirements: z.array(z.string()).optional(),
});

export const createOrGetCartSchema = z.object({
  sessionId: z.string().min(1),
  intentSessionId: z.string().min(1),
});

export const modifyCartSchema = z.object({
  cartId: z.string().min(1),
  action: z.enum(['add', 'remove', 'update_quantity', 'clear']),
  productId: z.string().optional(),
  itemId: z.string().optional(),
  quantity: z.number().int().min(1).optional(),
});

// ============================================================================
// Tool Implementation Registry
// ============================================================================

export const agentToolsService = {
  /**
   * Tool 1: Product Search
   */
  searchProducts: (params: z.input<typeof searchProductsSchema>) => {
    const validated = searchProductsSchema.parse(params);
    const products = catalogService.listProducts({
      query: validated.query,
      categoryId: validated.categoryId,
      minPrice: validated.minPrice,
      maxPrice: validated.maxPrice,
      inStockOnly: validated.inStockOnly,
      limit: validated.limit,
    });

    return {
      count: products.length,
      products: products.map((p) => ({
        id: p.id,
        sku: p.sku,
        title: p.title,
        categoryId: p.categoryId,
        brand: p.brand,
        basePrice: p.basePrice,
        currency: p.currency,
        rating: p.rating,
        reviewCount: p.reviewCount,
        inStock: p.inStock,
        attributes: p.attributes?.map((a) => ({ key: a.attributeKey, value: a.attributeValue })),
      })),
    };
  },

  /**
   * Tool 2: Product Detail Retrieval
   */
  getProductDetails: (params: z.input<typeof getProductDetailsSchema>) => {
    const validated = getProductDetailsSchema.parse(params);
    const product = catalogService.getProduct(validated.productId);

    if (!product) {
      throw new Error(`Product with ID "${validated.productId}" not found in catalog.`);
    }

    return {
      id: product.id,
      sku: product.sku,
      title: product.title,
      categoryId: product.categoryId,
      brand: product.brand,
      basePrice: product.basePrice,
      currency: product.currency,
      rating: product.rating,
      reviewCount: product.reviewCount,
      inStock: product.inStock,
      description: product.description,
      imageUrl: product.imageUrl,
      attributes: product.attributes || [],
    };
  },

  /**
   * Tool 3: Side-by-Side Product Comparison
   */
  compareProducts: (params: z.input<typeof compareProductsSchema>) => {
    const validated = compareProductsSchema.parse(params);
    return catalogService.compareProducts(validated.productIds);
  },

  /**
   * Tool 4: Authoritative Budget & Tax Calculation (Minor Units)
   */
  calculateBudget: (params: z.input<typeof calculateBudgetSchema>) => {
    const validated = calculateBudgetSchema.parse(params);
    const lineItems: Array<{ price: number; quantity: number }> = [];

    for (const item of validated.items) {
      const product = productRepository.getById(item.productId);
      if (!product) {
        throw new Error(`Product "${item.productId}" not found in catalog.`);
      }
      lineItems.push({ price: product.basePrice, quantity: item.quantity });
    }

    const totals = Money.calculateTotals(lineItems, validated.taxRate, validated.shippingFee);

    return {
      subtotal: totals.subtotal,
      taxAmount: totals.tax,
      shippingFee: totals.shipping,
      totalAmount: totals.total,
      currency: 'USD',
      itemCount: validated.items.reduce((acc, i) => acc + i.quantity, 0),
    };
  },

  /**
   * Tool 5: Hardware & Feature Compatibility Evaluation
   */
  evaluateCompatibility: (params: z.input<typeof evaluateCompatibilitySchema>) => {
    const validated = evaluateCompatibilitySchema.parse(params);
    const products = productRepository.getByIds(validated.productIds);

    const verifiedMatches: string[] = [];
    const warnings: string[] = [];

    // Extract attributes by product
    const productAttrs = new Map<string, Map<string, string>>();
    for (const p of products) {
      const map = new Map<string, string>();
      p.attributes?.forEach((a) => map.set(a.attributeKey, a.attributeValue));
      productAttrs.set(p.id, map);
    }

    // Check USB-C Power Delivery synergy (Monitor + Laptop)
    const monitor = products.find((p) => p.categoryId === 'monitors');
    const laptop = products.find((p) => p.categoryId === 'laptops');
    if (monitor && laptop) {
      const monAttrs = productAttrs.get(monitor.id);
      const connectivity = monAttrs?.get('connectivity') || '';
      if (connectivity.includes('USB-C') || connectivity.includes('90W')) {
        verifiedMatches.push(
          `Single-cable USB-C connectivity: ${monitor.title} delivers power directly to ${laptop.title}.`
        );
      } else {
        warnings.push(`${monitor.title} does not feature USB-C Power Delivery; separate laptop charger required.`);
      }
    }

    // Check VESA mount compatibility (Monitor + Monitor Arm)
    const arm = products.find((p) => p.id === 'prod_acc_03'); // ErgoLift Heavy-Duty Monitor Arm
    if (arm && monitor) {
      const monAttrs = productAttrs.get(monitor.id);
      const isVesa = monAttrs?.get('vesa_compatible');
      if (isVesa === 'true') {
        verifiedMatches.push(`VESA 100x100 alignment: ${arm.title} mounts seamlessly to ${monitor.title}.`);
      } else {
        warnings.push(`${monitor.title} is not VESA mountable.`);
      }
    }

    // Check wireless ecosystem synergy (Keyboard + Mouse)
    const keyboard = products.find((p) => p.categoryId === 'keyboards');
    const mouse = products.find((p) => p.categoryId === 'mice');
    if (keyboard && mouse) {
      const kbAttrs = productAttrs.get(keyboard.id);
      const mouAttrs = productAttrs.get(mouse.id);
      const kbConn = kbAttrs?.get('connectivity') || '';
      const mouConn = mouAttrs?.get('connectivity') || '';

      if (kbConn.includes('Bluetooth') && mouConn.includes('Bluetooth')) {
        verifiedMatches.push(`Unified Bluetooth workspace: Both ${keyboard.title} and ${mouse.title} support multi-device Bluetooth.`);
      }
    }

    const compatibilityScore = warnings.length === 0 ? 1.0 : Math.max(0.6, 1.0 - warnings.length * 0.2);

    return {
      isCompatible: warnings.length === 0,
      compatibilityScore,
      evaluatedProductCount: products.length,
      verifiedMatches,
      warnings,
    };
  },

  /**
   * Tool 6: Create or Retrieve Shopping Cart
   */
  createOrGetCart: (params: z.input<typeof createOrGetCartSchema>) => {
    const validated = createOrGetCartSchema.parse(params);
    const cart = cartService.getCart(validated.sessionId, validated.intentSessionId);
    return {
      cartId: cart.id,
      sessionId: cart.sessionId,
      intentSessionId: cart.intentSessionId,
      status: cart.status,
      itemCount: cart.items.length,
      totalAmount: cart.totalAmount,
    };
  },

  /**
   * Tool 7: Controlled Cart Modification
   */
  modifyCart: (params: z.input<typeof modifyCartSchema>) => {
    const validated = modifyCartSchema.parse(params);

    if (validated.action === 'add') {
      if (!validated.productId) throw new Error('Action "add" requires "productId"');
      const updated = cartService.addItem(validated.cartId, validated.productId, validated.quantity || 1);
      return { action: 'added', cart: updated };
    }

    if (validated.action === 'remove') {
      if (!validated.itemId) throw new Error('Action "remove" requires "itemId"');
      const updated = cartService.removeItem(validated.cartId, validated.itemId);
      return { action: 'removed', cart: updated };
    }

    if (validated.action === 'update_quantity') {
      if (!validated.itemId || validated.quantity === undefined) {
        throw new Error('Action "update_quantity" requires "itemId" and "quantity"');
      }
      const updated = cartService.updateQuantity(validated.cartId, validated.itemId, validated.quantity);
      return { action: 'updated', cart: updated };
    }

    if (validated.action === 'clear') {
      const updated = cartService.clearCart(validated.cartId);
      return { action: 'cleared', cart: updated };
    }

    throw new Error(`Unsupported cart action: ${validated.action}`);
  },

  /**
   * Controlled Dispatcher for AI Tool Calls.
   * Enforces zero arbitrary SQL and zero payment access.
   */
  executeTool: (tool: AgentToolName, parameters: any): AgentToolResult => {
    const toolCallId = `tc_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    try {
      logger.info(`[Agent Tool Execution] Tool: ${tool}`, parameters);
      let result: any;

      switch (tool) {
        case 'search_products':
          result = agentToolsService.searchProducts(parameters);
          break;
        case 'get_product_details':
          result = agentToolsService.getProductDetails(parameters);
          break;
        case 'compare_products':
          result = agentToolsService.compareProducts(parameters);
          break;
        case 'calculate_budget':
          result = agentToolsService.calculateBudget(parameters);
          break;
        case 'evaluate_compatibility':
          result = agentToolsService.evaluateCompatibility(parameters);
          break;
        case 'create_or_get_cart':
          result = agentToolsService.createOrGetCart(parameters);
          break;
        case 'modify_cart':
          result = agentToolsService.modifyCart(parameters);
          break;
        default:
          throw new Error(`Tool "${tool}" is not recognized or not authorized.`);
      }

      return {
        toolCallId,
        tool,
        success: true,
        result,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      logger.warn(`[Agent Tool Execution Failed] Tool: ${tool}: ${err.message}`);
      return {
        toolCallId,
        tool,
        success: false,
        error: err.message || 'Tool execution encountered an error.',
        timestamp: new Date().toISOString(),
      };
    }
  },
};
