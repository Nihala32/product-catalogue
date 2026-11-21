import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { api } from '../api/client';
import { useApi } from '../api/useApi';
import { EnquiryForm } from '../components/EnquiryForm';
import { formatPrice, Loadable } from '../components/ProductGrid';

export function ProductPage() {
  const { id = '' } = useParams();
  const product = useApi(() => api.getProduct(id), [id]);
  const [enquiring, setEnquiring] = useState(false);

  return (
    <Loadable state={product}>
      {(p) => (
        <article className="product">
          <img src={p.imageUrl} alt={p.title} />
          <div>
            <Link to={`/category/${encodeURIComponent(p.category)}`} className="capitalize">
              {p.category}
            </Link>
            <h1>{p.title}</h1>
            <p className="price">{formatPrice(p.price)}</p>
            <p>
              ★ {p.rating.average.toFixed(1)} ({p.rating.count} ratings)
            </p>
            <p>{p.description}</p>
            {enquiring ? (
              <EnquiryForm productId={p.id} />
            ) : (
              <button type="button" onClick={() => setEnquiring(true)}>
                Enquire
              </button>
            )}
          </div>
        </article>
      )}
    </Loadable>
  );
}
