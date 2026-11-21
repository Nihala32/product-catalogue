import type { EmailMessage, EmailSender } from '../src/enquiry/enquiry.js';
import type { Product, ProductSource } from '../src/products/product.js';

export const product = (overrides: Partial<Product> & { id: string }): Product => ({
  title: `Product ${overrides.id}`,
  description: 'A test product',
  price: 10,
  category: 'electronics',
  imageUrl: 'https://example.com/image.png',
  rating: { average: 3, count: 10 },
  ...overrides,
});

export const sampleProducts: Product[] = [
  product({ id: '1', title: 'Hiking Backpack', category: "men's clothing", rating: { average: 3.9, count: 120 } }),
  product({ id: '2', title: 'Cotton Shirt', category: "men's clothing", rating: { average: 4.1, count: 259 } }),
  product({ id: '3', title: 'Silver Ring', category: 'jewelery', rating: { average: 4.6, count: 400 } }),
  product({ id: '4', title: 'Gold Bracelet', category: 'jewelery', rating: { average: 3.0, count: 70 } }),
  product({ id: '5', title: 'USB Drive', description: 'Fast portable storage', category: 'electronics', rating: { average: 3.3, count: 203 } }),
  product({ id: '6', title: 'Gaming Monitor', category: 'electronics', rating: { average: 2.2, count: 140 } }),
  product({ id: '7', title: 'SSD 1TB', description: 'Solid state storage', category: 'electronics', rating: { average: 4.8, count: 319 } }),
  product({ id: '8', title: 'Wireless Mouse', category: 'electronics', rating: { average: 4.8, count: 100 } }),
  product({ id: '9', title: 'Rain Jacket', category: "women's clothing", rating: { average: 2.6, count: 235 } }),
];

export class InMemoryProductSource implements ProductSource {
  constructor(private readonly products: Product[] = sampleProducts) {}
  async listProducts() {
    return this.products;
  }
  async getProduct(id: string) {
    return this.products.find((p) => p.id === id);
  }
}

/** Records emails instead of sending them. */
export class FakeEmailSender implements EmailSender {
  sent: EmailMessage[] = [];
  async send(message: EmailMessage) {
    this.sent.push(message);
  }
}
