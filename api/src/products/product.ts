/**
 * Our own product model. The rest of the app depends on this shape,
 * never on the Fake Store API's shape, so the data source can change
 * without touching routes or the frontend.
 */
export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  rating: { average: number; count: number };
}

/** A source of product data (Fake Store API today, a real PIM or database later). */
export interface ProductSource {
  listProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
}
