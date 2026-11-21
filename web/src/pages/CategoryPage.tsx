import { Link, useParams } from 'react-router';
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
          <nav aria-label="Breadcrumb" className="breadcrumb">
            <Link to="/">Home</Link> / <span className="capitalize">{data.category}</span>
          </nav>
          <div className="page-title">
            <h1 className="capitalize">{data.category}</h1>
            <p className="muted">{data.topRated.length + data.others.length} products</p>
          </div>
          <section className="section">
            <div className="section-head">
              <h2>Top rated</h2>
              <p className="muted">Best rated in this category</p>
            </div>
            <ProductGrid products={data.topRated} label="Top rated in this category" />
          </section>
          {data.others.length > 0 && (
            <section className="section">
              <div className="section-head">
                <h2>
                  More in <span className="capitalize">{data.category}</span>
                </h2>
              </div>
              <ProductGrid products={data.others} label="More products in this category" />
            </section>
          )}
        </>
      )}
    </Loadable>
  );
}
