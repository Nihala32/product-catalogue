import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Product } from '../api/client';
import { App } from '../App';

const product = (id: string, title: string, category = 'electronics'): Product => ({
  id,
  title,
  description: `${title} description`,
  price: 10,
  category,
  imageUrl: `https://example.com/${id}.png`,
  rating: { average: 4, count: 10 },
});

const products = [
  product('1', 'Hiking Backpack', "men's clothing"),
  product('2', 'Silver Ring', 'jewelery'),
  product('3', 'SSD 1TB'),
  product('4', 'USB Drive'),
  product('5', 'Rain Jacket', "women's clothing"),
];

const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }));

/** A fake backend: the tests check what the UI does with the API's answers. */
let enquiryResponse: () => Promise<Response>;
let enquiryBodies: unknown[];

beforeEach(() => {
  enquiryBodies = [];
  enquiryResponse = () => json({ message: 'Thank you' }, 201);
  vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
    const url = new URL(String(input), 'http://localhost');
    const path = url.pathname;
    if (path === '/api/categories') return json(['electronics', 'jewelery']);
    if (path === '/api/products/featured') return json(products);
    if (path === '/api/products/search') {
      const q = url.searchParams.get('q')!.toLowerCase();
      return json(products.filter((p) => p.title.toLowerCase().includes(q)));
    }
    if (path === '/api/categories/electronics') {
      return json({ category: 'electronics', topRated: [products[2]], others: [products[3]] });
    }
    if (path.startsWith('/api/products/')) {
      const found = products.find((p) => p.id === path.split('/').pop());
      return found ? json(found) : json({ error: 'Product not found' }, 404);
    }
    if (path === '/api/enquiries') {
      enquiryBodies.push(JSON.parse(String(init?.body)));
      return enquiryResponse();
    }
    return json({ error: 'Not found' }, 404);
  });
});

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );

describe('Catalogue', () => {
  it('shows the 5 featured products on the home page', async () => {
    renderAt('/');
    const grid = await screen.findByRole('list', { name: 'Top rated products' });
    expect(within(grid).getAllByRole('listitem')).toHaveLength(5);
  });

  it('shows top rated and other products on a category page', async () => {
    renderAt('/');
    await userEvent.click(await screen.findByRole('link', { name: 'electronics' }));

    const top = await screen.findByRole('list', { name: 'Top rated in this category' });
    expect(within(top).getByText('SSD 1TB')).toBeInTheDocument();
    const more = screen.getByRole('list', { name: 'More products in this category' });
    expect(within(more).getByText('USB Drive')).toBeInTheDocument();
  });

  it('only shows matching products after searching', async () => {
    renderAt('/');
    await userEvent.type(screen.getByLabelText('Search products'), 'ring');
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));

    const results = await screen.findByRole('list', { name: 'Search results' });
    expect(within(results).getAllByRole('listitem')).toHaveLength(1);
    expect(within(results).getByText('Silver Ring')).toBeInTheDocument();
  });

  it('shows a message when nothing matches', async () => {
    renderAt('/search?q=zzz');
    expect(await screen.findByText(/No products match/)).toBeInTheDocument();
  });

  it('opens the product details page from a tile', async () => {
    renderAt('/');
    await userEvent.click(await screen.findByText('Silver Ring'));
    expect(await screen.findByRole('heading', { name: 'Silver Ring' })).toBeInTheDocument();
    expect(screen.getByText('Silver Ring description')).toBeInTheDocument();
  });

  it('sends an enquiry and shows a thank-you message', async () => {
    renderAt('/products/2');
    await userEvent.click(await screen.findByRole('button', { name: 'Enquire' }));
    await userEvent.type(screen.getByLabelText('Name'), 'Jane');
    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Send enquiry' }));

    expect(await screen.findByText('Thank you!')).toBeInTheDocument();
    expect(enquiryBodies[0]).toMatchObject({ productId: '2', name: 'Jane', email: 'jane@example.com' });
  });

  it('shows field errors from the server and keeps the form', async () => {
    enquiryResponse = () =>
      json({ error: 'Invalid request', fields: [{ field: 'email', message: 'Enter a valid email address' }] }, 400);
    renderAt('/products/2');
    await userEvent.click(await screen.findByRole('button', { name: 'Enquire' }));
    await userEvent.type(screen.getByLabelText('Name'), 'Jane');
    await userEvent.click(screen.getByRole('button', { name: 'Send enquiry' }));

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByText('Thank you!')).not.toBeInTheDocument();
  });

  it('shows an error when the product does not exist', async () => {
    renderAt('/products/999');
    expect(await screen.findByRole('alert')).toHaveTextContent('Product not found');
  });
});
