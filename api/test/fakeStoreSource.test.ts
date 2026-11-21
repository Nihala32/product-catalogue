import { describe, expect, it, vi } from 'vitest';
import { FakeStoreProductSource, UpstreamError } from '../src/products/fakeStoreSource.js';

const upstreamProduct = {
  id: 1,
  title: 'Backpack',
  price: 109.95,
  description: 'Fits 15 inch laptops',
  category: "men's clothing",
  image: 'https://fakestoreapi.com/img/1.jpg',
  rating: { rate: 3.9, count: 120 },
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const makeSource = (fetchFn: typeof fetch) =>
  new FakeStoreProductSource({ baseUrl: 'https://fake.test', cacheTtlMs: 60_000, timeoutMs: 1000, fetchFn });

describe('FakeStoreProductSource', () => {
  it('maps the Fake Store shape to our Product model', async () => {
    const source = makeSource(vi.fn(async () => jsonResponse([upstreamProduct])));
    expect(await source.getProduct('1')).toEqual({
      id: '1',
      title: 'Backpack',
      price: 109.95,
      description: 'Fits 15 inch laptops',
      category: "men's clothing",
      imageUrl: 'https://fakestoreapi.com/img/1.jpg',
      rating: { average: 3.9, count: 120 },
    });
  });

  it('caches the product list instead of calling the API every time', async () => {
    const fetchFn = vi.fn(async () => jsonResponse([upstreamProduct]));
    const source = makeSource(fetchFn);
    await source.listProducts();
    await source.listProducts();
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('throws UpstreamError on a failed response', async () => {
    const source = makeSource(vi.fn(async () => jsonResponse({}, 503)));
    await expect(source.listProducts()).rejects.toBeInstanceOf(UpstreamError);
  });

  it('throws UpstreamError when the data has an unexpected shape', async () => {
    const source = makeSource(vi.fn(async () => jsonResponse([{ id: 'x' }])));
    await expect(source.listProducts()).rejects.toBeInstanceOf(UpstreamError);
  });

  it('throws UpstreamError when the API is unreachable', async () => {
    const source = makeSource(vi.fn(async () => {
      throw new TypeError('fetch failed');
    }));
    await expect(source.listProducts()).rejects.toBeInstanceOf(UpstreamError);
  });
});
