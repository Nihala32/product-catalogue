// The only module that knows how to reach the backend.
// Components call these functions and never use fetch directly.

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  rating: { average: number; count: number };
}

export interface CategoryPage {
  category: string;
  topRated: Product[];
  others: Product[];
}

export interface EnquiryInput {
  productId: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  website: string; // honeypot, always empty for real users
}

export interface FieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fields: FieldError[] = [],
  ) {
    super(message);
  }
}

const BASE = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
  } catch {
    throw new ApiError('Could not reach the server. Check your connection and try again.', 0);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(body.error ?? 'Something went wrong', res.status, body.fields ?? []);
  }
  return body as T;
}

export const api = {
  getFeatured: () => request<Product[]>('/products/featured'),
  getCategories: () => request<string[]>('/categories'),
  getCategory: (category: string) =>
    request<CategoryPage>(`/categories/${encodeURIComponent(category)}`),
  search: (term: string) =>
    request<Product[]>(`/products/search?q=${encodeURIComponent(term)}`),
  getProduct: (id: string) => request<Product>(`/products/${encodeURIComponent(id)}`),
  sendEnquiry: (input: EnquiryInput) =>
    request<{ message: string }>('/enquiries', { method: 'POST', body: JSON.stringify(input) }),
};
