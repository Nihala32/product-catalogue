import { api } from '../api/client';
import { useApi } from '../api/useApi';
import { Loadable, ProductGrid } from '../components/ProductGrid';

export function HomePage() {
  const featured = useApi(() => api.getFeatured(), []);
  return (
    <section>
      <h1>Top rated</h1>
      <Loadable state={featured}>
        {(products) => <ProductGrid products={products} label="Top rated products" />}
      </Loadable>
    </section>
  );
}
