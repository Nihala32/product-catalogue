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
      {categories.data.map((c) => (
        <NavLink key={c} to={`/category/${encodeURIComponent(c)}`}>
          {c}
        </NavLink>
      ))}
    </nav>
  );
}

export function Layout() {
  return (
    <>
      <header className="header">
        <Link to="/" className="brand">
          Catalogue
        </Link>
        <SearchBar />
      </header>
      <CategoryNav />
      <main className="main">
        <Outlet />
      </main>
    </>
  );
}
