import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotice } from '../context/NoticeContext';
import { CategoryNav } from './CategoryNav';
import { BrandLogo, CartIcon, SearchIcon } from './Icons';

function SearchForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const urlQuery = location.pathname === '/products' ? (params.get('q') ?? '') : '';
  const [query, setQuery] = useState(urlQuery);

  // Keep the box in sync with the URL (e.g. browser back/forward between searches).
  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/products?q=${encodeURIComponent(q)}` : '/products');
  };

  return (
    <form className="search" role="search" onSubmit={onSubmit} data-testid="search-form">
      <label htmlFor="site-search" className="sr-only">
        Search products
      </label>
      <input
        id="site-search"
        type="search"
        className="search__input"
        placeholder="Search products, brands and categories"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
        enterKeyHint="search"
        data-testid="product-search"
      />
      <button type="submit" className="search__button" data-testid="search-submit">
        <SearchIcon />
        <span className="sr-only">Search</span>
      </button>
    </form>
  );
}

export function Header() {
  const { user, logout } = useAuth();
  const { summary } = useCart();
  const { notify } = useNotice();
  const navigate = useNavigate();
  const location = useLocation();
  const [signingOut, setSigningOut] = useState(false);

  const onAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const redirect = onAuthPage ? '' : `?redirect=${encodeURIComponent(location.pathname + location.search)}`;
  const count = summary.itemCount;

  const onLogout = async () => {
    setSigningOut(true);
    // Leave protected pages first so RequireAuth doesn't bounce to /login once the session ends.
    navigate('/');
    await logout();
    setSigningOut(false);
    notify('You have been signed out.', 'info');
  };

  return (
    <header className="site-header">
      <div className="container site-header__bar">
        <Link to="/" className="brand" data-testid="brand-link" aria-label="ShopNest home">
          <BrandLogo />
          <span className="brand__name">
            Shop<span>Nest</span>
          </span>
        </Link>

        <SearchForm />

        <nav className="account-nav" aria-label="Account">
          {user ? (
            <>
              <span className="account-nav__greeting" data-testid="user-greeting">
                Hello, {user.name.split(' ')[0]}
              </span>
              <Link to="/orders" className="account-nav__link" data-testid="orders-link">
                My Orders
              </Link>
              <button
                type="button"
                className="account-nav__link account-nav__button"
                onClick={onLogout}
                disabled={signingOut}
                data-testid="logout-button"
              >
                {signingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </>
          ) : (
            <>
              <Link to={`/login${redirect}`} className="account-nav__link" data-testid="login-link">
                Sign in
              </Link>
              <Link to={`/register${redirect}`} className="account-nav__link" data-testid="register-link">
                Register
              </Link>
            </>
          )}
          <Link
            to="/cart"
            className="cart-link"
            data-testid="cart-link"
            aria-label={`Cart, ${count} ${count === 1 ? 'item' : 'items'}`}
          >
            <CartIcon />
            <span className="cart-link__count" data-testid="cart-count" aria-hidden="true">
              {count}
            </span>
            <span className="cart-link__label" aria-hidden="true">
              Cart
            </span>
          </Link>
        </nav>
      </div>
      <CategoryNav />
    </header>
  );
}
