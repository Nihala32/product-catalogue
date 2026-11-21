import { describe, expect, it } from 'vitest';
import { CatalogueService } from '../src/products/catalogueService.js';
import { InMemoryProductSource } from './fixtures.js';

const service = (featured = ['3', '1', '9', '5', '6']) =>
  new CatalogueService(new InMemoryProductSource(), featured, 2);

describe('CatalogueService', () => {
  describe('getFeatured', () => {
    it('returns the 5 chosen products in the chosen order', async () => {
      const featured = await service().getFeatured();
      expect(featured.map((p) => p.id)).toEqual(['3', '1', '9', '5', '6']);
    });

    it('fills missing or duplicate IDs with the best-rated products so there are always 5', async () => {
      const featured = await service(['3', '3', 'does-not-exist']).getFeatured();
      expect(featured).toHaveLength(5);
      // 3 first (chosen), then best rated: 7 and 8 (4.8; 7 has more ratings), 2 (4.1), 1 (3.9)
      expect(featured.map((p) => p.id)).toEqual(['3', '7', '8', '2', '1']);
    });
  });

  describe('getCategory', () => {
    it('splits a category into top rated and the rest, best rated first', async () => {
      const page = await service().getCategory('electronics');
      expect(page?.topRated.map((p) => p.id)).toEqual(['7', '8']);
      expect(page?.others.map((p) => p.id)).toEqual(['5', '6']);
    });

    it('matches the category case-insensitively', async () => {
      const page = await service().getCategory('ELECTRONICS');
      expect(page?.category).toBe('electronics');
    });

    it('returns undefined for an unknown category', async () => {
      expect(await service().getCategory('toys')).toBeUndefined();
    });
  });

  describe('search', () => {
    it('only returns products whose title, description or category contains the term', async () => {
      const results = await service().search('storage');
      expect(results.map((p) => p.id).sort()).toEqual(['5', '7']);
    });

    it('is case-insensitive and ignores surrounding spaces', async () => {
      const results = await service().search('  BACKPACK ');
      expect(results.map((p) => p.id)).toEqual(['1']);
    });

    it('returns nothing for a blank term', async () => {
      expect(await service().search('   ')).toEqual([]);
    });
  });

  it('lists unique categories alphabetically', async () => {
    expect(await service().getCategories()).toEqual([
      'electronics',
      'jewelery',
      "men's clothing",
      "women's clothing",
    ]);
  });
});
