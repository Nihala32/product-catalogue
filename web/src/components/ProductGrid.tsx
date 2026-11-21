import type { ReactNode } from 'react';
import { Link } from 'react-router';
import type { Product } from '../api/client';
import type { ApiState } from '../api/useApi';

export const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);

export function Rating({ average, count }: { average: number; count?: number }) {
  const percent = Math.max(0, Math.min(100, (average / 5) * 100));
  return (
    <span className="rating" aria-label={`Rated ${average.toFixed(1)} out of 5`}>
      <span className="stars" aria-hidden="true">
        <span className="stars-fill" style={{ width: `${percent}%` }}>
          ★★★★★
        </span>
        ★★★★★
      </span>
      <span className="rating-value" aria-hidden="true">
        {average.toFixed(1)}
        {count !== undefined && <span className="muted"> ({count})</span>}
      </span>
    </span>
  );
}

export function ProductTile({ product }: { product: Product }) {
  return (
    <li className="tile">
      <Link to={`/products/${product.id}`}>
        <span className="tile-image">
          <img src={product.imageUrl} alt="" loading="lazy" />
        </span>
        <span className="tile-body">
          <span className="eyebrow">{product.category}</span>
          <span className="tile-title">{product.title}</span>
          <Rating average={product.rating.average} count={product.rating.count} />
          <span className="tile-price">{formatPrice(product.price)}</span>
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

function SkeletonGrid() {
  return (
    <div role="status">
      <span className="visually-hidden">Loading…</span>
      <ul className="grid" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <li key={i} className="tile skeleton">
            <span className="tile-image" />
            <span className="tile-body">
              <span className="skeleton-line short" />
              <span className="skeleton-line" />
              <span className="skeleton-line short" />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Shows a loading skeleton or an error message, or renders the content once the data has arrived. */
export function Loadable<T>({
  state,
  children,
}: {
  state: ApiState<T>;
  children: (data: T) => ReactNode;
}) {
  if (state.status === 'loading') return <SkeletonGrid />;
  if (state.status === 'error') {
    return (
      <div className="notice notice-error" role="alert">
        {state.message}
      </div>
    );
  }
  return <>{children(state.data)}</>;
}
