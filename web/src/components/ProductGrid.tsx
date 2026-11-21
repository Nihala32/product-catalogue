import type { ReactNode } from 'react';
import { Link } from 'react-router';
import type { Product } from '../api/client';
import type { ApiState } from '../api/useApi';

export const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);

export function ProductTile({ product }: { product: Product }) {
  return (
    <li className="tile">
      <Link to={`/products/${product.id}`}>
        <img src={product.imageUrl} alt="" loading="lazy" />
        <span className="tile-title">{product.title}</span>
        <span className="tile-meta">
          {formatPrice(product.price)} · ★ {product.rating.average.toFixed(1)}
        </span>
      </Link>
    </li>
  );
}

export function ProductGrid({ products, label }: { products: Product[]; label: string }) {
  return (
    <ul className="grid" aria-label={label}>
      {products.map((p) => (
        <ProductTile key={p.id} product={p} />
      ))}
    </ul>
  );
}

/** Shows a loading or error message, or renders the content once the data has arrived. */
export function Loadable<T>({
  state,
  children,
}: {
  state: ApiState<T>;
  children: (data: T) => ReactNode;
}) {
  if (state.status === 'loading') return <p role="status">Loading…</p>;
  if (state.status === 'error') return <p role="alert">{state.message}</p>;
  return <>{children(state.data)}</>;
}
