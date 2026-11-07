import { productRepository } from '../db/repository';
import type { Product } from '@paypal-intent/shared';

export interface ProductFilterOptions {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  query?: string;
  attributeKey?: string;
  attributeValue?: string;
  inStockOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface ComparisonResult {
  products: Product[];
  specMatrix: Record<string, Record<string, string>>;
  commonAttributes: string[];
  differingAttributes: string[];
  metrics: {
    count: number;
    lowestPrice: number;
    highestPrice: number;
    priceSpread: number;
    averageRating: number;
    bestValueProductId: string;
  };
}

export const catalogService = {
  listProducts: (filter?: ProductFilterOptions): Product[] => {
    return productRepository.getAll(filter);
  },

  getProduct: (id: string): Product | null => {
    return productRepository.getById(id);
  },

  getCategories: (): Array<{ categoryId: string; count: number; minPrice: number; maxPrice: number }> => {
    return productRepository.getCategories();
  },

  compareProducts: (productIds: string[]): ComparisonResult => {
    const products = productRepository.getByIds(productIds);
    if (products.length === 0) {
      return {
        products: [],
        specMatrix: {},
        commonAttributes: [],
        differingAttributes: [],
        metrics: {
          count: 0,
          lowestPrice: 0,
          highestPrice: 0,
          priceSpread: 0,
          averageRating: 0,
          bestValueProductId: '',
        },
      };
    }

    // Build attribute dictionary per product
    const productAttrMap = new Map<string, Map<string, string>>();
    const allAttrKeys = new Set<string>();

    for (const p of products) {
      const attrMap = new Map<string, string>();
      if (p.attributes) {
        for (const a of p.attributes) {
          attrMap.set(a.attributeKey, a.attributeValue);
          allAttrKeys.add(a.attributeKey);
        }
      }
      productAttrMap.set(p.id, attrMap);
    }

    const specMatrix: Record<string, Record<string, string>> = {};
    const commonAttributes: string[] = [];
    const differingAttributes: string[] = [];

    for (const key of allAttrKeys) {
      specMatrix[key] = {};
      const values = new Set<string>();

      for (const p of products) {
        const val = productAttrMap.get(p.id)?.get(key) || 'N/A';
        specMatrix[key][p.id] = val;
        values.add(val);
      }

      if (values.size === 1 && !values.has('N/A')) {
        commonAttributes.push(key);
      } else {
        differingAttributes.push(key);
      }
    }

    const prices = products.map((p) => p.basePrice);
    const lowestPrice = Math.min(...prices);
    const highestPrice = Math.max(...prices);
    const priceSpread = Math.round((highestPrice - lowestPrice) * 100) / 100;
    const avgRating =
      Math.round((products.reduce((acc, p) => acc + p.rating, 0) / products.length) * 10) / 10;

    // Value score: (rating * 100) / price
    let bestValueProd = products[0];
    let highestValueScore = 0;
    for (const p of products) {
      const score = (p.rating * 100) / Math.max(1, p.basePrice);
      if (score > highestValueScore) {
        highestValueScore = score;
        bestValueProd = p;
      }
    }

    return {
      products,
      specMatrix,
      commonAttributes,
      differingAttributes,
      metrics: {
        count: products.length,
        lowestPrice,
        highestPrice,
        priceSpread,
        averageRating: avgRating,
        bestValueProductId: bestValueProd.id,
      },
    };
  },
};
