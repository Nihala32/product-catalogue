import { useParams } from 'react-router';
import { api } from '../api/client';
import { useApi } from '../api/useApi';
import { Loadable, ProductGrid } from '../components/ProductGrid';

export function CategoryPage() {
  const { category = '' } = useParams();
  const page = useApi(() => api.getCategory(category), [category]);

  return (
    <Loadable state={page}>
      {(data) => (
        <>
          <h1 className="capitalize">{data.category}</h1>
          <section>
            <h2>Top rated</h2>
            <ProductGrid products={data.topRated} label="Top rated in this category" />
          </section>
          {data.others.length > 0 && (
            <section>
              <h2>More in {data.category}</h2>
              <ProductGrid products={data.others} label="More products in this category" />
            </section>
          )}
        </>
      )}
    </Loadable>
  );
}
