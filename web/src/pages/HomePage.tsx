import { api } from '../api/client';
import { useApi } from '../api/useApi';
import { Loadable, ProductGrid } from '../components/ProductGrid';

export function HomePage() {
  const featured = useApi(() => api.getFeatured(), []);
  return (
    <>
      <section className="hero">
        <p className="eyebrow">Welcome</p>
        <h1>Find something you will love</h1>
        <p className="hero-text">
          Browse our hand-picked favourites, explore by category, or search for exactly what you
          need. Questions about a product? Send us an enquiry and our team will get back to you.
        </p>
      </section>
      <section className="section">
        <div className="section-head">
          <h2>Top rated</h2>
          <p className="muted">Our team's top picks</p>
        </div>
        <Loadable state={featured}>
          {(products) => <ProductGrid products={products} label="Top rated products" />}
        </Loadable>
      </section>
    </>
  );
}
