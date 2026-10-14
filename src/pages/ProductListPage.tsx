import { Link, useSearchParams } from 'react-router-dom';
import { ProductGrid } from '../components/ProductCard';
import { LoadingState, MessageState } from '../components/StatusViews';
import { getCategory } from '../data/categories';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { isProductSort, productService, SORT_OPTIONS } from '../services/productService';

export function ProductListPage() {
  const [params, setParams] = useSearchParams();
  const q = (params.get('q') ?? '').trim();
  const categorySlug = params.get('category') ?? '';
  const rawSort = params.get('sort');
  const sort = isProductSort(rawSort) ? rawSort : 'featured';
  const category = getCategory(categorySlug);

  const heading = q ? `Search results for "${q}"` : category ? category.name : categorySlug ? 'Category not found' : 'All Products';
  useDocumentTitle(heading);

  const { state, reload } = useAsync(
    () => productService.listProducts({ q, category: categorySlug || undefined, sort }),
    [q, categorySlug, sort],
  );

  const onSortChange = (value: string) => {
    const next = new URLSearchParams(params);
    if (value === 'featured') next.delete('sort');
    else next.set('sort', value);
    setParams(next);
  };

  return (
    <div className="page" data-testid="product-list-page">
      <nav aria-label="Breadcrumb" className="breadcrumbs">
        <ol>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li aria-current="page">{q ? 'Search' : (category?.name ?? 'All Products')}</li>
        </ol>
      </nav>

      <div className="listing-header">
        <div>
          <h1 className="page__title" data-testid="listing-heading">
            {heading}
          </h1>
          {category && !q && <p className="page__subtitle">{category.description}</p>}
          {state.status === 'success' && (
            <p className="listing-header__count" data-testid="results-count" aria-live="polite">
              {state.data.length === 1 ? '1 product' : `${state.data.length} products`}
            </p>
          )}
        </div>
        <div className="sort-control">
          <label htmlFor="sort-select" className="sort-control__label">
            Sort by
          </label>
          <select
            id="sort-select"
            className="input select"
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            data-testid="sort-select"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <section aria-label="Results" data-testid="search-results" data-query={q} data-category={categorySlug}>
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
        {state.status === 'success' && state.data.length === 0 && (
          <MessageState
            testId="no-results"
            title="No products found"
            message={
              q ? (
                <p>
                  We couldn't find any products matching <strong>"{q}"</strong>. Check the spelling or try a more general
                  term.
                </p>
              ) : (
                <p>There are no products in this category.</p>
              )
            }
            actions={
              <Link to="/products" className="button button--primary" data-testid="clear-search">
                Browse all products
              </Link>
            }
          />
        )}
        {state.status === 'success' && state.data.length > 0 && <ProductGrid products={state.data} />}
      </section>
    </div>
  );
}
