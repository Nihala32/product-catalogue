import { useState, type FormEvent } from 'react';
import { Link, NavLink, Outlet, useNavigate, useSearchParams } from 'react-router';
import { api } from '../api/client';
import { useApi } from '../api/useApi';

export function SearchBar() {
  const [params] = useSearchParams();
  const [term, setTerm] = useState(params.get('q') ?? '');
  const navigate = useNavigate();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = term.trim();
    if (trimmed) navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <form role="search" onSubmit={onSubmit} className="search">
      <label htmlFor="search-input" className="visually-hidden">
        Search products
      </label>
      <svg className="search-icon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        id="search-input"
        type="search"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Search products"
        maxLength={100}
      />
      <button type="submit">Search</button>
    </form>
  );
}

function CategoryNav() {
  const categories = useApi(() => api.getCategories(), []);
  if (categories.status !== 'success') return null;
  return (
    <nav aria-label="Categories" className="categories">
      <div className="container categories-inner">
        {categories.data.map((c) => (
          <NavLink key={c} to={`/category/${encodeURIComponent(c)}`} className="pill">
            {c}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export function Layout() {
  return (
    <div className="page">
      <header className="header">
        <div className="container header-inner">
          <Link to="/" className="brand">
            <span className="brand-mark" aria-hidden="true" />
            Catalogue
          </Link>
          <SearchBar />
        </div>
      </header>
      <CategoryNav />
      <main className="container main">
        <Outlet />
      </main>
      <footer className="footer">
        <div className="container">Product catalogue · proof of concept</div>
      </footer>
    </div>
  );
}
