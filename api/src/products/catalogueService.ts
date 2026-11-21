import type { Product, ProductSource } from './product.js';

export const FEATURED_COUNT = 5;

export interface CategoryPage {
  category: string;
  topRated: Product[];
  others: Product[];
}

const byRating = (a: Product, b: Product) =>
  b.rating.average - a.rating.average || b.rating.count - a.rating.count;

/**
 * Business rules for the catalogue. It only talks to the ProductSource
 * interface, so it does not know or care where products come from.
 */
export class CatalogueService {
  constructor(
    private readonly source: ProductSource,
    /** Product IDs the owner has chosen as "top rated" for the home page. */
    private readonly featuredIds: string[],
    private readonly categoryTopRatedCount = 3,
  ) {}

  /**
   * The owner's chosen products, in the order they chose them.
   * If an ID no longer exists, the slot is filled with the next best-rated
   * product so the home page always shows FEATURED_COUNT items.
   */
  async getFeatured(): Promise<Product[]> {
    const products = await this.source.listProducts();
    const byId = new Map(products.map((p) => [p.id, p]));
    const chosen = this.featuredIds
      .map((id) => byId.get(id))
      .filter((p): p is Product => p !== undefined);

    const unique = [...new Map(chosen.map((p) => [p.id, p])).values()];
    if (unique.length < FEATURED_COUNT) {
      const fillers = [...products]
        .sort(byRating)
        .filter((p) => !unique.some((c) => c.id === p.id));
      unique.push(...fillers.slice(0, FEATURED_COUNT - unique.length));
    }
    return unique.slice(0, FEATURED_COUNT);
  }

  async getCategories(): Promise<string[]> {
    const products = await this.source.listProducts();
    return [...new Set(products.map((p) => p.category))].sort();
  }

  /** Top rated products in a category, then the rest. Undefined if the category does not exist. */
  async getCategory(category: string): Promise<CategoryPage | undefined> {
    const products = await this.source.listProducts();
    const inCategory = products.filter(
      (p) => p.category.toLowerCase() === category.toLowerCase(),
    );
    if (inCategory.length === 0) return undefined;

    const sorted = [...inCategory].sort(byRating);
    return {
      category: inCategory[0].category,
      topRated: sorted.slice(0, this.categoryTopRatedCount),
      others: sorted.slice(this.categoryTopRatedCount),
    };
  }

  /** Case-insensitive match of the whole search term against title, description or category. */
  async search(term: string): Promise<Product[]> {
    const needle = term.trim().toLowerCase();
    if (!needle) return [];
    const products = await this.source.listProducts();
    return products.filter((p) =>
      [p.title, p.description, p.category].some((text) =>
        text.toLowerCase().includes(needle),
      ),
    );
  }

  getProduct(id: string): Promise<Product | undefined> {
    return this.source.getProduct(id);
  }
}
