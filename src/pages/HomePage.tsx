import { Link } from 'react-router-dom';
import { ProductGrid } from '../components/ProductCard';
import { LoadingState, MessageState } from '../components/StatusViews';
import { CATEGORIES } from '../data/categories';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { productService } from '../services/productService';

const FEATURED_COUNT = 10;

export function HomePage() {
  useDocumentTitle('');
  const { state, reload } = useAsync(() => productService.listProducts(), []);

  return (
    <div className="page page--home" data-testid="home-page">
      <section className="hero" aria-labelledby="home-heading">
        <div className="hero__content">
          <p className="hero__eyebrow">Big savings, every day</p>
          <h1 id="home-heading" className="hero__title">
            Welcome to ShopNest
          </h1>
          <p className="hero__text">
            Electronics, fashion, home essentials, books and accessories at great prices. Free delivery on orders of
            ₹499 or more.
          </p>
          <Link to="/products" className="button button--accent button--large" data-testid="shop-now">
            Shop all products
          </Link>
        </div>
      </section>

      <section aria-labelledby="categories-heading" className="section">
        <h2 id="categories-heading" className="section__title">
          Shop by category
        </h2>
        <ul className="category-tiles">
          {CATEGORIES.map((c) => (
            <li key={c.slug}>
              <Link to={`/products?category=${c.slug}`} className="category-tile" data-testid={`category-tile-${c.slug}`}>
                <span className="category-tile__name">{c.name}</span>
                <span className="category-tile__desc">{c.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="featured-heading" className="section">
        <div className="section__header">
          <h2 id="featured-heading" className="section__title">
            Featured products
          </h2>
          <Link to="/products" className="link-arrow" data-testid="view-all-products">
            View all products
          </Link>
        </div>
        {state.status === 'loading' && <LoadingState label="Loading products…" />}
        {state.status === 'error' && (
          <MessageState
            tone="error"
            testId="products-error"
            title="We couldn't load products"
            message={state.error.message}
            actions={
              <button type="button" className="button" onClick={reload}>
                Try again
              </button>
            }
          />
        )}
        {state.status === 'success' && <ProductGrid products={state.data.slice(0, FEATURED_COUNT)} testId="featured-products" />}
      </section>
    </div>
  );
}
