import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { CATEGORIES } from '../data/categories';

export function CategoryNav() {
  const location = useLocation();
  const [params] = useSearchParams();
  const onListing = location.pathname === '/products';
  const active = onListing ? params.get('category') : null;
  const allActive = onListing && !active && !params.get('q');

  return (
    <nav className="category-nav" aria-label="Product categories">
      <ul className="container category-nav__list">
        <li>
          <Link
            to="/products"
            className={`category-nav__link${allActive ? ' is-active' : ''}`}
            aria-current={allActive ? 'page' : undefined}
            data-testid="category-link-all"
          >
            All Products
          </Link>
        </li>
        {CATEGORIES.map((c) => (
          <li key={c.slug}>
            <Link
              to={`/products?category=${c.slug}`}
              className={`category-nav__link${active === c.slug ? ' is-active' : ''}`}
              aria-current={active === c.slug ? 'page' : undefined}
              data-testid={`category-link-${c.slug}`}
            >
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
