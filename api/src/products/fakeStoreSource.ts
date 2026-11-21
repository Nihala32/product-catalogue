import { z } from 'zod';
import type { Product, ProductSource } from './product.js';

// Validate the upstream payload so a change on their side fails loudly here,
// not as a confusing error in the UI.
const fakeStoreProduct = z.object({
  id: z.number(),
  title: z.string(),
  price: z.number(),
  description: z.string(),
  category: z.string(),
  image: z.string(),
  rating: z.object({ rate: z.number(), count: z.number() }).optional(),
});

type FakeStoreProduct = z.infer<typeof fakeStoreProduct>;

export class UpstreamError extends Error {}

function toProduct(p: FakeStoreProduct): Product {
  return {
    id: String(p.id),
    title: p.title,
    description: p.description,
    price: p.price,
    category: p.category,
    imageUrl: p.image,
    rating: { average: p.rating?.rate ?? 0, count: p.rating?.count ?? 0 },
  };
}

interface Options {
  baseUrl: string;
  cacheTtlMs: number;
  timeoutMs: number;
  fetchFn?: typeof fetch;
}

/**
 * Reads products from the Fake Store API.
 * The catalogue is small, so we fetch the full list once and cache it in memory.
 * That keeps the free public API from being hit on every request.
 */
export class FakeStoreProductSource implements ProductSource {
  private cache?: { products: Product[]; expiresAt: number };
  private readonly fetchFn: typeof fetch;

  constructor(private readonly options: Options) {
    this.fetchFn = options.fetchFn ?? fetch;
  }

  async listProducts(): Promise<Product[]> {
    const now = Date.now();
    if (this.cache && this.cache.expiresAt > now) return this.cache.products;

    let response: Response;
    try {
      response = await this.fetchFn(`${this.options.baseUrl}/products`, {
        signal: AbortSignal.timeout(this.options.timeoutMs),
      });
    } catch (err) {
      throw new UpstreamError('Product service is unreachable', { cause: err });
    }
    if (!response.ok) {
      throw new UpstreamError(`Product service returned ${response.status}`);
    }

    const parsed = z.array(fakeStoreProduct).safeParse(await response.json());
    if (!parsed.success) {
      throw new UpstreamError('Product service returned unexpected data');
    }

    const products = parsed.data.map(toProduct);
    this.cache = { products, expiresAt: now + this.options.cacheTtlMs };
    return products;
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const products = await this.listProducts();
    return products.find((p) => p.id === id);
  }
}
