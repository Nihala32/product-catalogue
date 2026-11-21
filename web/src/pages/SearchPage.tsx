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

  if (!term) {
    return <div className="notice">Enter a search term to find products.</div>;
  }

  return (
    <section>
      <div className="page-title">
        <h1>Results for “{term}”</h1>
        {results.status === 'success' && (
          <p className="muted">
            {results.data.length} {results.data.length === 1 ? 'product' : 'products'} found
          </p>
        )}
      </div>
      <Loadable state={results}>
        {(products) =>
          products.length === 0 ? (
            <div className="notice">
              No products match “{term}”. Try a different word, or browse a category above.
            </div>
          ) : (
            <ProductGrid products={products} label="Search results" />
          )
        }
      </Loadable>
    </section>
  );
}
