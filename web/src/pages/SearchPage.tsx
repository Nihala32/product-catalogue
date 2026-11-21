import { useSearchParams } from 'react-router';
import { api } from '../api/client';
import { useApi } from '../api/useApi';
import { Loadable, ProductGrid } from '../components/ProductGrid';

export function SearchPage() {
  const [params] = useSearchParams();
  const term = params.get('q')?.trim() ?? '';
  // The search term lives in the URL, so results can be shared and the back button works.
  const results = useApi(
    () => (term ? api.search(term) : Promise.resolve([])),
    [term],
  );

  if (!term) return <p>Enter a search term to find products.</p>;

  return (
    <section>
      <h1>Results for “{term}”</h1>
      <Loadable state={results}>
        {(products) =>
          products.length === 0 ? (
            <p>No products match “{term}”.</p>
          ) : (
            <ProductGrid products={products} label="Search results" />
          )
        }
      </Loadable>
    </section>
  );
}
