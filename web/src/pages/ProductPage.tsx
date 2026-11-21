import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { api } from '../api/client';
import { useApi } from '../api/useApi';
import { EnquiryForm } from '../components/EnquiryForm';
import { formatPrice, Loadable, Rating } from '../components/ProductGrid';

export function ProductPage() {
  const { id = '' } = useParams();
  const product = useApi(() => api.getProduct(id), [id]);
  const [enquiring, setEnquiring] = useState(false);

  return (
    <Loadable state={product}>
      {(p) => (
        <>
          <nav aria-label="Breadcrumb" className="breadcrumb">
            <Link to="/">Home</Link> /{' '}
            <Link to={`/category/${encodeURIComponent(p.category)}`} className="capitalize">
              {p.category}
            </Link>
          </nav>
          <article className="product">
            <div className="product-image">
              <img src={p.imageUrl} alt={p.title} />
            </div>
            <div className="product-info">
              <span className="eyebrow">{p.category}</span>
              <h1>{p.title}</h1>
              <Rating average={p.rating.average} count={p.rating.count} />
              <p className="price">{formatPrice(p.price)}</p>
              <p className="description">{p.description}</p>
              {enquiring ? (
                <div className="card">
                  <h2>Enquire about this product</h2>
                  <p className="muted">Leave your details and our sales team will contact you.</p>
                  <EnquiryForm productId={p.id} />
                </div>
              ) : (
                <button type="button" className="button-large" onClick={() => setEnquiring(true)}>
                  Enquire
                </button>
              )}
            </div>
          </article>
        </>
      )}
    </Loadable>
  );
}
