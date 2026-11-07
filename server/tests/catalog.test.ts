import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { catalogService } from '../src/services/catalog.service';
import { productRepository } from '../src/db/repository';

describe('Product Catalog & Discovery Services', () => {
  const app = createApp();

  const REQUIRED_CATEGORIES = [
    'laptops',
    'monitors',
    'keyboards',
    'mice',
    'headphones',
    'furniture',
    'accessories',
  ];

  it('contains products across all 7 required product categories', () => {
    const categories = catalogService.getCategories();
    const categoryIds = categories.map((c) => c.categoryId.toLowerCase());

    for (const reqCat of REQUIRED_CATEGORIES) {
      expect(categoryIds).toContain(reqCat);
    }
  });

  it('ensures each catalog product contains structured attributes', () => {
    const allProducts = productRepository.getAll();
    expect(allProducts.length).toBeGreaterThanOrEqual(20);

    for (const product of allProducts) {
      expect(product.id).toBeDefined();
      expect(product.sku).toBeDefined();
      expect(product.basePrice).toBeGreaterThan(0);
      expect(product.attributes).toBeDefined();
      expect(product.attributes!.length).toBeGreaterThan(0);

      // Verify attribute structure
      const firstAttr = product.attributes![0];
      expect(firstAttr.attributeKey).toBeDefined();
      expect(firstAttr.attributeValue).toBeDefined();
    }
  });

  it('filters products by category accurately', () => {
    const monitors = catalogService.listProducts({ categoryId: 'monitors' });
    expect(monitors.length).toBeGreaterThanOrEqual(3);
    for (const m of monitors) {
      expect(m.categoryId).toBe('monitors');
    }
  });

  it('filters products by price range (minPrice and maxPrice)', () => {
    const filtered = catalogService.listProducts({ minPrice: 50.0, maxPrice: 150.0 });
    expect(filtered.length).toBeGreaterThan(0);
    for (const p of filtered) {
      expect(p.basePrice).toBeGreaterThanOrEqual(50.0);
      expect(p.basePrice).toBeLessThanOrEqual(150.0);
    }
  });

  it('filters products by specific structured attributes', () => {
    const ipsMonitors = catalogService.listProducts({
      categoryId: 'monitors',
      attributeKey: 'panel_type',
      attributeValue: 'IPS',
    });

    expect(ipsMonitors.length).toBeGreaterThan(0);
    for (const p of ipsMonitors) {
      const panelAttr = p.attributes?.find((a) => a.attributeKey === 'panel_type');
      expect(panelAttr?.attributeValue).toBe('IPS');
    }
  });

  it('searches products by keyword across title, brand, and description', () => {
    const results = catalogService.listProducts({ query: 'Ergonomic' });
    expect(results.length).toBeGreaterThan(0);

    for (const p of results) {
      const match =
        p.title.toLowerCase().includes('ergonomic') ||
        p.description.toLowerCase().includes('ergonomic') ||
        p.brand.toLowerCase().includes('ergonomic');
      expect(match).toBe(true);
    }
  });

  it('generates multi-product comparison matrix with specs, differences, and value metrics', () => {
    const comparison = catalogService.compareProducts(['prod_mon_01', 'prod_mon_02']);
    expect(comparison.products.length).toBe(2);
    expect(comparison.metrics.count).toBe(2);
    expect(comparison.metrics.priceSpread).toBeGreaterThan(0);
    expect(comparison.metrics.bestValueProductId).toBeDefined();

    // Verify common & differing attribute categorisation
    expect(comparison.specMatrix).toBeDefined();
    expect(Object.keys(comparison.specMatrix).length).toBeGreaterThan(0);
  });

  // REST API Endpoints tests via Supertest
  it('GET /api/products returns catalog items with metadata', async () => {
    const res = await request(app).get('/api/products').expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.meta.count).toBe(res.body.data.length);
  });

  it('GET /api/products/categories returns distinct category summaries', async () => {
    const res = await request(app).get('/api/products/categories').expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(7);

    const firstCat = res.body.data[0];
    expect(firstCat.categoryId).toBeDefined();
    expect(firstCat.count).toBeGreaterThan(0);
    expect(firstCat.minPrice).toBeDefined();
    expect(firstCat.maxPrice).toBeDefined();
  });

  it('POST /api/products/compare returns side-by-side spec comparison', async () => {
    const res = await request(app)
      .post('/api/products/compare')
      .send({ productIds: ['prod_lap_01', 'prod_lap_02'] })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.products.length).toBe(2);
    expect(res.body.data.metrics.count).toBe(2);
  });
});
