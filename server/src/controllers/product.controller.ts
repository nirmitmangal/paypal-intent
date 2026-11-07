import { Request, Response } from 'express';
import { catalogService } from '../services/catalog.service';
import type { ApiResponse, Product } from '@paypal-intent/shared';

export const productController = {
  getProducts: (req: Request, res: Response): void => {
    try {
      const { category, minPrice, maxPrice, query, attributeKey, attributeValue, limit, offset } = req.query;

      const products = catalogService.listProducts({
        categoryId: category ? String(category) : undefined,
        minPrice: minPrice !== undefined ? parseFloat(String(minPrice)) : undefined,
        maxPrice: maxPrice !== undefined ? parseFloat(String(maxPrice)) : undefined,
        query: query ? String(query) : undefined,
        attributeKey: attributeKey ? String(attributeKey) : undefined,
        attributeValue: attributeValue ? String(attributeValue) : undefined,
        limit: limit ? parseInt(String(limit), 10) : undefined,
        offset: offset ? parseInt(String(offset), 10) : undefined,
      });

      const response: ApiResponse<Product[]> = {
        success: true,
        data: products,
        meta: {
          count: products.length,
          timestamp: new Date().toISOString(),
        },
      };

      res.json(response);
    } catch (err) {
      res.status(500).json({
        success: false,
        error: { code: 'PRODUCTS_FETCH_FAILED', message: (err as Error).message },
      });
    }
  },

  getCategories: (_req: Request, res: Response): void => {
    try {
      const categories = catalogService.getCategories();
      res.json({
        success: true,
        data: categories,
        meta: { count: categories.length, timestamp: new Date().toISOString() },
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: { code: 'CATEGORIES_FETCH_FAILED', message: (err as Error).message },
      });
    }
  },

  getProductById: (req: Request, res: Response): void => {
    try {
      const id = String(req.params.id);
      const product = catalogService.getProduct(id);

      if (!product) {
        res.status(404).json({
          success: false,
          error: { code: 'PRODUCT_NOT_FOUND', message: `Product ${id} not found` },
        });
        return;
      }

      res.json({
        success: true,
        data: product,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: { code: 'PRODUCT_FETCH_FAILED', message: (err as Error).message },
      });
    }
  },

  compareProducts: (req: Request, res: Response): void => {
    try {
      const { productIds } = req.body;
      if (!Array.isArray(productIds) || productIds.length === 0) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'Field "productIds" must be a non-empty array of IDs' },
        });
        return;
      }

      const result = catalogService.compareProducts(productIds);
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: { code: 'COMPARE_FAILED', message: (err as Error).message },
      });
    }
  },
};
