import { describe, it, expect } from 'vitest';
import { getDatabase } from '../src/db';
import { sessionRepository, intentRepository, productRepository } from '../src/db/repository';

describe('SQLite Database & Repository Tests', () => {
  it('connects to SQLite and has WAL mode enabled', () => {
    const db = getDatabase();
    expect(db).toBeDefined();
    const pragmaRow = db.prepare('PRAGMA journal_mode;').get() as { journal_mode: string };
    expect(pragmaRow.journal_mode.toLowerCase()).toBe('wal');
  });

  it('verifies all 13 core entities exist in sqlite_master', () => {
    const db = getDatabase();
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .all() as { name: string }[];

    const tableNames = tables.map((t) => t.name);
    const requiredTables = [
      'sessions',
      'user_preferences',
      'intent_sessions',
      'intent_requirements',
      'execution_plans',
      'products',
      'product_attributes',
      'recommendations',
      'shopping_carts',
      'cart_items',
      'orders',
      'payments',
      'transaction_records',
    ];

    for (const table of requiredTables) {
      expect(tableNames).toContain(table);
    }
  });

  it('creates and retrieves anonymous sessions', () => {
    const session = sessionRepository.getOrCreate();
    expect(session.id).toMatch(/^ses_/);
    expect(session.sessionToken).toMatch(/^tok_/);

    const retrieved = sessionRepository.getOrCreate(session.sessionToken);
    expect(retrieved.id).toBe(session.id);
  });

  it('creates intent sessions and queries by ID', () => {
    const session = sessionRepository.getOrCreate();
    const intent = intentRepository.create({
      sessionId: session.id,
      rawPrompt: 'Test goal: Build a home recording studio under $400',
      budgetAmount: 400.0,
      budgetCurrency: 'USD',
    });

    expect(intent.id).toMatch(/^int_/);
    expect(intent.budgetAmount).toBe(400.0);

    const fetched = intentRepository.getById(intent.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.rawPrompt).toBe(intent.rawPrompt);
  });

  it('queries seeded products with category filters', () => {
    const products = productRepository.getAll();
    expect(products.length).toBeGreaterThan(0);

    const laptopProducts = productRepository.getAll({ categoryId: 'laptops' });
    expect(laptopProducts.length).toBeGreaterThan(0);
    expect(laptopProducts[0].categoryId).toBe('laptops');
  });
});
